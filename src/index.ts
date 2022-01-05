import { Document } from "domhandler";
import axios, { AxiosResponse } from "axios";
import parser, { DomUtils } from "htmlparser2";
import axiosRetry from "axios-retry";
import cheerio from "cheerio";

// apple will somtimes reject request due to overload this will retry each request up to 5 times
axiosRetry(axios, { retries: 5 });

export interface RawApplePlaylist {
  name: string;
  type: "playlist" | "album";
  author: string;
  tracks: Track[];
}

export interface RawAppleSong {
  type?: "song";
  artist: string;
  title: string;
  album: string;
}

export interface Track {
  artist: string;
  title: string;
  album: string;
}

export interface PartialSong {
  artist: string;
  album: string;
}

export interface PartialPlaylist {
  name: string;
  type: "playlist";
  author: string;
}

export async function findJSONLD(
  document: Document,
  album: boolean = false,
  fast: boolean = false
): Promise<RawApplePlaylist | PartialSong | PartialPlaylist | undefined> {
  const scripts = DomUtils.findAll((element) => {
    if (element.type !== "script") return false;

    return element.attribs.type === "application/ld+json";
  }, document.children);

  for (const script of scripts) {
    let data = JSON.parse(DomUtils.textContent(script));
    if ("@graph" in data) data = data["@graph"];
    if (data["@type"] === "MusicAlbum" && !album) {
      return {
        artist: data.byArtist.name as string,
        album: data.name as string,
      };
    }
    if (data["@type"] === "MusicAlbum" && album) {
      let { name, byArtist, tracks } = data;

      return {
        type: "album",
        name: name as string,
        author: byArtist.name as string,
        tracks: tracks.map((songData: any) => {
          return {
            artist: byArtist.name as string,
            title: songData.name as string,
          };
        }),
      };
    }
    if (data["@type"] === "MusicPlaylist" && fast) {
      let { name, author } = data;
      return {
        type: "playlist",
        name: name as string,
        author: author.name as string,
      };
    }
    if (data["@type"] === "MusicPlaylist") {
      let { name, author, track } = data;
      return {
        type: "playlist",
        name: name as string,
        author: author.name as string,
        tracks: await Promise.all(
          track.map(async (songData: any) => await search(songData.url))
        ),
      };
    }
  }
}

export async function fastPlaylist(result: AxiosResponse<string, any>) {
  let $ = cheerio.load(result.data),
    aTitleDivs = $(".songs-list-row__song-name").toArray(),
    aArtistDivs = $(".songs-list-row__link").toArray(),
    Playlist = [],
    i,
    j = 0;

  for (i = 0; i < aTitleDivs.length; i++) {
    Playlist.push({
      album: (aArtistDivs[j + 2].children[0] as any).data as string,
      artist: (aArtistDivs[j].children[0] as any).data as string,
      title: (aTitleDivs[i].children[0] as any).data as string,
    });
    j += 3;
  }
  return Playlist;
}

function linkType(url: string) {
  if (
    RegExp(/https?:\/\/music\.apple\.com\/.+?\/playlist\//).test(url) ||
    !url.includes("?i=")
  ) {
    return "playlist";
  } else if (
    RegExp(/https?:\/\/music\.apple\.com\/.+?\/album\/.+?\/.+?\?i=/).test(url)
  ) {
    return "song";
  } else {
    throw Error("Apple Music link is invalid");
  }
}

/**
 * @param {string} url
 * @returns {Promise<Promise<RawApplePlaylist|RawAppleSong|undefined>>}
 */
export async function search(
  url: string
): Promise<RawApplePlaylist | RawAppleSong | undefined> {
  const urlType = linkType(url);
  const applePage = await axios.get<string>(url);
  const document = parser.parseDocument(applePage.data);

  if (urlType === "playlist") {
    const tracks = await fastPlaylist(applePage);
    const { type, name, author } = (await findJSONLD(
      document,
      true,
      true
    )) as PartialPlaylist;
    return { type, name, author, tracks } as RawApplePlaylist;
  }

  const { artist, album } = (await findJSONLD(document)) as PartialSong;
  const regexName = RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//);
  const title = regexName.exec(url)?.[1] as string;

  const song: RawAppleSong = {
    artist,
    title,
    album,
  };

  return song;
}

export default search;
