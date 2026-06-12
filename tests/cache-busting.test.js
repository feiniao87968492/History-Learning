import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const CACHE_VERSION = 'v=20260612-phase4-fix1';

function readProjectFile(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
}

describe('static asset cache busting', () => {
  test('index.html references CSS and JS assets with a deployment version query', () => {
    const html = readProjectFile('index.html');
    const assetRefs = Array.from(html.matchAll(/(?:href|src)="(\.\/src\/(?:css|js)\/[^"]+)"/g)).map((match) => match[1]);

    expect(assetRefs.length).toBeGreaterThan(10);
    assetRefs.forEach((ref) => {
      expect(ref).toContain('?' + CACHE_VERSION);
    });
  });

  test('app.js loads JSON data with the same deployment version query', () => {
    const app = readProjectFile('src/js/app.js');
    const dataRefs = Array.from(app.matchAll(/loadJSON\('(\.\/src\/data\/[^']+\.json[^']*)'/g)).map((match) => match[1]);

    expect(dataRefs.length).toBeGreaterThan(10);
    dataRefs.forEach((ref) => {
      expect(ref).toContain('?' + CACHE_VERSION);
    });
  });
});
