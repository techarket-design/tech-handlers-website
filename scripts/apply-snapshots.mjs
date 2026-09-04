import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const snapshotsDir = path.resolve(__dirname, '../prerendered-snapshots');

function copyRecursiveSync(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
    console.log("Copied " + src + " to " + dest);
  }
}

if (fs.existsSync(snapshotsDir)) {
  console.log("Applying static HTML snapshots to dist...");
  copyRecursiveSync(snapshotsDir, distDir);
  console.log("Applied snapshots successfully!");
} else {
  console.log("No snapshots found. Skipping.");
}