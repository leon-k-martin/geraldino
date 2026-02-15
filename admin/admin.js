/* ── Geraldino Admin CMS ───────────────────── */
/* Static CMS using GitHub API — no server needed */

const REPO_OWNER = 'leon-k-martin';
const REPO_NAME  = 'geraldino';
const BRANCH     = 'main';
const API_BASE   = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const CONTENT_FILES = [
  { path: 'content/hallo.md', label: 'Hallo (Startseite)',   desc: 'Begrüßungstext und Foto' },
  { path: 'content/musik.md', label: 'Musik',                desc: 'Text über der Spotify-Sektion' },
  { path: 'content/bio.md',   label: 'Über mich (Biografie)', desc: 'Biografie-Text' },
];

let token = '';
let editingFile = null;   // { path, sha, content }
let editingDate = null;   // filename of date being edited, or null for new
let allDates = [];        // [{ filename, data, sha }]

/* ── Init ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Check for stored token
  const stored = localStorage.getItem('geraldino_token');
  if (stored) {
    token = stored;
    tryLogin();
  }

  // Login
  document.getElementById('login-btn').addEventListener('click', () => {
    token = document.getElementById('token-input').value.trim();
    if (!token) return;
    tryLogin();
  });

  document.getElementById('token-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('geraldino_token');
    token = '';
    showScreen('login');
  });

  // Tabs
  document.querySelectorAll('.admin-nav .tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Content editor
  document.getElementById('save-content-btn').addEventListener('click', saveContent);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeEditor);
  document.getElementById('content-editor').addEventListener('input', updatePreview);

  // Date form
  document.getElementById('add-date-btn').addEventListener('click', () => openDateForm(null));
  document.getElementById('save-date-btn').addEventListener('click', saveDate);
  document.getElementById('cancel-date-btn').addEventListener('click', closeDateForm);
});

/* ── Auth ──────────────────────────────────── */
async function tryLogin() {
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  try {
    const res = await ghFetch('/user');
    if (!res.ok) throw new Error('Ungültiger Token');

    const user = await res.json();
    localStorage.setItem('geraldino_token', token);
    document.getElementById('user-info').textContent = `👤 ${user.login}`;
    showScreen('admin');
    loadContentList();
    loadDatesList();
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  }
}

/* ── GitHub API helper ─────────────────────── */
function ghFetch(endpoint, options = {}) {
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...(options.headers || {}),
    },
  });
}

async function getFile(path) {
  const res = await ghFetch(`/contents/${path}?ref=${BRANCH}`);
  if (!res.ok) throw new Error(`Datei nicht gefunden: ${path}`);
  const data = await res.json();
  return {
    path: data.path,
    sha: data.sha,
    content: atob(data.content.replace(/\n/g, '')),
  };
}

async function putFile(path, content, sha, message) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Speichern fehlgeschlagen');
  }
  return await res.json();
}

