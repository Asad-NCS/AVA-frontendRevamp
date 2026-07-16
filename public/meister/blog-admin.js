const form = document.getElementById('blogAdminForm');
const postText = document.getElementById('postText');
const postMedia = document.getElementById('postMedia');
const mediaPortal = document.getElementById('mediaUploadPortal');
const statusEl = document.getElementById('blogAdminStatus');
const submitBtn = document.getElementById('postSubmitBtn');
const meisterFeed = document.getElementById('meisterBlogFeed');
const emojiPicker = document.getElementById('emojiPicker');
const emojiMoreBtn = document.getElementById('emojiMoreBtn');
const emojiExtra = document.getElementById('emojiExtra');
const mediaPreview = document.getElementById('mediaPreview');

let selectedFiles = [];

const BASE_EMOJIS = ['😊', '🚀', '💡', '🎯', '👏', '🔥', '✨', '📚', '💼', '🇵🇰'];
const EXTRA_EMOJIS = ['🎉', '❤️', '💪', '🙌', '⭐', '🏆', '📈', '🤝', '☕', '🌟', '✅', '📝'];

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type || ''}`;
}

function insertEmoji(emoji) {
  if (!postText) return;
  postText.focus();
  const start = postText.selectionStart ?? postText.value.length;
  const end = postText.selectionEnd ?? postText.value.length;
  postText.value = postText.value.slice(0, start) + emoji + postText.value.slice(end);
  const cursor = start + emoji.length;
  postText.selectionStart = postText.selectionEnd = cursor;
}

function bindEmojiButtons(container) {
  container?.querySelectorAll('.emoji-btn[data-emoji]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      insertEmoji(btn.dataset.emoji);
    });
  });
}

function renderEmojiButtons(container, emojis) {
  container.innerHTML = emojis.map((emoji) =>
    `<button type="button" class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
  ).join('');
  bindEmojiButtons(container);
}

function renderMediaPreview() {
  mediaPreview.innerHTML = '';
  selectedFiles.forEach((file) => {
    const item = document.createElement('div');
    item.className = 'file-preview-item';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      item.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      item.textContent = '🎬 ' + file.name;
    } else {
      item.textContent = '📄 ' + file.name;
    }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'file-preview-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      selectedFiles = selectedFiles.filter((f) => f !== file);
      renderMediaPreview();
    });

    item.appendChild(removeBtn);
    mediaPreview.appendChild(item);
  });
}

// Generate slug from title
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function loadMeisterFeed() {
  try {
    const res = await fetch('/api/blog', { credentials: 'same-origin', cache: 'no-store' });
    const posts = await res.json();

    if (!posts.length) {
      meisterFeed.innerHTML = `
        <div class="blog-empty">
          <p>No posts yet. Create your first one above.</p>
        </div>
      `;
      return;
    }

    meisterFeed.innerHTML = posts.map((post) => `
      <div class="blog-admin-post-wrap">
        <div class="blog-post-item">
          <div class="blog-post-meta">
            <span class="blog-post-date">${new Date(post.created_at).toLocaleDateString()}</span>
            <span class="blog-post-status">${post.published ? 'Published' : 'Draft'}</span>
          </div>
          <h3 class="blog-post-title">${post.title}</h3>
          <p class="blog-post-preview">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
          <div class="blog-post-actions">
            <button type="button" class="blog-edit-btn" data-id="${post.id}" data-title="${post.title}" data-content="${post.content}">Edit</button>
            <button type="button" class="blog-delete-btn" data-id="${post.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    meisterFeed.querySelectorAll('.blog-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => deletePost(btn.dataset.id));
    });

    meisterFeed.querySelectorAll('.blog-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => editPost(btn.dataset.id, btn.dataset.title, btn.dataset.content));
    });
  } catch {
    meisterFeed.innerHTML = `<div class="blog-empty"><p>Could not load posts.</p></div>`;
  }
}

async function deletePost(id) {
  if (!confirm('Delete this post permanently?')) return;

  try {
    const res = await fetch(`/api/blog/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (!res.ok) throw new Error('Delete failed');
    await loadMeisterFeed();
    showStatus('Post deleted.', 'success');
  } catch {
    showStatus('Could not delete post. Please try again.', 'error');
  }
}

function editPost(id, title, content) {
  postText.value = content;
  postText.focus();
  showStatus(`Editing post "${title}". Update and post to save changes.`, 'info');
}

renderEmojiButtons(document.getElementById('emojiBase'), BASE_EMOJIS);
renderEmojiButtons(emojiExtra, EXTRA_EMOJIS);

emojiMoreBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  emojiExtra?.classList.toggle('open');
  emojiMoreBtn.classList.toggle('active');
});

mediaPortal?.addEventListener('click', () => postMedia?.click());

postMedia?.addEventListener('change', () => {
  selectedFiles = [...selectedFiles, ...postMedia.files];
  postMedia.value = '';
  renderMediaPreview();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showStatus('');
  
  const content = postText.value.trim();
  if (!content) {
    showStatus('Post content cannot be empty.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting…';

  const slug = generateSlug(content.split('\n')[0]);
  const payload = {
    title: content.split('\n')[0].substring(0, 100),
    content: content,
    slug: slug,
    published: true,
  };

  try {
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });
    
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Post failed');
    }

    postText.value = '';
    selectedFiles = [];
    renderMediaPreview();
    showStatus('Post published!', 'success');
    await loadMeisterFeed();
    meisterFeed?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showStatus(err.message || 'Could not publish post.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post';
  }
});

loadMeisterFeed();
