import fs from "node:fs";
const html = fs.readFileSync("dist/index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)) {
  if (!fs.existsSync(`dist${match[1]}`)) throw new Error(`Missing current-build asset: ${match[1]}`);
}
for (const path of ["dist-server/entry-server.js", "dist-server/template.mjs"]) if (!fs.existsSync(path)) throw new Error(`Missing render output: ${path}`);
console.log("Client assets and server rendering outputs verified.");
