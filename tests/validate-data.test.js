import { describe, expect, test } from 'vitest';

function makePeople(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: 'p' + (index + 1),
    name: '人物' + (index + 1),
    dynasty: '测试',
    summary: '测试人物'
  }));
}

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
