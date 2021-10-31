import { getSong, getPlaylist, autoGetApple } from "../src/index"

test("song", async () =>{
    await expect(getSong("https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021")).resolves.toMatchSnapshot();
});
test("album", async () => {
    await expect(getPlaylist("https://music.apple.com/nz/album/real-growth-takes-time-ep/1541902791")).resolves.toMatchSnapshot();
}, 15000);
test("playlist", async () => {
    await expect(getPlaylist("https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c")).resolves.toMatchSnapshot();
}, 60000);

test("autogetsong", async () =>{
    await expect(autoGetApple("https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021")).resolves.toMatchSnapshot();
});
test("autogetalbum", async () => {
    await expect(autoGetApple("https://music.apple.com/nz/album/real-growth-takes-time-ep/1541902791")).resolves.toMatchSnapshot();
}, 15000);
test("autogetplaylist", async () => {
    await expect(autoGetApple("https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c")).resolves.toMatchSnapshot();
}, 60000);
