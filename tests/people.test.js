import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mountDOM, resetGlobals } from './helpers/dom-test-utils.js';

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

  test('detects duplicate and invalid relations', async () => {
    await import('../src/js/people.js');
    window.peopleAPI.setPeopleData({
      people: PEOPLE_DATA.people,
      relations: PEOPLE_DATA.relations.concat([
        { source: 'wu-zetian', target: 'di-renjie', type: 'career', label: '重复', description: '重复关系' },
        { source: 'wu-zetian', target: 'missing-person', type: 'career', label: '缺失', description: '无效关系' }
      ])
    });

    expect(window.peopleAPI.detectDuplicateRelations()).toContain('wu-zetian__di-renjie__career');
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
});
