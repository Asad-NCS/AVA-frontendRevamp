const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'about.html'), 'utf8');
const adminControls =
  '<span class="admin-badge">Admin</span><button type="button" class="nav-cta admin-logout-btn" onclick="adminLogout()">Log Out</button>';

const out = src
  .replace('href="styles.css"', 'href="../styles.css"')
  .replace('<a href="contact.html" class="nav-cta">Work With Us</a>', adminControls)
  .replace(
    '<script src="script.js"></script>',
    '<script src="../script.js"></script>\n  <script src="admin-auth.js"></script>'
  );

fs.writeFileSync(path.join(__dirname, '..', 'public', 'admin', 'about.html'), out);
console.log('Updated public/admin/about.html');
