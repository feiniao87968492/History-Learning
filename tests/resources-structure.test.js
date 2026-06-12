import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

describe('resources structure', () => {
  test('keeps the normalized resources directory skeleton', () => {
    expect(exists('resources/images')).toBe(true);
    expect(exists('resources/images/memes')).toBe(true);
    expect(exists('resources/images/nouns')).toBe(true);
    expect(exists('resources/images/people')).toBe(true);
    expect(exists('resources/images/timeline')).toBe(true);
    expect(exists('resources/images/common')).toBe(true);
    expect(exists('resources/audio/podcasts')).toBe(true);
    expect(exists('resources/icons')).toBe(true);
    expect(exists('resources/raw/imported')).toBe(true);
  });

  test('does not keep macOS metadata files in normalized runtime directories', () => {
    expect(exists('resources/images/.DS_Store')).toBe(false);
    expect(exists('resources/images/__MACOSX')).toBe(false);
  });
});
