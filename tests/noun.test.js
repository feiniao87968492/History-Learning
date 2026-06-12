import fs from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

function mountNounDOM() {
  mountDOM(`
    <input id="noun-search-input" />
    <div class="nc" id="noun-grid"></div>
    <div id="noun-detail" class="nd">
      <h2 id="nd-title"></h2>
      <div id="nd-meta"></div>
      <p id="nd-text"></p>
      <div class="mp"></div>
      <div id="nd-related"></div>
    </div>
    <div id="toast"></div>
  `);
}

const NOUNS = {
  '郡县制': {
    text: '秦统一后在全国推行郡县制，地方长官由中央任免，行政权力不再世袭。它削弱了诸侯割据的基础，使中央政令能够直接抵达地方，是中国古代中央集权制度形成的重要标志。',
    related: ['秦始皇', '分封制', '中央集权'],
    dynasty: '秦朝',
    category: '制度',
    map: '秦统一后的郡县分布示意',
    year: '前221年'
  },
  '科举制': {
    text: '科举制是隋唐以后通过考试选拔官员的制度。它打破门阀世族长期垄断仕途的局面，使寒门士人能够凭借经学、诗赋和策论进入官僚体系。',
    related: ['三省六部制', '九品中正制'],
    dynasty: '隋唐',
    category: '制度',
    map: '唐代贡举入京路线示意',
    year: '605年'
  },
  '交子': {
    text: '交子是北宋四川地区出现的纸币，最初由商人发行，后来由政府接管。它反映了宋代商品经济和长途贸易的发展，也体现了金属货币在大规模交易中的局限。',
    related: ['市舶司', '宋代经济'],
    dynasty: '宋朝',
    category: '经济',
    map: '北宋四川与商贸路线示意',
    year: '北宋'
  }
};

beforeEach(() => {
  vi.resetModules();
  resetGlobals();
  mountNounDOM();
  window.navigationAPI = { showToast: vi.fn() };
  window.htmlUtils = {
    escapeHtml(value) {
      if (value === null || typeof value === 'undefined') return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };
});

describe('noun data-driven rendering', () => {
  test('renders cards from noun data after setNounData', async () => {
    await import('../src/js/noun.js');

    window.nounAPI.setNounData(NOUNS);

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(3);
    expect(document.getElementById('noun-grid').textContent).toContain('郡县制');
    expect(document.getElementById('noun-grid').textContent).toContain('秦朝');
    expect(document.getElementById('noun-grid').textContent).toContain('制度');
  });

  test('search filters by dynasty and empty search restores all cards', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    document.getElementById('noun-search-input').value = '唐朝';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(1);
    expect(document.getElementById('noun-grid').textContent).toContain('科举制');
    expect(document.getElementById('noun-grid').textContent).not.toContain('郡县制');

    document.getElementById('noun-search-input').value = '';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(3);
  });

  test('search shows empty state when no noun matches', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    document.getElementById('noun-search-input').value = '不存在的名词';
    window.nounAPI.searchNouns();

    expect(document.querySelectorAll('#noun-grid .ncard')).toHaveLength(0);
    expect(document.getElementById('noun-grid').textContent).toContain('暂无匹配名词');
  });

  test('openNounDet renders text metadata map and related buttons safely', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData(NOUNS);

    window.nounAPI.openNounDet('郡县制');

    expect(document.getElementById('nd-title').textContent).toBe('郡县制');
    expect(document.getElementById('nd-text').textContent).toContain('中央集权制度');
    expect(document.getElementById('nd-meta').textContent).toContain('秦朝');
    expect(document.getElementById('nd-meta').textContent).toContain('制度');
    expect(document.querySelector('#noun-detail .mp').textContent).toContain('秦统一后的郡县分布示意');
    expect(document.querySelectorAll('#nd-related .nrtag')).toHaveLength(3);
  });

  test('escapes script-like noun data in card HTML', async () => {
    await import('../src/js/noun.js');
    window.nounAPI.setNounData({
      '<script>window.__xss = true</script>': {
        text: '<img src=x onerror="window.__xss = true">恶意正文',
        related: ['<script>alert(1)</script>'],
        dynasty: '<script>唐朝</script>',
        category: '制度',
        map: '<script>地图</script>',
        year: '测试'
      }
    });

    expect(document.querySelector('#noun-grid script')).toBeNull();
    expect(window.__xss).toBeUndefined();
    expect(document.getElementById('noun-grid').innerHTML).toContain('&lt;script&gt;window.__xss = true&lt;/script&gt;');
    expect(document.querySelector('#noun-grid img')).toBeNull();
    expect(document.getElementById('noun-grid').textContent).toContain('<img src=x onerror="window.__xss = true">恶意正文');
  });

  test('seed nouns include 8 to 12 structured entries with valid related targets', () => {
    var raw = fs.readFileSync('src/data/nouns.json', 'utf8');
    var data = JSON.parse(raw);
    var names = Object.keys(data);

    expect(names.length).toBeGreaterThanOrEqual(8);
    expect(names.length).toBeLessThanOrEqual(12);

    names.forEach(function (name) {
      var entry = data[name];
      expect(entry.text.length).toBeGreaterThanOrEqual(100);
      expect(entry.text.length).toBeLessThanOrEqual(500);
      expect(entry.dynasty).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(Array.isArray(entry.related)).toBe(true);
      expect(entry.related.length).toBeGreaterThanOrEqual(2);
      expect(entry.related.length).toBeLessThanOrEqual(3);
      entry.related.forEach(function (relatedName) {
        expect(data[relatedName], name + ' related target exists: ' + relatedName).toBeTruthy();
      });
    });
  });

  test('index noun shell uses an empty render target and metadata container', () => {
    var html = fs.readFileSync('index.html', 'utf8');
    var gridMatch = html.match(/<div class="nc" id="noun-grid">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="noun-detail"/);

    expect(gridMatch).toBeTruthy();
    expect(gridMatch[1].trim()).toBe('');
    expect(html).toContain('id="nd-meta"');
  });
});
