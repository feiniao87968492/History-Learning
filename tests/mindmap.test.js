import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const MINDMAPS = {
  maps: {
    china: {
      id: 'china',
      title: '中国通史',
      nodes: [
        { id: 'china-root', label: '中国通史', root: true, x: 140, y: 180 },
        { id: 'pre-qin', label: '先秦', x: 30, y: 60, parent: 'china-root' },
        { id: 'qin-han', label: '秦汉', x: 30, y: 130, parent: 'china-root' }
      ]
    },
    world: {
      id: 'world',
      title: '世界史',
      nodes: [
        { id: 'world-root', label: '世界史', root: true, x: 140, y: 180 },
        { id: 'greece-rome', label: '古希腊罗马', x: 20, y: 60, parent: 'world-root' }
      ]
    }
  }
};

function mountMindmapDOM() {
  mountDOM(`
    <div id="mindmap-page">
      <div class="mt" id="mindmap-tabs">
        <button class="mtab act" onclick="swMind(this,'china')">中国通史</button>
        <button class="mtab" onclick="swMind(this,'world')">世界国别史</button>
        <button class="mtab" onclick="swMind(this,'custom')">＋ 新建导图</button>
      </div>
      <div id="mm-china" class="mc" style="position:relative;height:450px"></div>
      <div id="mm-world" class="mc" style="display:none;position:relative;height:450px"></div>
      <div id="mm-custom" class="mc" style="display:none;height:450px"></div>
    </div>
    <div class="nnp" id="node-note-panel">
      <div class="nch"><h3 id="node-note-title">📝 节点笔记</h3><button onclick="closeNodeNote()">✕</button></div>
      <textarea id="node-note-input"></textarea>
      <button id="node-note-save" onclick="saveNode()">保存笔记</button>
    </div>
    <div id="toast"></div>
  `);
}

