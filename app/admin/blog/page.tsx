'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  created_at: string;
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    published: false,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check auth on mount
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('adminPassword');
    if (storedPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchPosts(storedPassword);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminPassword', adminPassword);
      fetchPosts(adminPassword);
      setAdminPassword('');
    } else {
      setMessage({ type: 'error', text: 'Invalid password' });
    }
  };

  const fetchPosts = async (password: string) => {
    try {
      const response = await fetch('/api/blog', {
        headers: { 'x-admin-password': password },
      });
      const data = await response.json();
      setPosts(data.data || []);
    } catch (error) {
      console.error('[v0] Error fetching posts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const password = sessionStorage.getItem('adminPassword') || '';
      const url = editingId ? `/api/blog/${editingId}` : '/api/blog';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingId ? 'Blog post updated!' : 'Blog post created!',
        });
        setFormData({ title: '', slug: '', content: '', published: false });
        setEditingId(null);
        fetchPosts(password);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save post' });
      }
    } catch (error) {
      console.error('[v0] Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      published: post.published,
    });
    setEditingId(post.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;

    try {
      const password = sessionStorage.getItem('adminPassword') || '';
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post deleted!' });
        fetchPosts(password);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete post' });
      }
    } catch (error) {
      console.error('[v0] Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Meister Portal</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground focus:outline-none focus:border-cyan-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
            >
              Sign In
            </button>
            {message && (
              <div className="p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">{message.text}</div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Blog Management</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('adminPassword');
              setIsAuthenticated(false);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Sign Out
          </button>
        </div>

        {/* Form */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">
            {editingId ? 'Edit Post' : 'Create New Post'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post Title"
                required
                className="px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Post Slug (URL-friendly)"
                required
                className="px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Post Content"
              required
              rows={6}
              className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-foreground placeholder-foreground/40 focus:outline-none focus:border-cyan-500 resize-none"
            ></textarea>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-foreground">Publish immediately</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-lg font-semibold transition"
              >
                {loading ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', slug: '', content: '', published: false });
                  }}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}
          </form>
        </div>

        {/* Posts List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Published Posts</h2>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-foreground/60">No posts yet</p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-start gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{post.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">Slug: {post.slug}</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Created: {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
