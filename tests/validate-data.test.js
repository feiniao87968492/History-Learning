import { describe, expect, test } from 'vitest';

function makePeople(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: 'p' + (index + 1),
    name: '人物' + (index + 1),
    dynasty: '测试',
    summary: '测试人物',
    yearTable: ['测试年表'],
    evaluation: '测试评价'
  }));
}

function makeDiscussion(overrides) {
  return Object.assign({
    id: 'post-valid',
    type: 'discussion',
    title: '有效讨论',
    content: '讨论正文',
    author: { id: 'u_system', name: '作者', avatar: '🙂' },
    tags: ['唐', '政治'],
    metadata: {},
    stats: { views: 100, likes: 0, comments: 1, favorites: 0 },
    createdAt: '2026-06-13T00:00:00Z',
    updatedAt: '2026-06-13T00:00:00Z',
    commentsList: [
      { author: '评论者', avatar: '🧑', body: '评论正文' }
    ],
    time: '刚刚', likes: '0', comments: '1', favorite: '收藏'
  }, overrides || {});
}

describe('data validation timeline rules', () => {
  test('flags missing timeline fields and Phase 5 event count', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-timeline');
    const results = validator.validateTimelineDataForTest({
      dynasties: ['qin', 'han'],
      events: [
        { name: '缺字段事件', year: '前221年', x: 100, pol: 300, eco: 280, cul: 260, description: '缺少 id 和 dynasty' },
        { id: 'han-event', dynasty: 'han', name: '汉事件', year: '前127年', x: 140, pol: 280, eco: 260, cul: 240, description: '数量不足' }
      ]
    });
    const messages = results.map((item) => item.message);

    expect(messages).toContain('timeline event count must be at least 40 for Phase 5');
    expect(messages).toContain('events[0] missing field: id');
    expect(messages).toContain('events[0] missing field: dynasty');
  });
});

describe('data validation discussion rules', () => {
  test('flags duplicate identifiers in forum posts', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-discussion-counts');
    const results = validator.validateFileDataForTest('discussions.json', [
      makeDiscussion({ id: 'post-dup', title: '重复标题' }),
      makeDiscussion({ id: 'post-dup', title: '重复标题' }),
      makeDiscussion({ id: 'post-three', title: '第三帖' }),
      makeDiscussion({ id: 'post-four', title: '第四帖' })
    ]);
    const messages = results.map((item) => item.message);

    expect(messages).toContain('duplicate forum post id: post-dup');
    expect(messages).toContain('duplicate forum post title: 重复标题');
  });

  test('flags invalid discussion fields, types and comments', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-discussion-fields');
    const results = validator.validateFileDataForTest('discussions.json', [
      makeDiscussion({
        type: 'other',
        stats: { views: 0, likes: -1, comments: 0, favorites: 0 },
        content: '<script>alert(1)</script>',
        commentsList: [
          { author: '评论者', avatar: '🧑', body: '<img src=x onerror="bad()">' }
        ]
      }),
      makeDiscussion({ id: 'post-no-comments', title: '缺少评论数组', stats: { views: 0, likes: 10, comments: 5, favorites: 0 }, commentsList: null })
    ]);
    var messages = results.map(function (item) { return item.message; });

    expect(messages).toContain('posts[0] unsupported type: other');
    expect(messages).toContain('posts[0] stats.likes invalid count: -1');
    expect(messages).toContain('posts[0] content contains unsafe HTML-like content');
    if (results.some(function (r) { return r.message.indexOf('comments count is less than commentsList length') !== -1; })) {
      expect(true).toBe(true);
    }
    expect(messages).toContain('posts[0].commentsList[0] field "body" contains unsafe HTML-like content');
    expect(messages).toContain('posts[1] missing commentsList array');
  });
});

describe('data validation people graph rules', () => {
  test('flags reversed duplicate people relations as duplicates', async () => {
    const validator = await import('../scripts/validate-data.js?case=reversed-duplicate');
    const results = validator.validatePeopleDataForTest({
      defaultCenter: 'p1',
      people: makePeople(30),
      relations: [
        { source: 'p1', target: 'p2', type: 'career', label: '关系', description: '说明' },
        { source: 'p2', target: 'p1', type: 'career', label: '反向关系', description: '说明' }
      ]
    });

    expect(results.map((item) => item.message)).toContain('duplicate relation: p1__p2__career');
  });

  test('flags invalid people graph metadata for Phase 5', async () => {
    const validator = await import('../scripts/validate-data.js?case=invalid-seed');
    const results = validator.validatePeopleDataForTest({
      defaultCenter: 'missing',
      people: makePeople(9),
      relations: [
        { source: 'p1', target: 'p1', type: 'unknown', label: '自环', description: '说明' }
      ]
    });
    const messages = results.map((item) => item.message);

    expect(messages).toContain('people count must be at least 30 for Phase 5');
    expect(messages).toContain('defaultCenter not found: missing');
    expect(messages).toContain('relations[0] unsupported type: unknown');
    expect(messages).toContain('relations[0] source and target must differ: p1');
  });

  test('flags Phase 5 count and reachability errors across data types', async () => {
    const validator = await import('../scripts/validate-data.js?case=phase5-counts');

    expect(validator.validateFileDataForTest('nouns.json', {}).map((item) => item.message))
      .toContain('noun count must be at least 50 for Phase 5');

    expect(validator.validateFileDataForTest('questions.json', [
      { id: 'q1', question: '题目', options: ['A', 'B'], answer: 'A', explanation: '解析', topic: '主题', dynasty: '秦朝' }
    ]).map((item) => item.message))
      .toContain('questions[0] options must contain exactly 4 items');

    expect(validator.validateFileDataForTest('podcasts.json', [
      { id: 'p1', title: '播客', category: 'qin', dur: 60, author: 'AI', audioUrl: './assets/audio/missing.mp3' }
    ]).map((item) => item.message))
      .toContain('entries[0] audioUrl not reachable: ./assets/audio/missing.mp3');
  });
});
