import search from "../src";

async function call() {
  const start = Date.now();
  const res = await search(
    "https://music.apple.com/us/playlist/soda-stereo-essentials/pl.fb224822256d4ef6a7ee4bb2c5a9e37c"
  );
  const final = Date.now() - start;
  console.log(res, final);
}

call();
