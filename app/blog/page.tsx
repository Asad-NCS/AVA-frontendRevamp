'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog');
        const data = await response.json();
        setPosts(data.data || []);
      } catch (error) {
        console.error('[v0] Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-foreground">Loading posts...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            AVA <span className="text-cyan-500">Blog</span>
          </h1>
          <p className="text-xl text-foreground/80">
            News, reflections, and moments from AdVentures Academy
          </p>
        </div>
      </section>

      {/* Blog Feed */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-foreground/60">
              <p>No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2 text-foreground hover:text-cyan-400 transition">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="text-foreground/60 mb-4 line-clamp-2">
                        {post.content}
                      </p>
                      <time className="text-sm text-foreground/50">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
