// bump-cache.js
// Usage: node bump-cache.js <version>
// Example: node bump-cache.js 2
//
// Walks every .html file under public/ (including public/meister/) and
// rewrites any <script src="...script.js"> or <script src="...blog.js">
// tag to include/update a ?v= query string, so Vercel's edge cache and
// browsers are forced to fetch a fresh copy after you deploy a change.
//
// Safe to run repeatedly — it replaces any existing ?v=N with the new one
// rather than stacking multiple query strings.

const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node bump-cache.js <version>');
  console.error('Example: node bump-cache.js 2');
  process.exit(1);
}

const publicDir = path.join(__dirname, 'public');

function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Matches src="...script.js" or src="...blog.js", with or without an
// existing ?v=N, and with any relative path prefix (./, ../, none).
const scriptPattern = /src="([^"]*?)(script|blog)\.js(\?v=\d+)?"/g;

let filesChanged = 0;
let tagsChanged = 0;

const htmlFiles = findHtmlFiles(publicDir);

for (const filePath of htmlFiles) {
  const original = fs.readFileSync(filePath, 'utf8');
  let fileTagCount = 0;

  const updated = original.replace(scriptPattern, (match, prefix, name) => {
    fileTagCount++;
    return `src="${prefix}${name}.js?v=${version}"`;
  });

  if (fileTagCount > 0 && updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    filesChanged++;
    tagsChanged += fileTagCount;
    console.log(`Updated ${fileTagCount} tag(s) in ${path.relative(__dirname, filePath)}`);
  }
}

console.log(`\nDone. ${tagsChanged} tag(s) updated across ${filesChanged} file(s) to version ${version}.`);