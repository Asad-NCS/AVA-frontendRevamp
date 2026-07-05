const fs = require('fs');
let css = fs.readFileSync('c:\\Users\\asada\\OneDrive\\Desktop\\internship\\AVA-frontendRevamp\\public\\styles.css', 'utf8');

css = css.replace(/background:\s*radial-gradient\([^)]*rgba\(\s*(249|0)\s*,\s*(115|180)\s*,\s*(22|166)[^)]*\)[^;]*;/g, '/* removed orb */');
css = css.replace(/animation:\s*orbDrift[A-Z][^;]*;/g, '/* removed orb animation */');

css = css.replace(/@keyframes\s+orbDriftA\s*\{[\s\S]*?\}\s*(?=@keyframes|\/\*|\.|$)/, '');
css = css.replace(/@keyframes\s+orbDriftB\s*\{[\s\S]*?\}\s*(?=@keyframes|\/\*|\.|$)/, '');
css = css.replace(/@keyframes\s+orbDriftA\s*\{[\s\S]*?\}\s*(?=@keyframes|\/\*|\.|$)/, '');
css = css.replace(/@keyframes\s+orbDriftB\s*\{[\s\S]*?\}\s*(?=@keyframes|\/\*|\.|$)/, '');

const newBg = `
/* ==========================================================================
   NEW PREMIUM BACKGROUND (Perspective Grid Pan)
   ========================================================================== */
body {
  position: relative;
  background-color: var(--bg);
}
body::before {
  content: '';
  position: fixed;
  top: -50%; left: -50%; width: 200vw; height: 200vh;
  pointer-events: none;
  z-index: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 80px 80px;
  transform: perspective(1000px) rotateX(60deg) scale(1);
  animation: gridPan 20s linear infinite;
  mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
}

@keyframes gridPan {
  0% { transform: perspective(1000px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(1000px) rotateX(60deg) translateY(80px); }
}

/* Ensure content stays above the grid */
.page-wrap, footer, nav {
  position: relative;
  z-index: 1;
}

/* Redesign Contact Form UI */
.contact-hero {
  text-align: center;
  padding: 80px 20px 40px;
}
.contact-hero h1 {
  font-size: 48px;
  letter-spacing: -1.5px;
  margin-bottom: 24px;
}
.contact-simple-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 60px;
  align-items: start;
  max-width: 1100px;
  margin: 0 auto;
}
.contact-info-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 48px;
  backdrop-filter: blur(12px);
}
.contact-info-block {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 32px;
}
.contact-info-icon {
  width: 48px;
  height: 48px;
  background: rgba(0, 180, 166, 0.1);
  color: var(--teal);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.contact-info-icon svg {
  width: 24px;
  height: 24px;
}
.contact-info-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}
.contact-form-wrap {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.contact-form-wrap h3 {
  font-size: 28px;
  margin-bottom: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Floating labels */
.form-group.floating {
  position: relative;
  margin-bottom: 24px;
}
.form-group.floating input,
.form-group.floating textarea {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0;
  padding: 24px 0 8px;
  font-size: 16px;
  color: var(--white);
  transition: border-color 0.3s;
}
.form-group.floating input:focus,
.form-group.floating textarea:focus {
  outline: none;
  border-bottom-color: var(--teal);
}
.form-group.floating label {
  position: absolute;
  top: 20px;
  left: 0;
  font-size: 16px;
  color: var(--gray);
  pointer-events: none;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.form-group.floating input:focus ~ label,
.form-group.floating input:not(:placeholder-shown) ~ label,
.form-group.floating textarea:focus ~ label,
.form-group.floating textarea:not(:placeholder-shown) ~ label {
  top: 0;
  font-size: 12px;
  color: var(--teal);
  font-weight: 600;
}

@media (max-width: 900px) {
  .contact-simple-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
`;
css += newBg;
fs.writeFileSync('c:\\Users\\asada\\OneDrive\\Desktop\\internship\\AVA-frontendRevamp\\public\\styles.css', css);
