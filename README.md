# apple-music-metadata

A TypeScript package for scraping Apple Music metadata (Supports single tracks, albums, and playlists).

# Installation

```
npm install apple-music-metadata
```

# Usage

## Single Track

```ts
import appleMusic from "apple-music-metadata";

appleMusic(
  "https://music.apple.com/us/album/example/1541902791?i=1541903021"
).then(console.log);

/*
{
  artist: {
    name: 'Sody',
    url: 'https://music.apple.com/us/artist/sody/271348279'
  },
  title: 'butterfly',
  duration: '189', in seconds
  url: 'https://music.apple.com/us/album/butterfly/1541902791?i=1541903021?i=1541903021',
  type: 'song'
}
*/
```

## Playlist

```ts
import appleMusic from "apple-music-metadata";

appleMusic(
  "https://music.apple.com/us/playlist/office-dj/pl.f820ed7063f9447f8751abf885525698"
).then(console.log);

/*
{
  title: 'Office DJ',
  description: "There's nothing like ...",
  creator: {
    name: 'Apple Music Pop',
    url: 'https://music.apple.com/us/curator/apple-music-pop/976439548'
  },
  tracks: [...]
  numTracks: 100,
  type: 'playlist'
}
*/
```

## Album

```ts
import appleMusic from "apple-music-metadata";

appleMusic(
  "https://music.apple.com/us/album/meditations-for-living-an-awakened-life/1602431360"
).then(console.log);

/*
{
  title: 'Meditations for Living an Awakened Life',
  description: '',
  artist: {
    name: 'Sarah Blondin',
    url: 'https://music.apple.com/us/artist/sarah-blondin/1602422414'
  },
  tracks: [
    ...
  ],
  numTracks: 7,
  type: 'album'
}
*/
```
