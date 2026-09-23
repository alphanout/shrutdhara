#!/usr/bin/env node
/* ============================================================
   श्रुतधारा · Autonomous Scripture Ingestion Engine
   Extracts text from Shastra PDFs lacking a /paath/ route,
   decodes legacy fonts (APS-DV/KrutiDev/Chanakya) to clean Unicode,
   structures verses, writes shastra/{slug}.md, and generates
   interactive /granth/{slug}/paath/ reader routes.
   ============================================================ */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { legacyToUnicode, isLegacyEncoded } from '../js/font-converter.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = join(ROOT, 'data/shastra-pdfs.json');
const GRANTHS_PATH = join(ROOT, 'data/granths-90.json');
const SHASTRA_DIR = join(ROOT, 'shastra');
const PDF_LOCAL_DIR = join(ROOT, 'pdf');
const DOWNLOADS_PDF_DIR = join(process.env.HOME || '', 'Downloads/JainGranthLibrary_PDFs');

// Load databases
const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const granths = JSON.parse(readFileSync(GRANTHS_PATH, 'utf8'));
const granthBySlug = new Map(granths.map((g) => [g.slug, g]));

/**
 * Locate PDF file path on disk (checks local pdf/ then Downloads)
 */
function findPdfPath(fileName) {
  const local = join(PDF_LOCAL_DIR, fileName);
  if (existsSync(local)) return local;
  const dl = join(DOWNLOADS_PDF_DIR, fileName);
  if (existsSync(dl)) return dl;
  return null;
}

/**
 * Filter out watermarks, publisher pages, and noise
 */
function isNoiseLine(line) {
  if (!line || line.trim().length === 0) return true;
  const l = line.toLowerCase();
  if (l.includes('jainelibrary') || l.includes('jain education international')) return true;
  if (l.includes('for private & personal use only') || l.includes('for personal and private use only')) return true;
  if (l.includes('isbn 978-') || l.includes('www.jambudweep.org') || l.includes('website :')) return true;
  if (l.includes('फोन नं.') || l.includes('मूल्य-') || l.includes('सर्वाधिकार सुरक्षित')) return true;
  if (/^\(?\s*\d+\s*\)?$/.test(line.trim())) return true; // standalone page number
  return false;
}

/**
 * Clean and structure text extracted from PDF pages into verse blocks
 */
function structureVerseBlocks(pagesText) {
  const blocks = [];
  let currentBlock = [];

  for (const pageRaw of pagesText) {
    if (!pageRaw || !pageRaw.trim()) continue;
    const lines = pageRaw.split('\n');

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (isNoiseLine(line)) continue;

      currentBlock.push(line);

      // Check if line indicates completion of a verse / stanza
      const isVerseEnd = /[॥।]\s*[\d०-९]+\s*[॥।]$/.test(line) ||
                         /^[॥।][॥।]$/.test(line) ||
                         /।।\s*[\d०-९]+\s*।।/.test(line) ||
                         /॥\s*[\d०-९]+\s*॥/.test(line) ||
                         /\(\s*[\d०-९]+\s*\)$/.test(line);

      if (isVerseEnd && currentBlock.length > 0) {
        const blockText = currentBlock.join('\n').trim();
        if (blockText.length > 10) {
          blocks.push(blockText);
        }
        currentBlock = [];
      } else if (currentBlock.length >= 6) {
        // Fallback boundary for long paragraphs
        const blockText = currentBlock.join('\n').trim();
        if (blockText.length > 15) {
          blocks.push(blockText);
        }
        currentBlock = [];
      }
    }
  }

  if (currentBlock.length > 0) {
    const remaining = currentBlock.join('\n').trim();
    if (remaining.length > 10) blocks.push(remaining);
  }

  return blocks;
}

/**
 * Ingest a specific scripture slug
 */
