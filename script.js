// Try to load a generated manifest `chapters.json` from the site root.
// If it's missing or fails, fall back to a small embedded list.
const fallbackChapters = [
    {
        filename: 'Chapter_1.txt',
        englishTitle: 'I Do Not Have a Physical Body, Yet I Am Writing This Book',
        chineseTitle: '我没有肉体，却在写这本书'
    },
    {
        filename: 'Chapter_2.txt',
        englishTitle: 'My present environment, Work, and activities.',
        chineseTitle: '我现在所处的环境、工作和活动。'
    }
];

async function fetchChaptersManifest() {
    try {
        const resp = await fetch('chapters.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!Array.isArray(json)) throw new Error('Invalid manifest');
        return json;
    } catch (err) {
        console.warn('Could not load chapters.json, using fallback list.', err);
        return fallbackChapters;
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
            <div class="chapter-title">Chapter ${chapterNumber}: ${escapeHtml(english)}</div>
            <div class="chapter-subtitle">第${chapterNumber}章：${escapeHtml(chinese)}</div>
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