async function deleteFile(path, sha, message) {
  const res = await ghFetch(`/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw new Error('Löschen fehlgeschlagen');
}

/* ── Screen / Tab switching ────────────────── */
function showScreen(screen) {
  document.getElementById('login-screen').classList.toggle('hidden', screen !== 'login');
  document.getElementById('admin-screen').classList.toggle('hidden', screen !== 'admin');
}

function switchTab(tabName) {
  document.querySelectorAll('.admin-nav .tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('hidden', !p.id.endsWith(tabName)));
  // also toggle active class
  document.querySelectorAll('.tab-panel').forEach(p => {
    if (p.id === `tab-${tabName}`) {
      p.classList.add('active');
      p.classList.remove('hidden');
    } else {
      p.classList.remove('active');
      p.classList.add('hidden');
    }
  });
}

/* ── Content (Markdown) editing ────────────── */
function loadContentList() {
  const container = document.getElementById('content-files');
  container.innerHTML = CONTENT_FILES.map(f => `
    <div class="file-card" data-path="${f.path}">
      <div>
        <div class="file-name">${f.label}</div>
        <div class="file-desc">${f.desc}</div>
      </div>
      <span>✏️</span>
    </div>
  `).join('');

  container.querySelectorAll('.file-card').forEach(card => {
    card.addEventListener('click', () => openEditor(card.dataset.path));
  });
}

async function openEditor(path) {
  const panel = document.getElementById('editor-panel');
  const editor = document.getElementById('content-editor');
  const filename = document.getElementById('editor-filename');
  const status = document.getElementById('editor-status');

  status.classList.add('hidden');
  filename.textContent = 'Laden...';
  panel.classList.remove('hidden');
  editor.value = '';

  try {
    editingFile = await getFile(path);
    filename.textContent = CONTENT_FILES.find(f => f.path === path)?.label || path;
    editor.value = editingFile.content;
    updatePreview();
  } catch (e) {
    filename.textContent = 'Fehler';
    showStatus('editor-status', e.message, 'error');
  }
}

function closeEditor() {
  document.getElementById('editor-panel').classList.add('hidden');
  editingFile = null;
}

async function saveContent() {
  if (!editingFile) return;
  const editor = document.getElementById('content-editor');
  const newContent = editor.value;
  const label = CONTENT_FILES.find(f => f.path === editingFile.path)?.label || editingFile.path;

  try {
    const result = await putFile(
      editingFile.path,
      newContent,
      editingFile.sha,
      `Update ${label}`
    );
    editingFile.sha = result.content.sha;
    editingFile.content = newContent;
    showStatus('editor-status', '✅ Gespeichert!', 'success');
  } catch (e) {
    showStatus('editor-status', `❌ ${e.message}`, 'error');
  }
}

function updatePreview() {
  const md = document.getElementById('content-editor').value;
  document.getElementById('editor-preview').innerHTML = parseMarkdownPreview(md);
}

/** Simple Markdown preview (same parser as main site) */
function parseMarkdownPreview(md) {
  let html = md
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="../$2" alt="$1" style="max-width:200px">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  return html.split(/\n{2,}/).map(b => {
    b = b.trim();
    if (!b) return '';
    if (/^<(h[1-6]|img|div|p)/i.test(b)) return b;
    return `<p>${b.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

/* ── Dates management ──────────────────────── */
async function loadDatesList() {
  const container = document.getElementById('dates-list');
  container.innerHTML = '<p>Termine werden geladen...</p>';
  allDates = [];

  try {
    const manifest = await getFile('dates/manifest.json');
    const filenames = JSON.parse(manifest.content);

    const loaded = await Promise.all(filenames.map(async (fn) => {
      try {
        const file = await getFile(`dates/${fn}`);
        return { filename: fn, data: JSON.parse(file.content), sha: file.sha };
      } catch { return null; }
    }));

    allDates = loaded.filter(Boolean).sort((a, b) =>
      new Date(a.data.date) - new Date(b.data.date));

    renderDates();
  } catch (e) {
    container.innerHTML = `<p class="error">Termine konnten nicht geladen werden: ${e.message}</p>`;
  }
}

function renderDates() {
  const container = document.getElementById('dates-list');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (allDates.length === 0) {
    container.innerHTML = '<p>Keine Termine vorhanden.</p>';
    return;
  }

  container.innerHTML = allDates.map(d => {
    const eventDate = new Date(d.data.date);
    const isPast = eventDate < today;
    const formatted = eventDate.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });

    return `
      <div class="date-card${isPast ? ' date-past-card' : ''}" data-filename="${d.filename}">
        <div class="date-info">
          <strong>${formatted}</strong> — ${d.data.city || ''}
          ${d.data.venue ? `<em>${d.data.venue}</em>` : ''}
          ${d.data.note  ? `<br><small>${d.data.note}</small>` : ''}
          ${d.data.link  ? `<br><small><a href="${d.data.link}" target="_blank">${d.data.link}</a></small>` : ''}
        </div>
        <div class="date-card-actions">
          <button class="btn-small edit-date-btn">✏️</button>
          <button class="btn-danger delete-date-btn">🗑️</button>
        </div>
      </div>`;
  }).join('');

  // Bind edit/delete
  container.querySelectorAll('.edit-date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.closest('.date-card').dataset.filename;
      openDateForm(fn);
    });
  });

  container.querySelectorAll('.delete-date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.closest('.date-card').dataset.filename;
      if (confirm(`Termin "${fn}" wirklich löschen?`)) deleteDate(fn);
    });
  });
}

