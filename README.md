# AVA — AdVentures Academy Website

A modern, full-stack website for AdVentures Academy with live backend, blog CMS, animated background, and Vercel deployment.

## Features

- **Home Page**: Hero section with stats and CTA
- **Blog System**: 
  - Public blog page that fetches posts from Neon database
  - Admin panel at `/admin/blog` for creating/editing/deleting posts
  - Custom URL slugs for each post
- **Contact Form**: Submissions saved to Neon database
- **Animated Background**: Premium Canvas-based animated gradient mesh
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Backend API**: Vercel serverless functions connecting to Neon PostgreSQL

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Vercel API Routes (serverless)
- **Authentication**: Simple password-based admin auth

## Project Structure

```
/app
  /admin/blog/page.tsx        # Admin blog management
  /blog/page.tsx              # Public blog page
  /contact/page.tsx           # Contact form page
  /globals.css                # Global styles + canvas styling
  layout.tsx                  # Root layout with canvas
  page.tsx                    # Home page

/pages/api
  /blog.ts                    # Blog CRUD endpoints
  /blog/[id].ts              # Blog by ID/slug
  /contact.ts                # Contact form submission

/public/animations
  /background.js             # Canvas animation engine

.env.development.local        # Development environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Neon PostgreSQL account
- Vercel account (for deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   The `.env.development.local` file is already configured with:
   - `DATABASE_URL`: Neon connection string
   - `ADMIN_PASSWORD`: Admin panel password (default: `meister-ava-2026`)

3. **Start dev server**:
   ```bash
   pnpm dev
   ```

4. **Open browser**:
   - Home: http://localhost:3000
   - Blog: http://localhost:3000/blog
   - Contact: http://localhost:3000/contact
   - Admin: http://localhost:3000/admin/blog

## Database Schema

### blog_posts table
```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  images TEXT,
  videos TEXT,
  pdfs TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### contact_submissions table
```sql
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  organisation VARCHAR(255),
  level VARCHAR(50),
  team_size VARCHAR(50),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Admin Panel

Access the admin panel at `/admin/blog`:

1. Enter the admin password (default: `meister-ava-2026`)
2. Create, edit, or delete blog posts
3. Control publication status
4. Custom URL slugs for SEO

**Important**: Change the admin password in production!

## API Endpoints

### Blog API

**GET** `/api/blog`
- Fetch all published blog posts
- Returns: Array of blog posts

**POST** `/api/blog`
- Create new blog post (admin only)
- Headers: `x-admin-password`
- Body: `{ title, slug, content, published }`

**GET** `/api/blog/[id]`
- Fetch post by ID or slug
- Returns: Single blog post

**PUT** `/api/blog/[id]`
- Update blog post (admin only)
- Headers: `x-admin-password`

**DELETE** `/api/blog/[id]`
- Delete blog post (admin only)
- Headers: `x-admin-password`

### Contact API

**POST** `/api/contact`
- Submit contact form
- Body: `{ firstName, lastName, email, phone, organisation, level, teamSize, message }`
- Returns: Success message

## Animated Background

The animated background uses a premium Canvas-based gradient mesh animation:

- **Colors**: Purple → Blue → Teal gradient palette
- **Performance**: Smooth 60fps animation on all devices
- **Mobile Optimized**: Reduces complexity on smaller screens
- **File**: `/public/animations/background.js`

The animation is automatically initialized on page load and adapts to window resizing.

## Deployment to Vercel

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy AVA website"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to vercel.com
   - Import your GitHub repository
   - Select this project

3. **Configure environment variables** in Vercel project settings:
   - `DATABASE_URL`: Your Neon connection string
   - `ADMIN_PASSWORD`: Secure admin password
   - `NEXT_PUBLIC_ADMIN_PASSWORD`: Same as ADMIN_PASSWORD (for client validation)

4. **Deploy**:
   - Vercel auto-deploys on push to main
   - Or click "Deploy" in Vercel dashboard

## Security Notes

- **Admin Password**: Change the default password in production
- **HTTPS Only**: Always use HTTPS in production
- **Environment Variables**: Never commit `.env.local` with real credentials
- **Database**: Use connection pooling for production
- **CORS**: API routes are same-origin only (no CORS headers needed locally)

## Troubleshooting

### Blog posts not showing
- Check DATABASE_URL is correct
- Verify blog_posts table exists: `SELECT * FROM blog_posts;`
- Check browser console for fetch errors

### Admin panel not working
- Verify admin password matches NEXT_PUBLIC_ADMIN_PASSWORD
- Check session storage in browser DevTools
- Ensure x-admin-password header is sent with requests

### Animated background not showing
- Check browser console for JavaScript errors
- Verify `/public/animations/background.js` is loaded
- Check canvas element exists in DOM: `<canvas id="bg-canvas">`

### API errors
- Check Neon database is online
- Verify DATABASE_URL connection string
- Check server logs: `pnpm dev` output

## Future Enhancements

- Email notifications for contact submissions
- Admin dashboard for contact submissions
- Blog post scheduling
- Multi-language support
- Dark/light mode toggle
- Analytics integration
- Comments system for blog posts

## Support

For issues or questions, contact: ava@adventures.studio

---

**Built with v0 + Next.js 16 + Neon PostgreSQL + Vercel**
