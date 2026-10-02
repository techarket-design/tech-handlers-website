import fs from "node:fs";
const template = fs.readFileSync("dist/index.html", "utf8");
for (const marker of ["<!--app-head-->", "<!--app-html-->", "<!--app-data-->"]) {
  if (!template.includes(marker)) throw new Error(`Missing render marker: ${marker}`);
}
fs.writeFileSync("dist-server/template.mjs", `export default ${JSON.stringify(template)};\n`);
if (fs.existsSync("dist/sitemap.xml")) fs.unlinkSync("dist/sitemap.xml");
