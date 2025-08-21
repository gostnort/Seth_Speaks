#!/usr/bin/env node
// Node script to generate `chapters.json` from text files in `origin/`.
// It reads the first two lines of each .txt file and creates an array of
// { filename, englishTitle, chineseTitle } objects.
// Optional: create a `chapters.config.json` with a `sequence` array to
// control ordering. If missing, files are sorted by filename.

const fs = require('fs').promises;
const path = require('path');

const ORIGIN_DIR = path.join(__dirname, 'origin');
const OUT_FILE = path.join(__dirname, 'chapters.json');
const CONFIG_FILE = path.join(__dirname, 'chapters.config.json');

async function readFirstTwoLines(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const line1 = (lines[0] || '').trim();
    const line2 = (lines[1] || '').trim();
    return { line1, line2 };
}

async function loadConfig() {
    try {
        const raw = await fs.readFile(CONFIG_FILE, 'utf8');
        const json = JSON.parse(raw);
        if (Array.isArray(json.sequence)) return json.sequence;
    } catch (err) {
        // ignore
    }
    return null;
}

async function buildManifest() {
    const configuredSequence = await loadConfig();

    let files = await fs.readdir(ORIGIN_DIR);
    files = files.filter(f => f.toLowerCase().endsWith('.txt'));

    if (configuredSequence) {
        // Keep only configured files in the order specified, ignore missing
        files = configuredSequence.filter(f => files.includes(f));
        // Append any other files that were not listed
        const remaining = (await fs.readdir(ORIGIN_DIR)).filter(f => f.toLowerCase().endsWith('.txt') && !files.includes(f));
        files = files.concat(remaining.sort());
    } else {
        files = files.sort();
    }

    const manifest = [];
    for (const fname of files) {
        const full = path.join(ORIGIN_DIR, fname);
        try {
            const { line1, line2 } = await readFirstTwoLines(full);
            manifest.push({ filename: fname, englishTitle: line1, chineseTitle: line2 });
        } catch (err) {
            console.warn('Failed reading', full, err.message);
        }
    }

    await fs.writeFile(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Wrote', OUT_FILE, 'with', manifest.length, 'entries');
}

if (require.main === module) {
    buildManifest().catch(err => {
        console.error(err);
        process.exit(1);
    });
}


