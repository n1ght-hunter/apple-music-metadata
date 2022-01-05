import axios from "axios";
import { Document } from "domhandler";
import * as parser from "htmlparser2";

export interface Track {
  author: string;
  duration: string;
  title: string;
  url: string;
  type: "song";
}

export interface RawAlbum {
  artist: {
    name: string;
    url: string;
  };
  datePublished: string;
  genre: string[];
  description: string;
  title: string;
  tracks: Track[];
  type: "album";
}

export interface RawPlaylist {
  author: string;
  description: string;
  title: string;
  numTracks: number;
  tracks: Track[];
  type: "playlist";
}

function getRawData(
  document: Document,
  type: "playlist" | "album"
): RawPlaylist | RawAlbum | null {
  const scripts = parser.DomUtils.findAll((element) => {
    if (element.type !== "script") return false;

    return element.attribs.type === "application/ld+json";
  }, document.children);

  for (const script of scripts) {
    let data = JSON.parse(parser.DomUtils.textContent(script));

    const typex = data["@type"];
    if (typex !== "MusicAlbum" && typex !== "MusicPlaylist") {
      continue;
    }

    if (type === "album") {
      const tracks = data.workExample.map((t: any) => {
        const track: Track = {
          author: data.byArtist.name,
          duration: t.duration,
          title: t.name,
          url: t.url,
          type: "song",
        };
        return track;
      });

      const final: RawAlbum = {
        artist: {
          name: data.byArtist.name,
          url: data.byArtist.url,
        },
        datePublished: data.datePublished,
        description: data.description,
        genre: data.genre,
        title: data.name,
        tracks,
        type,
      };

      return final;
    } else {
      const tracks = data.track.map((t: any) => {
        const track: Track = {
          author: data.author.name,
          duration: t.duration,
          title: t.name,
          url: t.url,
          type: "song",
        };
        return track;
      });

      const final: RawPlaylist = {
        author: data.author.name,
        description: data.description,
        numTracks: data.numTracks,
        title: data.name,
        tracks,
        type,
      };

      return final;
    }
  }

  return null;
}

function linkType(url: string) {
  if (
    RegExp(
      /https?:\/\/music\.apple\.com\/.+?\/album\/.+?\/.+?\?i=([0-9]+)/
    ).test(url)
  ) {
    return "song";
  } else if (
    RegExp(/https?:\/\/music\.apple\.com\/.+?\/playlist\//).test(url)
  ) {
    return "playlist";
  } else if (RegExp(/https?:\/\/music\.apple\.com\/.+?\/album\//).test(url)) {
    return "album";
  } else {
    throw Error("Apple Music link is invalid");
  }
}

async function search(
  url: string
): Promise<RawPlaylist | RawAlbum | Track | null> {
  const urlType = linkType(url);
  const applePage = await axios.get<string>(url);
  const document = parser.parseDocument(applePage.data);

  if (urlType === "song") {
    const album = getRawData(document, "album");
    if (!album || album.type !== "album") {
      return null;
    }

    const match = url.match(
      new RegExp(
        /https?:\/\/music\.apple\.com\/.+?\/album\/.+?\/.+?\?i=([0-9]+)/
      )
    );

    if (!match) {
      return null;
    }

    const id = match[1];
    if (!id) {
      return null;
    }

    return album.tracks.find((t) => t.url.includes(`i=${id}`)) ?? null;
  }

  return getRawData(document, urlType);
}

export default search;
