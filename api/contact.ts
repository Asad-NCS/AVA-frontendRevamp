import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      organisation,
      level,
      teamSize,
      message,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !organisation || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save to database
    const result = await pool.query(
      'INSERT INTO contact_submissions (first_name, last_name, email, phone, organisation, level, team_size, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [firstName, lastName, email, phone || null, organisation, level || null, teamSize || null, message]
    );

    // TODO: Send email notification
    // For now, just acknowledge receipt
    console.log('[v0] Contact submission received:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Message received. We will get back to you soon!',
    });
  } catch (error) {
    console.error('Contact API error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
}
