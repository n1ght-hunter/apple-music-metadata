import axios from "axios";
import parser from "htmlparser2";
import { findJSONLD, RawApplePlaylist, search } from "../src/index";

test("song", async () => {
  await expect(
    search("https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021")
  ).resolves.toMatchSnapshot();
});

test("album", async () => {
  await expect(
    search(
      "https://music.apple.com/nz/album/real-growth-takes-time-ep/1541902791"
    )
  ).resolves.toMatchSnapshot();
}, 15000);

test("slowPlaylist", async () => {
  const playlist = async () => {
    const result = await axios.get<string>(
      "https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c"
    );
    const document = parser.parseDocument(result.data);
    return (await findJSONLD(document, true)) as RawApplePlaylist;
  };
  await expect(playlist()).resolves.toMatchSnapshot();
}, 60000);

test("playlist", async () => {
  await expect(
    search(
      "https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c"
    )
  ).resolves.toMatchSnapshot();
}, 10000);

test("autogetsong", async () => {
  await expect(
    search("https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021")
  ).resolves.toMatchSnapshot();
});

test("autogetalbum", async () => {
  await expect(
    search(
      "https://music.apple.com/nz/album/real-growth-takes-time-ep/1541902791"
    )
  ).resolves.toMatchSnapshot();
}, 15000);

test("autogetplaylist", async () => {
  await expect(
    search(
      "https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c"
    )
  ).resolves.toMatchSnapshot();
}, 10000);
