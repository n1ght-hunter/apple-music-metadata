import search from "../src";

async function call() {
  const start = Date.now();
  const res = await search(
    "https://music.apple.com/us/playlist/top-songs-of-2021-global/pl.db803163f811479e9d00f921f74684fc"
  );
  const final = Date.now() - start;
  console.log(res, final);
}

call();
