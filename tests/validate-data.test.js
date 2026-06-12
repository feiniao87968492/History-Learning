import { describe, expect, test } from 'vitest';

function makePeople(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: 'p' + (index + 1),
    name: '人物' + (index + 1),
    dynasty: '测试',
    summary: '测试人物'
  }));
}

describe('data validation timeline rules', () => {
  test('flags missing timeline id dynasty and sparse dynasty seeds', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-timeline');
    const results = validator.validateTimelineDataForTest({
      dynasties: ['qin', 'han'],
      events: [
        { name: '缺字段事件', year: '前221年', x: 100, pol: 300, eco: 280, cul: 260, description: '缺少 id 和 dynasty' },
        { id: 'han-event', dynasty: 'han', name: '汉事件', year: '前127年', x: 140, pol: 280, eco: 260, cul: 240, description: '数量不足' }
      ]
    });
    const messages = results.map((item) => item.message);

    expect(messages).toContain('events[0] missing field: id');
    expect(messages).toContain('events[0] missing field: dynasty');
    expect(messages).toContain('dynasty qin must have 3-5 timeline events for Phase 4');
    expect(messages).toContain('dynasty han must have 3-5 timeline events for Phase 4');
  });
});

describe('data validation people graph rules', () => {
  test('flags reversed duplicate people relations as duplicates', async () => {
    const validator = await import('../scripts/validate-data.js?case=reversed-duplicate');
    const results = validator.validatePeopleDataForTest({
      defaultCenter: 'p1',
      people: makePeople(10),
      relations: [
        { source: 'p1', target: 'p2', type: 'career', label: '关系', description: '说明' },
        { source: 'p2', target: 'p1', type: 'career', label: '反向关系', description: '说明' }
      ]
    });

    expect(results.map((item) => item.message)).toContain('duplicate relation: p1__p2__career');
  });

  test('flags invalid people graph seed metadata', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-seed');
    const results = validator.validatePeopleDataForTest({
      defaultCenter: 'missing',
      people: makePeople(9),
      relations: [
        { source: 'p1', target: 'p1', type: 'unknown', label: '自环', description: '说明' }
      ]
    });
    const messages = results.map((item) => item.message);

    expect(messages).toContain('people seed count must be between 10 and 15 for Phase 4');
    expect(messages).toContain('defaultCenter not found: missing');
    expect(messages).toContain('relations[0] unsupported type: unknown');
    expect(messages).toContain('relations[0] source and target must differ: p1');
  });
});