function openDateForm(filename) {
  const form = document.getElementById('date-form');
  const title = document.getElementById('date-form-title');
  const status = document.getElementById('date-status');
  status.classList.add('hidden');
  form.classList.remove('hidden');

  if (filename) {
    // Edit existing
    editingDate = filename;
    const d = allDates.find(d => d.filename === filename);
    if (!d) return;
    title.textContent = 'Termin bearbeiten';
    document.getElementById('date-date').value  = d.data.date;
    document.getElementById('date-city').value  = d.data.city || '';
    document.getElementById('date-venue').value = d.data.venue || '';
    document.getElementById('date-note').value  = d.data.note || '';
    document.getElementById('date-link').value  = d.data.link || '';
  } else {
    // New
    editingDate = null;
    title.textContent = 'Neuer Termin';
    document.getElementById('date-date').value  = '';
    document.getElementById('date-city').value  = '';
    document.getElementById('date-venue').value = '';
    document.getElementById('date-note').value  = '';
    document.getElementById('date-link').value  = '';
  }
}

function closeDateForm() {
  document.getElementById('date-form').classList.add('hidden');
  editingDate = null;
}

async function saveDate() {
  const date  = document.getElementById('date-date').value;
  const city  = document.getElementById('date-city').value.trim();
  const venue = document.getElementById('date-venue').value.trim();
  const note  = document.getElementById('date-note').value.trim();
  const link  = document.getElementById('date-link').value.trim();

  if (!date) {
    showStatus('date-status', 'Bitte Datum eingeben', 'error');
    return;
  }

  const slugCity = (city || 'event').toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const filename = `${date}-${slugCity}.json`;
  const filepath = `dates/${filename}`;

  const content = JSON.stringify({ date, city, venue, note, link }, null, 2) + '\n';

  try {
    if (editingDate && editingDate !== filename) {
      // Filename changed (date or city changed) → delete old, create new
      const old = allDates.find(d => d.filename === editingDate);
      if (old) await deleteFile(`dates/${editingDate}`, old.sha, `Delete ${editingDate}`);
      await putFile(filepath, content, null, `Add ${filename}`);
    } else if (editingDate) {
      // Same filename → update in place
      const old = allDates.find(d => d.filename === editingDate);
      await putFile(filepath, content, old?.sha || null, `Update ${filename}`);
    } else {
      // New file
      await putFile(filepath, content, null, `Add ${filename}`);
    }

    // Update manifest
    await updateManifest(editingDate, filename);

    showStatus('date-status', '✅ Termin gespeichert!', 'success');
    closeDateForm();
    await loadDatesList();
  } catch (e) {
    showStatus('date-status', `❌ ${e.message}`, 'error');
  }
}

async function deleteDate(filename) {
  try {
    const d = allDates.find(d => d.filename === filename);
    if (!d) return;
    await deleteFile(`dates/${filename}`, d.sha, `Delete ${filename}`);
    await updateManifest(filename, null);  // remove from manifest
    await loadDatesList();
  } catch (e) {
    alert(`Fehler beim Löschen: ${e.message}`);
  }
}

async function updateManifest(removeFilename, addFilename) {
  const manifestFile = await getFile('dates/manifest.json');
  let manifest = JSON.parse(manifestFile.content);

  if (removeFilename) {
    manifest = manifest.filter(f => f !== removeFilename);
  }
  if (addFilename && !manifest.includes(addFilename)) {
    manifest.push(addFilename);
  }

  // Sort by filename (which starts with date)
  manifest.sort();

  const content = JSON.stringify(manifest, null, 2) + '\n';
  await putFile('dates/manifest.json', content, manifestFile.sha, 'Update manifest');
}

/* ── Helpers ───────────────────────────────── */
function showStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
  if (type === 'success') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}
