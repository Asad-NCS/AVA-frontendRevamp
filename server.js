const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONTACT API ───
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, organisation, level, teamSize, message } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !organisation || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const levelLabels = {
    'early-career': 'Early-Career Professionals',
    'middle-management': 'Middle Management',
    'c-suite': 'C-Suite Leadership',
    'all-levels': 'All Levels',
    'custom': 'Custom / Not Sure Yet',
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password, not regular password
      },
    });

    const mailOptions = {
      from: `"AVA Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || 'hello@adventures.studio',
      replyTo: email,
      subject: `New AVA Enquiry — ${organisation}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
          <div style="background:#060A14;padding:24px 32px;border-radius:8px 8px 0 0;margin:-32px -32px 32px;">
            <h2 style="color:#00C4B4;font-size:20px;margin:0;">New Enquiry — AdVentures Academy</h2>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:160px;">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><a href="mailto:${email}" style="color:#00C4B4;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Organisation</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;">${organisation}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Focus Area</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${levelLabels[level] || level || 'Not specified'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Team Size</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${teamSize || 'Not specified'}</td></tr>
          </table>

          <div style="margin-top:24px;">
            <p style="color:#6b7280;font-size:13px;margin-bottom:8px;">Message</p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;font-size:15px;line-height:1.7;color:#111827;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
            Sent from ava.com.pk/contact · ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"AdVentures Academy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We received your message — AVA',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#060A14;padding:32px;border-radius:12px 12px 0 0;">
            <h2 style="color:#00C4B4;font-size:22px;margin:0 0 8px;">Thanks, ${firstName}.</h2>
            <p style="color:#8892A4;margin:0;font-size:15px;">We've received your message and will be in touch within 24 hours.</p>
          </div>
          <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;">In the meantime, feel free to explore more about AVA at <a href="https://ava.com.pk" style="color:#00C4B4;">ava.com.pk</a>.</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">If you have any urgent questions, reach us at <a href="mailto:hello@adventures.studio" style="color:#00C4B4;">hello@adventures.studio</a>.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">AdVentures Academy · National Incubation Center, Islamabad</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ─── CATCH-ALL ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AVA server running on http://localhost:${PORT}`);
});
