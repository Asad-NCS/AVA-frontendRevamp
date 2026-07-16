function formatPostDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderPost(post) {
  const images = post.images ? JSON.parse(post.images) : [];
  const videos = post.videos ? JSON.parse(post.videos) : [];
  const pdfs = post.pdfs ? JSON.parse(post.pdfs) : [];
  const contentHtml = post.content
    ? `<p class="blog-post-text">${escapeHtml(post.content).replace(/\n/g, '<br>')}</p>`
    : '';

  const imagesHtml = images.length
    ? `<div class="blog-post-media blog-post-images${images.length > 1 ? ' blog-post-images-grid' : ''}">
        ${images.map((src) => `<img src="${src}" alt="Blog image" loading="lazy">`).join('')}
       </div>`
    : '';

  const videosHtml = videos.length
    ? `<div class="blog-post-media blog-post-videos">
        ${videos.map((src) => `<video controls preload="metadata" playsinline><source src="${src}"></video>`).join('')}
       </div>`
    : '';

  const pdfsHtml = pdfs.length
    ? `<div class="blog-post-media blog-post-pdfs">
        ${pdfs.map((src) => `
          <a href="${src}" class="blog-pdf-link" target="_blank" rel="noopener">
            <span class="blog-pdf-icon">📄</span>
            <span>View PDF</span>
          </a>
          <iframe src="${src}" class="blog-pdf-frame" title="PDF preview"></iframe>
        `).join('')}
       </div>`
    : '';

  return `
    <article class="blog-post" data-id="${post.id}">
      <header class="blog-post-header">
        <div class="blog-post-avatar">
          <img src="https://ava.com.pk/media/ava-logo.png" alt="AVA">
        </div>
        <div class="blog-post-meta">
          <span class="blog-post-author">AdVentures Academy</span>
          <time class="blog-post-date" datetime="${post.created_at}">${formatPostDate(post.created_at)}</time>
        </div>
      </header>
      <div class="blog-post-body">
        ${contentHtml}
        ${imagesHtml}
        ${videosHtml}
        ${pdfsHtml}
      </div>
    </article>
  `;
}

async function loadBlogFeed(containerId) {
  const feed = document.getElementById(containerId);
  if (!feed) return;

  try {
    const res = await fetch('/api/blog', { cache: 'no-store' });
    const posts = await res.json();

    if (!posts.length) {
      feed.innerHTML = `
        <div class="blog-empty">
          <span class="section-label">No posts yet</span>
          <p>Check back soon for updates from the AVA team.</p>
        </div>
      `;
      return;
    }

    feed.innerHTML = posts.map(renderPost).join('');
  } catch {
    feed.innerHTML = `
      <div class="blog-empty">
        <p>Could not load posts. Please refresh the page.</p>
      </div>
    `;
  }
}

if (document.getElementById('blogFeed')) {
  loadBlogFeed('blogFeed');
}

window.AVABlog = { loadBlogFeed, renderPost, formatPostDate };
