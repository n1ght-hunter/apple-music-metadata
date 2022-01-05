import search from "../src";

async function call() {
  const start = Date.now();
  const res = await search(
    "https://music.apple.com/us/album/stay/1596532185?i=1596532398"
  );
  const final = Date.now() - start;
  console.log(res, final);
}

call();
