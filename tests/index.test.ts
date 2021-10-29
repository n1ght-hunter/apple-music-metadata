import { getSong, getPlaylist } from "../src/index"

test("song", async () =>{
    await expect(getSong("https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021")).resolves.toMatchSnapshot();
});

test("album", async () => {
    await expect(getPlaylist("https://music.apple.com/nz/album/real-growth-takes-time-ep/1541902791")).resolves.toMatchSnapshot();
}, 15000);
test("playlist", async () => {
    await expect(getPlaylist("https://music.apple.com/nz/playlist/hip-hop-r-b-throwback/pl.674abcd261d04582b58d6388394cd047")).resolves.toMatchSnapshot();
}, 40000);