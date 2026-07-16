import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  images?: string;
  videos?: string;
  pdfs?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  success?: boolean;
  data?: BlogPost | BlogPost[];
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    if (req.method === 'GET') {
      // Get all published blog posts
      const result = await pool.query(
        'SELECT * FROM blog_posts WHERE published = true ORDER BY created_at DESC'
      );
      res.status(200).json({ success: true, data: result.rows });
    } else if (req.method === 'POST') {
      // Create new blog post (admin only)
      const adminPassword = req.headers['x-admin-password'];
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, slug, content, images, videos, pdfs, published } = req.body;

      if (!title || !slug || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.query(
        'INSERT INTO blog_posts (title, slug, content, images, videos, pdfs, published) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [title, slug, content, images || null, videos || null, pdfs || null, published || false]
      );

      res.status(201).json({ success: true, data: result.rows[0] });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
