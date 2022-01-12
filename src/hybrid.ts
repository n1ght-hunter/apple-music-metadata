import axios from "axios";
import { Document } from "domhandler";
import * as parser from "htmlparser2";
import cheerio from "cheerio";

export interface Track {
  artist: string;
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

export async function getPlaylistArtist(applePage: any) {
  let $ = cheerio.load(applePage.data),
    aTitleDivs = $(".songs-list-row__song-name").toArray(),
    aArtistDivs = $(".songs-list-row__link").toArray(),
    artists = [],
    i,
    j = 0;

  for (i = 0; i < aTitleDivs.length; i++) {
    artists.push(
      // @ts-ignore
      (aArtistDivs[j].children[0] as any).data as string
    );
    j += 3;
  }
  return artists;
}

async function getRawData(
  url: string,
  type: "playlist" | "album"
): Promise<RawAlbum | RawPlaylist | null> {
  const applePage = await axios.get<string>(url);
  const document = parser.parseDocument(applePage.data);
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
          artist: data.byArtist.name,
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
      const artists = await getPlaylistArtist(applePage);
      let i = 0;
      const tracks = data.track.map((t: any) => {
          console.log(t);
          
        const track: Track = {
          artist: artists[() => {
              let index = i
              i = i + 1
              return index
          }],
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

  if (urlType === "song") {
    const album = await getRawData(url, "album");
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

  return await getRawData(url, urlType);
}

export default search;
