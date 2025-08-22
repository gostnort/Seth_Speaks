// Try to load a generated manifest `chapters.json` from the site root.
// If it's missing or fails, generate the chapter list from `chapters.config.json`
// and read the first two non-empty lines of each chapter file to use as titles.

async function buildChaptersFromConfig() {
    try {
        const resp = await fetch('chapters.config.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const cfg = await resp.json();
        if (!cfg || !Array.isArray(cfg.sequence)) throw new Error('Invalid chapters.config.json');

        const results = [];
        for (const filename of cfg.sequence) {
            try {
                const fresp = await fetch(`origin/${filename}`, { cache: 'no-store' });
                if (!fresp.ok) throw new Error(`HTTP ${fresp.status}`);
                const text = await fresp.text();
                const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
                results.push({
                    filename,
                    line1: lines[0] || '',
                    line2: lines[1] || ''
                });
            } catch (err) {
                console.warn('Failed to read', filename, err);
                results.push({ filename, line1: '', line2: '' });
            }
        }

        return results;
    } catch (err) {
        console.warn('Could not load chapters.config.json', err);
        return [];
    }
}

async function fetchChaptersManifest() {
    try {
        const resp = await fetch('chapters.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!Array.isArray(json)) throw new Error('Invalid manifest');
        return json;
    } catch (err) {
        console.warn('Could not load chapters.json, attempting to build from chapters.config.json', err);
        const built = await buildChaptersFromConfig();
        if (built && built.length > 0) return built;
        return [];
    }
}

async function loadChapterList() {
    const chapterListContainer = document.getElementById('chapterList');
    const chapters = await fetchChaptersManifest();

    if (!chapters || chapters.length === 0) {
        chapterListContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>No chapters available yet.</p>
                <p>没有可用的章节。</p>
            </div>
        `;
        return;
    }

    chapters.forEach((chapter, index) => {
        const chapterNumber = index + 1;
        const chapterItem = document.createElement('a');
        chapterItem.href = `chapter.html?chapter=${encodeURIComponent(chapter.filename)}`;
        chapterItem.className = 'chapter-item';

        // Use the first two lines as titles; manifest generator provides them.
        const english = chapter.englishTitle || chapter.title || chapter.line1 || '';
        const chinese = chapter.chineseTitle || chapter.line2 || '';

        chapterItem.innerHTML = `
            <div class="chapter-title"> ${escapeHtml(english)}</div>
            <div class="chapter-subtitle"> ${escapeHtml(chinese)}</div>
        `;

        chapterListContainer.appendChild(chapterItem);
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Load chapter list when page loads
document.addEventListener('DOMContentLoaded', loadChapterList);


