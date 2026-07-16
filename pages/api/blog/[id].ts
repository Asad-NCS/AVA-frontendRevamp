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
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get single blog post by ID or slug
      let result = await pool.query(
        'SELECT * FROM blog_posts WHERE id = $1 OR slug = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.status(200).json({ success: true, message: 'Post retrieved', data: result.rows[0] });
    } else if (req.method === 'PUT') {
      // Update blog post (admin only)
      const adminPassword = req.headers['x-admin-password'];
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, slug, content, images, videos, pdfs, published } = req.body;

      const result = await pool.query(
        'UPDATE blog_posts SET title = $1, slug = $2, content = $3, images = $4, videos = $5, pdfs = $6, published = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
        [title, slug, content, images || null, videos || null, pdfs || null, published || false, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.status(200).json({ success: true, message: 'Post updated' });
    } else if (req.method === 'DELETE') {
      // Delete blog post (admin only)
      const adminPassword = req.headers['x-admin-password'];
      if (adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await pool.query(
        'DELETE FROM blog_posts WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      res.status(200).json({ success: true, message: 'Post deleted' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog ID API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
