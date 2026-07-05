const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const adminDir = path.join(publicDir, 'admin');
const pages = ['index.html', 'about.html', 'our-work.html', 'contact.html'];

function transformHtml(html) {
  let out = html
    .replace(/href="styles\.css"/g, 'href="../styles.css"')
    .replace(
      /<script src="script\.js"><\/script>/g,
      `<script src="../script.js"></script>\n  <script src="admin-auth.js"></script>`
    );

  const adminControls = '<span class="admin-badge">Admin</span><button type="button" class="nav-cta admin-logout-btn" onclick="adminLogout()">Log Out</button>';

  if (out.includes('class="nav-cta"')) {
    out = out.replace(
      /<a href="contact\.html" class="nav-cta">Work With Us<\/a>/g,
      adminControls
    );
  } else {
    out = out.replace(
      /<button class="hamburger"/g,
      `${adminControls}\n    <button class="hamburger"`
    );
  }

  return out;
}

fs.mkdirSync(adminDir, { recursive: true });

pages.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(adminDir, file);
  const html = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dest, transformHtml(html));
  console.log(`Created admin/${file}`);
});

console.log('Done.');
