const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const meisterDir = path.join(publicDir, 'meister');
const pages = ['about.html', 'our-work.html', 'contact.html'];

const meisterControls =
  '<span class="meister-badge">Meister</span><button type="button" class="nav-cta meister-logout-btn" onclick="meisterLogout()">Log Out</button>';

function transformHtml(html) {
  return html
    .replace(/href="styles\.css"/g, 'href="../styles.css"')
    .replace('<a href="contact.html" class="nav-cta">Work With Us</a>', meisterControls)
    .replace(
      '<script src="script.js"></script>',
      '<script src="../script.js" defer></script>\n  <script src="meister-auth.js"></script>'
    )
    .replace('<script src="script.js" defer></script>', '<script src="../script.js" defer></script>\n  <script src="meister-auth.js"></script>');
}

pages.forEach((file) => {
  const html = fs.readFileSync(path.join(publicDir, file), 'utf8');
  fs.writeFileSync(path.join(meisterDir, file), transformHtml(html));
  console.log(`Synced meister/${file}`);
});