function createStorageMock(initial) {
  const store = new Map(Object.entries(initial || {}));
  return {
    getStoredString: vi.fn((key, fallback) => store.has(key) ? store.get(key) : fallback),
    setStoredString: vi.fn((key, value) => { store.set(key, String(value)); return true; }),
    getStoredJSON: vi.fn(),
    setStoredJSON: vi.fn(),
    dump: () => Object.fromEntries(store.entries())
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  mountMindmapDOM();
  window.storageAPI = createStorageMock();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('mindmap module', () => {
  test('renders preset mindmap nodes and links from JSON data', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);
    window.mindmapAPI.renderMindmap('china');

    expect(document.querySelectorAll('#mm-china .mn')).toHaveLength(3);
    expect(document.getElementById('mm-china').textContent).toContain('中国通史');
    expect(document.getElementById('mm-china').textContent).toContain('先秦');
    expect(document.querySelectorAll('#mm-china svg line')).toHaveLength(2);
  });

  test('switches between preset maps and active tabs', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.swMind(document.querySelectorAll('#mindmap-tabs .mtab')[1], 'world');

    expect(document.querySelectorAll('#mindmap-tabs .mtab')[1].classList.contains('act')).toBe(true);
    expect(document.getElementById('mm-china').style.display).toBe('none');
    expect(document.getElementById('mm-world').style.display).toBe('block');
    expect(document.getElementById('mm-world').textContent).toContain('古希腊罗马');
  });

  test('opens a node note and restores existing note from storage adapter', async () => {
    window.storageAPI = createStorageMock({ 'mindmap_note_pre-qin': '旧笔记' });
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);
    window.mindmapAPI.renderMindmap('china');

    document.querySelector('[data-mindmap-node="pre-qin"]').click();

    expect(document.getElementById('node-note-title').textContent).toContain('先秦');
    expect(document.getElementById('node-note-input').value).toBe('旧笔记');
    expect(document.getElementById('node-note-panel').style.display).toBe('flex');
  });

  test('saves node notes through storage adapter', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.openNode('qin-han');
    document.getElementById('node-note-input').value = '秦汉制度笔记';
    window.mindmapAPI.saveNode();

    expect(window.storageAPI.setStoredString).toHaveBeenCalledWith('mindmap_note_qin-han', '秦汉制度笔记');
    expect(document.getElementById('node-note-panel').style.display).toBe('none');
    expect(window.navigationAPI.showToast).toHaveBeenCalledWith('「秦汉」的笔记已保存！');
  });

  test('escapes script-like node labels before rendering', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData({ maps: { china: { id: 'china', nodes: [
      { id: 'root', label: '<script>window.__mindXss = true</script>', root: true, x: 100, y: 100 }
    ] } } });

    window.mindmapAPI.renderMindmap('china');

    expect(document.querySelector('#mm-china script')).toBeNull();
    expect(window.__mindXss).toBeUndefined();
    expect(document.getElementById('mm-china').innerHTML).toContain('&lt;script&gt;window.__mindXss = true&lt;/script&gt;');
  });

  test('index.html keeps mindmap preset containers empty for JSON-driven rendering', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

    expect(html).toContain('<div id="mm-china" class="mc" style="position:relative;height:450px"></div>');
    expect(html).toContain('<div id="mm-world" class="mc" style="display:none;position:relative;height:450px"></div>');
    expect(html).not.toContain('onclick="openNode(\'中国通史\')"');
    expect(html).not.toContain('onclick="openNode(\'世界史\')"');
  });

  test('exposes global compatibility functions for existing inline event calls', async () => {
    await import('../src/js/mindmap.js');

    expect(window.swMind).toBe(window.mindmapAPI.swMind);
    expect(window.openNode).toBe(window.mindmapAPI.openNode);
    expect(window.saveNode).toBe(window.mindmapAPI.saveNode);
    expect(window.closeNodeNote).toBe(window.mindmapAPI.closeNodeNote);
  });

  test('closeNodeNote hides the note panel', async () => {
    await import('../src/js/mindmap.js');
    document.getElementById('node-note-panel').style.display = 'flex';

    window.mindmapAPI.closeNodeNote();

    expect(document.getElementById('node-note-panel').style.display).toBe('none');
  });

  test('renderAllMindmaps renders every configured preset map', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.renderAllMindmaps();

    expect(document.querySelectorAll('#mm-china .mn')).toHaveLength(3);
    expect(document.querySelectorAll('#mm-world .mn')).toHaveLength(2);
  });

  test('renders empty state for missing map data', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData({ maps: { china: { id: 'china', nodes: [] } } });

    window.mindmapAPI.renderMindmap('china');

    expect(document.getElementById('mm-china').textContent).toContain('暂无导图数据');
  });

  test('custom tab shows a disabled preview instead of a development toast', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData(MINDMAPS);

    window.mindmapAPI.swMind(document.querySelectorAll('#mindmap-tabs .mtab')[2], 'custom');

    expect(document.querySelectorAll('#mindmap-tabs .mtab')[2].classList.contains('act')).toBe(true);
    expect(document.getElementById('mm-custom').style.display).toBe('flex');
    expect(document.getElementById('mm-custom').textContent).toContain('自定义导图编辑器将在后续版本开放');
    expect(window.navigationAPI.showToast).not.toHaveBeenCalledWith(expect.stringContaining('开发中'));
  });

  test('escapes node ids and coordinates before writing HTML attributes', async () => {
    await import('../src/js/mindmap.js');
    window.mindmapAPI.setMindmapData({ maps: { china: { id: 'china', nodes: [
      { id: 'evil" onclick="window.__mindIdXss=true', label: '安全标签', root: true, x: '10" onmouseover="window.__mindXXss=true', y: '20" onmouseover="window.__mindYXss=true' }
    ] } } });

    window.mindmapAPI.renderMindmap('china');

    expect(document.getElementById('mm-china').querySelector('[onclick]')).toBeNull();
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindIdXss=true');
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindXXss=true');
    expect(document.getElementById('mm-china').innerHTML).not.toContain('window.__mindYXss=true');
    expect(window.__mindIdXss).toBeUndefined();
    expect(window.__mindXXss).toBeUndefined();
    expect(window.__mindYXss).toBeUndefined();
  });
});
