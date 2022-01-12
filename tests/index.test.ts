import appleMusic from "../src/index";

const testingTargets = {
  song: {
    type: "song",
    url: "https://music.apple.com/nz/album/butterfly/1541902791?i=1541903021",
  },
  album: {
    type: "album",
    url: "https://music.apple.com/us/album/meditations-for-living-an-awakened-life/1602431360",
  },
  playlist: {
    type: "playlist",
    url: "https://music.apple.com/us/playlist/jumpstart/pl.4b0436590393442e9493307577d16742",
  },
};

Object.values(testingTargets).forEach((prop) => {
  test(prop.type, async () => {
    await expect(appleMusic(prop.url)).resolves.toMatchSnapshot();
  });
});
