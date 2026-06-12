import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const PEOPLE_DATA = {
  defaultCenter: 'wu-zetian',
  people: [
    { id: 'wu-zetian', name: '武则天', dynasty: '唐朝', summary: '中国历史上唯一正统女皇帝。', yearTable: ['690年 称帝'], evaluation: '上承贞观，下启开元。' },
    { id: 'di-renjie', name: '狄仁杰', dynasty: '唐朝', summary: '武周名臣。', yearTable: ['696年 任宰相'], evaluation: '刚正善断。' },
    { id: 'li-zhi', name: '李治', dynasty: '唐朝', summary: '唐高宗。', yearTable: ['649年 即位'], evaluation: '永徽之治。' },
    { id: 'shangguan-waner', name: '上官婉儿', dynasty: '唐朝', summary: '女官与文学家。', yearTable: ['677年 生'], evaluation: '有巾帼宰相之称。' },
    { id: 'li-longji', name: '李隆基', dynasty: '唐朝', summary: '唐玄宗。', yearTable: ['712年 即位'], evaluation: '开元盛世与天宝危局并存。' }
  ],
  relations: [
    { source: 'wu-zetian', target: 'di-renjie', type: 'career', label: '君臣', description: '武则天重用狄仁杰处理政务。' },
    { source: 'wu-zetian', target: 'li-zhi', type: 'family', label: '夫妻', description: '武则天为唐高宗皇后。' },
    { source: 'wu-zetian', target: 'shangguan-waner', type: 'teacher', label: '主从', description: '上官婉儿掌诏命文书。' },
    { source: 'wu-zetian', target: 'li-longji', type: 'political', label: '祖孙政治', description: '武周政治遗产影响开元政治。' }
  ]
};

function mountPeopleDOM() {
  mountDOM(`
    <div id="people-page">
      <input id="people-search-input">
      <span id="cur-peo-name"></span>
      <button class="dtab act" data-relation-filter="all">全部</button>
      <button class="dtab" data-relation-filter="career">事业</button>
      <button class="dtab" data-relation-filter="family">亲属</button>
      <button class="dtab" data-relation-filter="teacher">师友</button>
      <button class="dtab" data-relation-filter="political">政治</button>
      <div class="rs"><svg id="relation-svg" viewBox="0 0 350 400" xmlns="http://www.w3.org/2000/svg"></svg></div>
    </div>
    <div class="pdc" id="people-detail-card">
      <h3 id="pd-name"></h3>
      <p id="pd-role"></p>
      <div id="pd-info"></div>
      <ul id="pd-deeds"></ul>
      <ul id="pd-year-table"></ul>
      <div id="pd-eval"><p></p></div>
    </div>
    <div id="toast"></div>
  `);
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  resetGlobals();
  mountPeopleDOM();
  window.navigationAPI = { showToast: vi.fn() };
});

