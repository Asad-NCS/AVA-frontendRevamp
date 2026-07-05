const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const meisterDir = path.join(publicDir, 'meister');
const pages = ['index.html', 'about.html', 'our-work.html', 'contact.html'];

const meisterNavActions = `
    <div class="nav-meister-actions">
      <span class="meister-badge">Meister</span>
      <button type="button" class="nav-cta meister-logout-btn" onclick="meisterLogout()">Log Out</button>
    </div>`;

const meisterScripts = `
  <script src="../script.js" defer></script>
  <script src="meister-ui.js"></script>`;

function transformHtml(html) {
  let out = html
    .replace(/href="styles\.css"/g, 'href="../styles.css"')
    .replace(/<script src="script\.js"( defer)?><\/script>/g, '');

  if (out.includes('class="nav-cta"')) {
    out = out.replace(
      /<a href="contact\.html" class="nav-cta">Work With Us<\/a>/g,
      meisterNavActions.trim()
    );
  } else {
    out = out.replace(/<button class="hamburger"/g, `${meisterNavActions}\n    <button class="hamburger"`);
  }

  if (!out.includes('meister-ui.js')) {
    out = out.replace(/<\/body>/, `${meisterScripts}\n</body>`);
  }

  return out;
}

fs.mkdirSync(meisterDir, { recursive: true });

pages.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(meisterDir, file);
  fs.writeFileSync(dest, transformHtml(fs.readFileSync(src, 'utf8')));
  console.log(`Updated meister/${file}`);
});

console.log('Done.');
