// absolutize-assets.js
// Usage: node absolutize-assets.js
//
// Some pages (about.html, contact.html, our-work.html) are served both at
// their normal root path (/about) AND reused at a deeper path (/meister/about)
// via server.js routes. Relative asset paths like href="styles.css" resolve
// differently depending on URL depth — correct at /about, but broken at
// /meister/about (resolves to /meister/styles.css, which doesn't exist).
//
// This script rewrites known site-asset references (styles.css, script.js,
// blog.js, animations/background.js, media/*) to absolute paths (leading /),
// which resolve correctly regardless of URL depth. It intentionally leaves
// alone meister-only files like meister-ui.js, blog-admin.js, and anything
// under uploads/, since those are already correctly relative for their
// actual serving context.
//
// Safe to run repeatedly.

const fs = require('fs');
const path = require('path');

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

const replacements = [
  // href="styles.css" or href="../styles.css" -> href="/styles.css"
  { pattern: /(href)="(?:\.\.\/)?styles\.css"/g, replace: (m, attr) => `${attr}="/styles.css"` },

  // src="script.js" / src="../script.js" (with optional ?v=N) -> src="/script.js..."
  { pattern: /(src)="(?:\.\.\/)?script\.js(\?v=\d+)?"/g, replace: (m, attr, v) => `${attr}="/script.js${v || ''}"` },

  // src="blog.js" / src="../blog.js" (with optional ?v=N) -> src="/blog.js..."
  { pattern: /(src)="(?:\.\.\/)?blog\.js(\?v=\d+)?"/g, replace: (m, attr, v) => `${attr}="/blog.js${v || ''}"` },

  // src="animations/background.js" / src="../animations/background.js"
  { pattern: /(src)="(?:\.\.\/)?animations\/background\.js"/g, replace: (m, attr) => `${attr}="/animations/background.js"` },

  // src="media/whatever.png" or href="media/whatever.png" (preload links)
  { pattern: /(src|href)="(?:\.\.\/)?media\/([^"]+)"/g, replace: (m, attr, file) => `${attr}="/media/${file}"` },
];

let filesChanged = 0;
let totalReplacements = 0;

const htmlFiles = findHtmlFiles(publicDir);

for (const filePath of htmlFiles) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;
  let fileReplacements = 0;

  for (const { pattern, replace } of replacements) {
    updated = updated.replace(pattern, (...args) => {
      fileReplacements++;
      return replace(...args);
    });
  }

  if (fileReplacements > 0 && updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    filesChanged++;
    totalReplacements += fileReplacements;
    console.log(`Updated ${fileReplacements} reference(s) in ${path.relative(__dirname, filePath)}`);
  }
}

console.log(`\nDone. ${totalReplacements} reference(s) updated across ${filesChanged} file(s).`);