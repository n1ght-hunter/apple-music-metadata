import axios from "axios";
import cheerio from "cheerio";

export interface Artist {
  name: string;
  url: string;
}

export interface Track {
  artist: Artist;
  duration: string;
  title: string;
  url: string;
  type: "song";
}

export interface RawAlbum {
  artist: Artist;
  description: string;
  numTracks: number;
  title: string;
  tracks: Track[];
  type: "album";
}

export interface RawPlaylist {
  creator: Artist;
  description: string;
  numTracks: number;
  title: string;
  tracks: Track[];
  type: "playlist";
}

function getRawPlaylist(document: string): RawPlaylist {
  const $ = cheerio.load(document);

  const tracks: Track[] = [];

  const songList = $("div.songs-list-row").toArray();
  songList.forEach((song) => {
    const lookArtist = $(song)
      .find("div.songs-list__col--artist")
      .find("a.songs-list-row__link");

    const track: Track = {
      artist: {
        name: lookArtist.text(),
        url: lookArtist.attr("href") ?? "",
      },
      title: $(song)
        .find("div.songs-list__col--song")
        .find("div.songs-list-row__song-name")
        .text(),
      duration:
        $(song)
          .find("div.songs-list__col--time")
          .find("time")
          .attr("datetime") ?? "",
      url:
        $(song)
          .find("div.songs-list__col--album")
          .find("a.songs-list-row__link")
          .attr("href") ?? "",
      type: "song",
    };

    tracks.push(track);
  });

  const product = $("div.product-page-header");
  const creator = product.find("div.product-creator").find("a.dt-link-to");

  const playlist: RawPlaylist = {
    title: product.find("h1.product-name").text().trim(),
    description: product
      .find("div.product-page-header__metadata--notes")
      .text()
      .trim(),
    creator: {
      name: creator.text().trim(),
      url: "https://music.apple.com" + creator.attr("href") ?? "",
    },
    tracks,
    numTracks: tracks.length,
    type: "playlist",
  };
  return playlist;
}

function getRawAlbum(document: string): RawAlbum {
  const $ = cheerio.load(document);

  const tracks: Track[] = [];

  const product = $("div.product-page-header");
  const creator = product.find("div.product-creator").find("a.dt-link-to");
  const artist = {
    name: creator.text().trim(),
    url: creator.attr("href") ?? "",
  };

  const albumUrl = $("meta[property='og:url']").attr("content");
  const songList = $("div.songs-list-row").toArray();
  songList.forEach((song) => {
    const track: Track = {
      artist,
      title: $(song)
        .find("div.songs-list__col--song")
        .find("div.songs-list-row__song-name")
        .text(),
      duration:
        $(song)
          .find("div.songs-list__col--time")
          .find("time")
          .attr("datetime") ?? "",
      url: albumUrl
        ? albumUrl +
            "?i=" +
            JSON.parse(
              $(song)
                .find("div.songs-list__col--time")
                .find("button.preview-button")
                .attr("data-metrics-click") ?? "{ targetId: 0 }"
            )["targetId"] ?? ""
        : "",
      type: "song",
    };

    tracks.push(track);
  });

  const playlist: RawAlbum = {
    title: product.find("h1.product-name").text().trim(),
    description: product
      .find("div.product-page-header__metadata--notes")
      .text()
      .trim(),
    artist,
    tracks,
    numTracks: tracks.length,
    type: "album",
  };
  return playlist;
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

  if (urlType === "playlist") {
    return getRawPlaylist(applePage.data);
  }

  const album = getRawAlbum(applePage.data);

  const match = new RegExp(
    /https?:\/\/music\.apple\.com\/.+?\/album\/.+?\/.+?\?i=([0-9]+)/
  ).exec(url);

  const id = match ? match[1] : undefined;
  if (!id) {
    return null;
  }

  if (urlType === "song") {
    const track = album.tracks.find((track) => {
      return track.url.includes(`?i=${id}`);
    });

    if (!track) {
      return null;
    }

    return track;
  }

  return getRawAlbum(applePage.data);
}

export default search;