export async function ingestShastra(slug) {
  console.log(`\n=======================================================`);
  console.log(`📖 Autonomous Ingestion: ${slug}`);
  console.log(`=======================================================`);

  const item = catalog[slug];
  if (!item) {
    console.error(`❌ Slug "${slug}" not found in data/shastra-pdfs.json`);
    return false;
  }

  const pdfPath = findPdfPath(item.fileName);
  if (!pdfPath) {
    console.error(`❌ PDF file not found: ${item.fileName}`);
    console.error(`   Checked ${PDF_LOCAL_DIR} and ${DOWNLOADS_PDF_DIR}`);
    return false;
  }

  console.log(`  ✓ Found PDF: ${pdfPath}`);
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const numPages = doc.numPages;
  console.log(`  ✓ Loaded document: ${numPages} total pages`);

  const pagesText = [];
  let legacyPageCount = 0;
  let textPageCount = 0;

  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const rawStr = tc.items.map((i) => i.str).join(' ').trim();

    if (rawStr.length > 20) {
      textPageCount++;
      if (isLegacyEncoded(rawStr)) {
        legacyPageCount++;
        const decoded = legacyToUnicode(rawStr);
        pagesText.push(decoded);
      } else {
        pagesText.push(rawStr);
      }
    }
  }

  console.log(`  ✓ Extracted text from ${textPageCount}/${numPages} pages (${legacyPageCount} legacy-encoded converted to Unicode)`);

  if (pagesText.length === 0) {
    console.warn(`  ⚠️ No digital text layer found in ${slug}. This PDF contains scanned bitmap images.`);
    return false;
  }

  // Structure into verses
  const blocks = structureVerseBlocks(pagesText);
  console.log(`  ✓ Structured ${blocks.length} verse/text blocks`);

  if (blocks.length === 0) {
    console.warn(`  ⚠️ Could not parse structured verses from ${slug}`);
    return false;
  }

  // Determine metadata
  const g = granthBySlug.get(slug) || {};
  const title = item.name || g.name || slug;
  const lang = item.category?.includes('Sanskrit') ? 'संस्कृतम्' : 'प्राकृतम्/हिन्दी';
  const outPath = join(SHASTRA_DIR, `${slug}.md`);

  const frontmatter = [
    '---',
    `title: "${title}"`,
    `slug: ${slug}`,
    `language: ${lang}`,
    `verses: ${blocks.length}`,
    `source: "दिगम्बर जैन ग्रन्थ संग्रह (डिजिटाइज़्ड मूल पाठ)"`,
    `sourcePdf: "${item.fileName}"`,
    `license: CC BY-NC-SA 4.0`,
    '---',
    '',
    blocks.join('\n\n'),
    ''
  ].join('\n');

  writeFileSync(outPath, frontmatter, 'utf8');
  console.log(`  ✓ Wrote ${outPath} (${blocks.length} verses)`);

  // Build and verify
  console.log(`  ⚙️ Running build to compile /granth/${slug}/paath/ route...`);
  try {
    execSync('node build/build.mjs', { cwd: ROOT, stdio: 'inherit' });
    console.log(`  🎉 Ingestion successful for ${slug}! Reader route active at /granth/${slug}/paath/`);
    return true;
  } catch (err) {
    console.error(`  ❌ Build failed:`, err);
    return false;
  }
}

/**
 * List all PDF scriptures that lack a /paath/ route
 */
export function listMissing() {
  const existingFiles = new Set(
    readdirSync(SHASTRA_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  );

  const missing = [];
  for (const [slug, item] of Object.entries(catalog)) {
    if (!existingFiles.has(slug)) {
      const pdfPath = findPdfPath(item.fileName);
      missing.push({
        slug,
        name: item.name,
        fileName: item.fileName,
        size: item.size,
        hasPdf: Boolean(pdfPath),
      });
    }
  }
  return missing;
}

// ------------------------------------------------------------
// CLI Execution
// ------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || '--missing';

  if (cmd === '--missing' || cmd === '-m' || cmd === '--list') {
    const missing = listMissing();
    console.log(`\n📋 Found ${missing.length} PDF scriptures lacking a /paath/ route:\n`);
    missing.forEach((m, idx) => {
      const status = m.hasPdf ? '🟢 PDF available locally' : '⚪ Remote only';
      console.log(`  ${idx + 1}. [${m.slug}] ${m.name} — ${m.size} (${status})`);
    });
    console.log(`\nTo ingest a scripture, run: node build/ingest-pdf-to-paath.mjs <slug>\n`);
    return;
  }

  // Ingest specific slug
  const slug = cmd;
  const ok = await ingestShastra(slug);
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('Fatal ingestion error:', err);
    process.exit(1);
  });
}
