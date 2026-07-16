const blogAdminFormEl = document.getElementById('blogAdminForm');
const postText = document.getElementById('postText');
const postMedia = document.getElementById('postMedia');
const mediaPortal = document.getElementById('mediaUploadPortal');
const blogAdminStatusEl = document.getElementById('blogAdminStatus');
const blogAdminSubmitBtn = document.getElementById('postSubmitBtn');
const meisterFeed = document.getElementById('meisterBlogFeed');
const emojiPicker = document.getElementById('emojiPicker');
const emojiMoreBtn = document.getElementById('emojiMoreBtn');
const emojiExtra = document.getElementById('emojiExtra');
const mediaPreview = document.getElementById('mediaPreview');

let selectedFiles = [];

const BASE_EMOJIS = ['😊', '🚀', '💡', '🎯', '👏', '🔥', '✨', '📚', '💼', '🇵🇰'];
const EXTRA_EMOJIS = ['🎉', '❤️', '💪', '🙌', '⭐', '🏆', '📈', '🤝', '☕', '🌟', '✅', '📝'];

function showStatus(message, type) {
  blogAdminStatusEl.textContent = message;
  blogAdminStatusEl.className = `form-status ${type || ''}`;
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
        ${window.AVABlog.renderPost(post)}
        <button type="button" class="blog-delete-btn" data-id="${post.id}">Delete post</button>
      </div>
    `).join('');

    meisterFeed.querySelectorAll('.blog-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => deletePost(btn.dataset.id));
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

blogAdminFormEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showStatus('');
  blogAdminSubmitBtn.disabled = true;
  blogAdminSubmitBtn.textContent = 'Posting…';

  const formData = new FormData();
  formData.append('text', postText.value.trim());
  selectedFiles.forEach((file) => formData.append('media', file));

  try {
    const res = await fetch('/api/blog', { method: 'POST', body: formData, credentials: 'same-origin' });
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
    blogAdminSubmitBtn.disabled = false;
    blogAdminSubmitBtn.textContent = 'Post';
  }
});

loadMeisterFeed();