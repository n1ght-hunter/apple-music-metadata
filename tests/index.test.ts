import search from "../src";

async function call() {
  const start = Date.now();
  const res = await search(
    //"https://music.apple.com/us/playlist/jumpstart/pl.4b0436590393442e9493307577d16742"
    // "https://music.apple.com/us/album/electric-feel/264720008"
    "https://music.apple.com/us/album/electric-feel/264720008?i=264720106"
  );
  const final = Date.now() - start;
  console.log(res, final);
  if (res && res.type === "album") {
    console.log(res.tracks[0]?.artist);
  }
}

call();
