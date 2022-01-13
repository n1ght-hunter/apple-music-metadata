import fs from "fs";

fs.writeFileSync("./build/esm/package.json", '{"type":"module"}');
fs.writeFileSync("./build/cjs/package.json", '{"type":"commonjs"}');
console.log("postbuild complete");