describe('people relationship graph', () => {
  test('parses graph structured people and builds adjacency', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);

    expect(window.peopleAPI.getPersonById('wu-zetian').name).toBe('武则天');
    expect(window.peopleAPI.getAdjacentRelations('wu-zetian', 'all')).toHaveLength(4);
    expect(window.peopleAPI.getAdjacentRelations('wu-zetian', 'career')[0].target).toBe('di-renjie');
  });

  test('renders center person and surrounding adjacent people', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);
    window.peopleAPI.renderPeopleGraph();

    expect(document.getElementById('cur-peo-name').textContent).toBe('武则天');
    expect(document.querySelectorAll('#relation-svg .person-node')).toHaveLength(5);
    expect(document.getElementById('relation-svg').textContent).toContain('狄仁杰');
  });

  test('clicking a person recenters the graph and opens known person details', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);
    window.peopleAPI.renderPeopleGraph();

    document.querySelector('[data-person-id="di-renjie"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(window.peopleAPI.getPeopleState().currentPersonId).toBe('di-renjie');
    expect(document.getElementById('cur-peo-name').textContent).toBe('狄仁杰');
    expect(document.getElementById('pd-name').textContent).toContain('狄仁杰');
  });

  test('clicking a relation line displays relationship description', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);
    window.peopleAPI.renderPeopleGraph();

    document.querySelector('[data-relation-id="wu-zetian__di-renjie__career"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.getElementById('pd-name').textContent).toContain('君臣');
    expect(document.getElementById('pd-info').textContent).toContain('武则天重用狄仁杰');
  });

  test('relationship filtering switches visible relation types', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);
    window.peopleAPI.filterPeopleRelations('family', document.querySelector('[data-relation-filter="family"]'));

    expect(document.querySelector('[data-relation-filter="family"]').classList.contains('act')).toBe(true);
    expect(document.querySelectorAll('#relation-svg .relation-line')).toHaveLength(1);
    expect(document.getElementById('relation-svg').textContent).toContain('李治');
    expect(document.getElementById('relation-svg').textContent).not.toContain('狄仁杰');
  });

  test('supports all required relation filters', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData(PEOPLE_DATA);

    const cases = [
      { type: 'all', expectedLines: 4, visible: ['狄仁杰', '李治', '上官婉儿', '李隆基'] },
      { type: 'career', expectedLines: 1, visible: ['狄仁杰'] },
      { type: 'family', expectedLines: 1, visible: ['李治'] },
      { type: 'teacher', expectedLines: 1, visible: ['上官婉儿'] },
      { type: 'political', expectedLines: 1, visible: ['李隆基'] }
    ];

    cases.forEach((item) => {
      window.peopleAPI.filterPeopleRelations(item.type, document.querySelector('[data-relation-filter="' + item.type + '"]'));
      expect(document.querySelectorAll('#relation-svg .relation-line')).toHaveLength(item.expectedLines);
      item.visible.forEach((name) => {
        expect(document.getElementById('relation-svg').textContent).toContain(name);
      });
    });
  });

  test('escapes graph data in person and relation detail rendering', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({
      defaultCenter: 'evil-center',
      people: [
        {
          id: 'evil-center',
          name: '<img src=x onerror="window.__peopleNameXss=true">',
          dynasty: '<script>window.__peopleDynastyXss=true</script>',
          summary: '<img src=x onerror="window.__peopleSummaryXss=true">',
          yearTable: ['<script>window.__peopleYearXss=true</script>'],
          evaluation: '<img src=x onerror="window.__peopleEvalXss=true">'
        },
        {
          id: 'safe-target',
          name: '安全人物',
          dynasty: '测试',
          summary: '安全说明'
        }
      ],
      relations: [
        {
          source: 'evil-center',
          target: 'safe-target',
          type: 'career',
          label: '<img src=x onerror="window.__peopleLabelXss=true">',
          description: '<img src=x onerror="window.__peopleRelationXss=true">'
        }
      ]
    });

    window.peopleAPI.renderPeopleGraph();
    window.peopleAPI.openPeoDet('evil-center');

    expect(document.getElementById('pd-name').textContent).toContain('<img src=x');
    expect(document.getElementById('pd-info').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('pd-info').querySelector('img')).toBeNull();
    expect(document.getElementById('pd-year-table').querySelector('script')).toBeNull();
    expect(document.getElementById('pd-eval').querySelector('img')).toBeNull();

    document.querySelector('#relation-svg .relation-line').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.getElementById('pd-name').textContent).toContain('<img src=x');
    expect(document.getElementById('pd-info').innerHTML).toContain('&lt;img src=x');
    expect(document.getElementById('pd-info').querySelector('img')).toBeNull();
    expect(window.__peopleNameXss).toBeUndefined();
    expect(window.__peopleDynastyXss).toBeUndefined();
    expect(window.__peopleSummaryXss).toBeUndefined();
    expect(window.__peopleYearXss).toBeUndefined();
    expect(window.__peopleEvalXss).toBeUndefined();
    expect(window.__peopleLabelXss).toBeUndefined();
    expect(window.__peopleRelationXss).toBeUndefined();
  });

  test('detects duplicate and invalid relations', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({
      people: PEOPLE_DATA.people,
      relations: PEOPLE_DATA.relations.concat([
        { source: 'di-renjie', target: 'wu-zetian', type: 'career', label: '反向重复', description: '反向重复关系' },
        { source: 'wu-zetian', target: 'missing-person', type: 'career', label: '缺失', description: '无效关系' }
      ])
    });

    expect(window.peopleAPI.detectDuplicateRelations()).toContain('di-renjie__wu-zetian__career');
    expect(window.peopleAPI.detectInvalidRelations()).toContain('wu-zetian->missing-person');
  });

  test('handles empty people data and isolated people safely', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({ people: [], relations: [] });
    window.peopleAPI.renderPeopleGraph();
    expect(document.getElementById('relation-svg').textContent).toContain('暂无人物数据');

    window.peopleAPI.setPeopleData({ people: [{ id: 'isolated', name: '孤立人物', dynasty: '测试', summary: '无关系人物' }], relations: [] });
    window.peopleAPI.renderPeopleGraph();
    expect(document.getElementById('relation-svg').textContent).toContain('孤立人物');
    expect(document.getElementById('relation-svg').textContent).toContain('暂无关联人物');
  });

  test('index.html no longer contains the legacy inline people graph implementation', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

    expect(html).not.toContain('var peoData=');
    expect(html).not.toContain('function renderRel()');
    expect(html).not.toContain('function swPeoGroup(btn, group)');
    expect(html).not.toContain("document.getElementById('center-name')");
    expect(html).toContain('人物关系网 已迁移到 src/js/people.js');
  });
});
