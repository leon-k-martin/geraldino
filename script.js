/* ── Geraldino – script.js ─────────────────── */
/* Vanilla JS: loads markdown content & JSON dates */

document.addEventListener('DOMContentLoaded', () => {
  loadMarkdown('content/hallo.md', 'hallo-content');
  loadMarkdown('content/musik.md', 'musik-content');
  loadMarkdown('content/bio.md',   'bio-content');
  loadDates();
});

/* ── Markdown loader ───────────────────────── */
async function loadMarkdown(path, targetId) {
  const el = document.getElementById(targetId);
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    const md = await res.text();
    el.innerHTML = parseMarkdown(md);
  } catch (e) {
    el.innerHTML = '<p>Inhalt konnte nicht geladen werden.</p>';
    console.error(`Failed to load ${path}:`, e);
  }
}

/**
 * Minimal markdown → HTML parser.
 * Supports: headings (#-###), bold (**), italic (*), links, images, paragraphs.
 * For anything fancier, swap in a library.
 */
function parseMarkdown(md) {
  let html = md
    // images: ![alt](src)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
      const cls = alt.toLowerCase().includes('hero') ? ' class="hero-img"' : '';
      return `<img src="${src}" alt="${alt}"${cls}>`;
    })
    // links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // paragraphs: split on blank lines
  html = html
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      // don't wrap blocks that already start with an HTML tag
      if (/^<(h[1-6]|img|div|ul|ol|li|p|blockquote|iframe)/i.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}

/* ── Dates loader ──────────────────────────── */
async function loadDates() {
  const list = document.getElementById('dates-list');
  const noMsg = document.getElementById('no-dates');

  try {
    const manifestRes = await fetch('dates/manifest.json');
    if (!manifestRes.ok) throw new Error('No manifest');
    const manifest = await manifestRes.json();

    // Fetch all date files in parallel
    const dateFiles = await Promise.all(
      manifest.map(async (filename) => {
        try {
          const res = await fetch(`dates/${filename}`);
          if (!res.ok) return null;
          return await res.json();
        } catch { return null; }
      })
    );

    const dates = dateFiles
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (dates.length === 0) {
      list.classList.add('hidden');
      noMsg.classList.remove('hidden');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    list.innerHTML = dates.map(d => {
      const eventDate = new Date(d.date);
      const isPast = eventDate < today;
      const formatted = eventDate.toLocaleDateString('de-DE', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
      });

      return `
        <li${isPast ? ' class="date-past"' : ''}>
          <span class="date-when">${formatted}</span>
          <span class="date-where">${d.city || ''}</span>
          ${d.venue ? `<span class="date-venue">${d.venue}</span>` : ''}
          ${d.note  ? `<span class="date-note">${d.note}</span>` : ''}
          ${d.link  ? `<span class="date-link"><a href="${d.link}" target="_blank" rel="noopener">Info →</a></span>` : ''}
        </li>`;
    }).join('');

  } catch (e) {
    list.innerHTML = '';
    noMsg.classList.remove('hidden');
    console.error('Failed to load dates:', e);
  }
}
