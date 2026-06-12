import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var projectRoot = path.resolve(__dirname, '..');
var dataDir = path.join(projectRoot, 'src', 'data');
var results = [];

var PHASE5_TARGETS = {
  nouns: 50,
  timeline: 40,
  people: 30,
  mediaPerType: 15,
  questions: 30,
  hotArticles: 10,
  podcasts: 5
};

var PEOPLE_RELATION_TYPES = {
  career: true,
  family: true,
  teacher: true,
  friend: true,
  political: true
};

var TIMELINE_DYNASTIES = {
  qin: true,
  han: true,
  suitang: true,
  song: true,
  ming: true,
  qing: true
};

var NOUN_CATEGORIES = {
  制度: true,
  经济: true,
  改革: true,
  交流: true,
  思想: true,
  文化: true,
  事件: true,
  军事: true
};

var DISCUSSION_CATEGORIES = {
  view: true,
  cold: true,
  help: true,
  resource: true
};

function addResult(level, file, message) {
  results.push({
    level: level,
    file: file,
    message: message
  });
}

function printResults() {
  results.forEach(function (item) {
    console.log('[' + item.level + '] ' + item.file + ': ' + item.message);
  });
}

function printSummary() {
  var counts = { OK: 0, WARN: 0, ERROR: 0 };

  results.forEach(function (item) {
    counts[item.level] = (counts[item.level] || 0) + 1;
  });

  console.log('');
  console.log('Summary: ' + counts.OK + ' OK, ' + counts.WARN + ' WARN, ' + counts.ERROR + ' ERROR');
  process.exitCode = counts.ERROR > 0 ? 1 : 0;
}

function getJsonFiles() {
  if (!fs.existsSync(dataDir)) {
    addResult('ERROR', 'src/data', 'directory not found');
    return [];
  }

  return fs.readdirSync(dataDir).filter(function (name) {
    return /\.json$/i.test(name);
  }).sort();
}

function readJsonFile(fileName) {
  var filePath = path.join(dataDir, fileName);
  var raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isBlank(value) {
  return value === null || typeof value === 'undefined' || String(value).trim() === '';
}

function hasUnsafeHtml(value) {
  return typeof value === 'string' && /<\s*\/?\s*(script|img|iframe|object|embed|svg|math)\b|on\w+\s*=|javascript:/i.test(value);
}

function validateTextSafety(fileName, label, value) {
  if (hasUnsafeHtml(value)) {
    addResult('ERROR', fileName, label + ' contains unsafe HTML-like content');
  }
}

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function inRange(value, min, max) {
  return value >= min && value <= max;
}

function addDuplicateError(fileName, kind, value) {
  addResult('ERROR', fileName, 'duplicate ' + kind + ': ' + value);
}

function validateUniqueValue(fileName, seen, kind, value) {
  if (isBlank(value)) {
    return;
  }

  if (seen[value]) {
    addDuplicateError(fileName, kind, value);
  } else {
    seen[value] = true;
  }
}

function isValidUrl(value) {
  try {
    var parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function localAudioPathExists(audioUrl) {
  var localPath;

  if (isBlank(audioUrl)) {
    return false;
  }

  if (/^https?:\/\//i.test(audioUrl)) {
    return true;
  }

  localPath = String(audioUrl).replace(/^\.\//, '');
  return fs.existsSync(path.join(projectRoot, localPath));
}

function validateNouns(data, fileName) {
  var nounNames;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected object map of noun entries');
    return;
  }

  nounNames = Object.keys(data);
  if (fileName === 'nouns.json' && nounNames.length < PHASE5_TARGETS.nouns) {
    addResult('ERROR', fileName, 'noun count must be at least ' + PHASE5_TARGETS.nouns + ' for Phase 5');
  }

  nounNames.forEach(function (nounName) {
    var entry = data[nounName];

    validateTextSafety(fileName, 'entry "' + nounName + '" name', nounName);

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      addResult('ERROR', fileName, 'entry "' + nounName + '" must be an object');
      return;
    }

    ['text', 'dynasty', 'category', 'map', 'year'].forEach(function (fieldName) {
      if (isBlank(entry[fieldName])) {
        addResult('ERROR', fileName, 'entry "' + nounName + '" missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'entry "' + nounName + '" field "' + fieldName + '"', entry[fieldName]);
    });

    if (!isBlank(entry.category) && !NOUN_CATEGORIES[entry.category]) {
      addResult('ERROR', fileName, 'entry "' + nounName + '" unsupported category: ' + entry.category);
    }

    if (!Array.isArray(entry.related)) {
      addResult('ERROR', fileName, 'entry "' + nounName + '" field "related" must be an array');
      return;
    }

    entry.related.forEach(function (relatedName) {
      validateTextSafety(fileName, 'entry "' + nounName + '" related target', relatedName);

      if (!Object.prototype.hasOwnProperty.call(data, relatedName)) {
        addResult('ERROR', fileName, 'entry "' + nounName + '" related target not found: ' + relatedName);
        return;
      }

      if (!data[relatedName] || !Array.isArray(data[relatedName].related) || data[relatedName].related.indexOf(nounName) === -1) {
        addResult('ERROR', fileName, 'entry "' + nounName + '" related target not reciprocal: ' + relatedName);
      }
    });
  });
}

function validateTimeline(data, fileName) {
  var ids = {};
  var names = {};

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected object with dynasties and events');
    return;
  }

  if (!Array.isArray(data.dynasties)) {
    addResult('ERROR', fileName, 'missing dynasties array');
  } else {
    data.dynasties.forEach(function (dynasty) {
      if (!TIMELINE_DYNASTIES[dynasty]) {
        addResult('ERROR', fileName, 'unsupported timeline dynasty: ' + dynasty);
      }
    });
  }

  if (!Array.isArray(data.events)) {
    addResult('ERROR', fileName, 'missing events array');
    return;
  }

  if (fileName === 'timeline.json' && data.events.length < PHASE5_TARGETS.timeline) {
    addResult('ERROR', fileName, 'timeline event count must be at least ' + PHASE5_TARGETS.timeline + ' for Phase 5');
  }

  data.events.forEach(function (eventItem, index) {
    ['id', 'dynasty', 'name', 'year', 'description'].forEach(function (fieldName) {
      if (isBlank(eventItem[fieldName])) {
        addResult('ERROR', fileName, 'events[' + index + '] missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'events[' + index + '] field "' + fieldName + '"', eventItem[fieldName]);
    });

    validateUniqueValue(fileName, ids, 'timeline event id', eventItem.id);
    validateUniqueValue(fileName, names, 'timeline event name', eventItem.name);

    if (!isBlank(eventItem.dynasty) && !TIMELINE_DYNASTIES[eventItem.dynasty]) {
      addResult('ERROR', fileName, 'events[' + index + '] unsupported dynasty: ' + eventItem.dynasty);
    }

    [
      { key: 'x', min: 0, max: 1000 },
      { key: 'pol', min: 0, max: 500 },
      { key: 'eco', min: 0, max: 500 },
      { key: 'cul', min: 0, max: 500 }
    ].forEach(function (field) {
      if (!isValidNumber(eventItem[field.key])) {
        addResult('ERROR', fileName, 'events[' + index + '] invalid number field: ' + field.key);
        return;
      }

      if (!inRange(eventItem[field.key], field.min, field.max)) {
        addResult('ERROR', fileName, 'events[' + index + '] out of range field: ' + field.key);
      }
    });

    if (eventItem.conn && typeof eventItem.conn === 'object') {
      ['next', 'pol', 'eco', 'cul'].forEach(function (fieldName) {
        validateTextSafety(fileName, 'events[' + index + '] conn "' + fieldName + '"', eventItem.conn[fieldName]);
      });
    }
  });
}

function getUndirectedRelationKey(relation) {
  var source = relation && relation.source ? String(relation.source) : '';
  var target = relation && relation.target ? String(relation.target) : '';
  var first = source < target ? source : target;
  var second = source < target ? target : source;
  return first + '__' + second + '__' + (relation && relation.type ? relation.type : '');
}

function validatePeople(data, fileName) {
  var ids = {};
  var relationKeys = {};

  function validatePerson(person, index) {
    if (!person || typeof person !== 'object') {
      addResult('ERROR', fileName, 'people[' + index + '] must be an object');
      return;
    }

    ['id', 'name', 'dynasty', 'summary', 'evaluation'].forEach(function (fieldName) {
      if (isBlank(person[fieldName])) {
        addResult('ERROR', fileName, 'people[' + index + '] missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'people[' + index + '] field "' + fieldName + '"', person[fieldName]);
    });

    if (isBlank(person.id)) {
      return;
    }

    if (ids[person.id]) {
      addResult('ERROR', fileName, 'duplicate person id: ' + person.id);
    } else {
      ids[person.id] = true;
    }

    if (!Array.isArray(person.yearTable) || !person.yearTable.length) {
      addResult('ERROR', fileName, 'people[' + index + '] missing yearTable array');
    } else {
      person.yearTable.forEach(function (item) {
        validateTextSafety(fileName, 'people[' + index + '] yearTable item', item);
      });
    }
  }

  if (Array.isArray(data)) {
    data.forEach(validatePerson);
    return;
  }

  if (data && typeof data === 'object' && Array.isArray(data.people)) {
    data.people.forEach(validatePerson);

    if (fileName === 'people.json' && data.people.length < PHASE5_TARGETS.people) {
      addResult('ERROR', fileName, 'people count must be at least ' + PHASE5_TARGETS.people + ' for Phase 5');
    }

    if (data.defaultCenter && !ids[data.defaultCenter]) {
      addResult('ERROR', fileName, 'defaultCenter not found: ' + data.defaultCenter);
    }

    if (!Array.isArray(data.relations)) {
      addResult('ERROR', fileName, 'missing relations array');
      return;
    }

    data.relations.forEach(function (relation, index) {
      var key;
      if (!relation || typeof relation !== 'object') {
        addResult('ERROR', fileName, 'relations[' + index + '] must be an object');
        return;
      }

      ['source', 'target', 'type', 'label', 'description'].forEach(function (fieldName) {
        if (isBlank(relation[fieldName])) {
          addResult('ERROR', fileName, 'relations[' + index + '] missing field: ' + fieldName);
        }
        validateTextSafety(fileName, 'relations[' + index + '] field "' + fieldName + '"', relation[fieldName]);
      });

      if (!isBlank(relation.type) && !PEOPLE_RELATION_TYPES[relation.type]) {
        addResult('ERROR', fileName, 'relations[' + index + '] unsupported type: ' + relation.type);
      }

      if (!isBlank(relation.source) && relation.source === relation.target) {
        addResult('ERROR', fileName, 'relations[' + index + '] source and target must differ: ' + relation.source);
      }

      if (!isBlank(relation.source) && !ids[relation.source]) {
        addResult('ERROR', fileName, 'relations[' + index + '] source not found: ' + relation.source);
      }

      if (!isBlank(relation.target) && !ids[relation.target]) {
        addResult('ERROR', fileName, 'relations[' + index + '] target not found: ' + relation.target);
      }

      key = getUndirectedRelationKey(relation);
      if (relationKeys[key]) {
        addResult('ERROR', fileName, 'duplicate relation: ' + key);
      } else {
        relationKeys[key] = true;
      }
    });
    return;
  }

  if (data && typeof data === 'object' && data.centers && typeof data.centers === 'object') {
    addResult('WARN', fileName, 'uses centers-based structure, id and relations checks skipped');
    return;
  }

  addResult('WARN', fileName, 'structure does not match expected people validators, specialized checks skipped');
}

function validateQuestions(data, fileName) {
  var ids = {};
  var questions = {};

  if (!Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected array of questions');
    return;
  }

  if (fileName === 'questions.json' && data.length < PHASE5_TARGETS.questions) {
    addResult('ERROR', fileName, 'question count must be at least ' + PHASE5_TARGETS.questions + ' for Phase 5');
  }

  data.forEach(function (item, index) {
    var answerCount;

    ['id', 'question', 'answer', 'explanation', 'topic', 'dynasty'].forEach(function (fieldName) {
      if (isBlank(item[fieldName])) {
        addResult('ERROR', fileName, 'questions[' + index + '] missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'questions[' + index + '] field "' + fieldName + '"', item[fieldName]);
    });

    validateUniqueValue(fileName, ids, 'question id', item.id);
    validateUniqueValue(fileName, questions, 'question text', item.question);

    if (!Array.isArray(item.options) || !item.options.length) {
      addResult('ERROR', fileName, 'questions[' + index + '] missing options array');
      return;
    }

    if (item.options.length !== 4) {
      addResult('ERROR', fileName, 'questions[' + index + '] options must contain exactly 4 items');
    }

    item.options.forEach(function (option) {
      validateTextSafety(fileName, 'questions[' + index + '] option', option);
    });

    answerCount = item.options.filter(function (option) {
      return option === item.answer;
    }).length;

    if (answerCount !== 1) {
      addResult('ERROR', fileName, 'questions[' + index + '] answer must appear exactly once in options');
    }
  });
}

function validateNonNegativeCount(fileName, label, value) {
  var text;

  if (isBlank(value)) {
    addResult('ERROR', fileName, label + ' missing count');
    return null;
  }

  text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    addResult('ERROR', fileName, label + ' invalid count: ' + value);
    return null;
  }

  return parseInt(text, 10);
}

function validateDiscussions(data, fileName) {
  var ids = {};
  var titles = {};

  if (!Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected array of discussion posts');
    return;
  }

  if (fileName === 'discussions.json' && (data.length < 2 || data.length > 3)) {
    addResult('ERROR', fileName, 'discussion seed count must be between 2 and 3 for Task 3.4');
  }

  data.forEach(function (post, index) {
    var commentCount;

    if (!post || typeof post !== 'object' || Array.isArray(post)) {
      addResult('ERROR', fileName, 'posts[' + index + '] must be an object');
      return;
    }

    ['id', 'category', 'author', 'avatar', 'time', 'title', 'body', 'likes', 'comments', 'favorite'].forEach(function (fieldName) {
      if (isBlank(post[fieldName])) {
        addResult('ERROR', fileName, 'posts[' + index + '] missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'posts[' + index + '] field "' + fieldName + '"', post[fieldName]);
    });

    validateUniqueValue(fileName, ids, 'discussion post id', post.id);
    validateUniqueValue(fileName, titles, 'discussion post title', post.title);

    if (!isBlank(post.category) && !DISCUSSION_CATEGORIES[post.category]) {
      addResult('ERROR', fileName, 'posts[' + index + '] unsupported category: ' + post.category);
    }

    validateNonNegativeCount(fileName, 'posts[' + index + '] likes', post.likes);
    commentCount = validateNonNegativeCount(fileName, 'posts[' + index + '] comments', post.comments);

    if (!Array.isArray(post.commentsList)) {
      addResult('ERROR', fileName, 'posts[' + index + '] missing commentsList array');
      return;
    }

    if (commentCount !== null && commentCount < post.commentsList.length) {
      addResult('ERROR', fileName, 'posts[' + index + '] comments count is less than commentsList length');
    }

    post.commentsList.forEach(function (comment, commentIndex) {
      if (!comment || typeof comment !== 'object' || Array.isArray(comment)) {
        addResult('ERROR', fileName, 'posts[' + index + '].commentsList[' + commentIndex + '] must be an object');
        return;
      }

      ['author', 'avatar', 'body'].forEach(function (fieldName) {
        if (isBlank(comment[fieldName])) {
          addResult('ERROR', fileName, 'posts[' + index + '].commentsList[' + commentIndex + '] missing field: ' + fieldName);
        }
        validateTextSafety(fileName, 'posts[' + index + '].commentsList[' + commentIndex + '] field "' + fieldName + '"', comment[fieldName]);
      });
    });

    if (!isBlank(post.moreCommentsLabel)) {
      validateTextSafety(fileName, 'posts[' + index + '] field "moreCommentsLabel"', post.moreCommentsLabel);
    }

    if (Array.isArray(post.tags)) {
      post.tags.forEach(function (tag) {
        validateTextSafety(fileName, 'posts[' + index + '] tag', tag);
      });
    }
  });
}

function validateMediaList(fileName, data, requiredFields) {
  var ids = {};
  var titles = {};
  var byType = {};

  if (!Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected array');
    return;
  }

  data.forEach(function (item, index) {
    requiredFields.forEach(function (fieldName) {
      if (isBlank(item[fieldName])) {
        addResult('ERROR', fileName, 'entries[' + index + '] missing field: ' + fieldName);
      }
      validateTextSafety(fileName, 'entries[' + index + '] field "' + fieldName + '"', item[fieldName]);
    });

    validateUniqueValue(fileName, ids, 'entry id', item.id);
    validateUniqueValue(fileName, titles, 'entry title', item.title);

    if (item.type) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    if (Array.isArray(item.tags)) {
      item.tags.forEach(function (tag) {
        validateTextSafety(fileName, 'entries[' + index + '] tag', tag);
      });
    }
  });

  if (fileName === 'films.json') {
    ['book', 'film', 'doc'].forEach(function (type) {
      if ((byType[type] || 0) < PHASE5_TARGETS.mediaPerType) {
        addResult('ERROR', fileName, 'type ' + type + ' count must be at least ' + PHASE5_TARGETS.mediaPerType + ' for Phase 5');
      }
    });
  }

  if (fileName === 'podcasts.json') {
    if (data.length < PHASE5_TARGETS.podcasts) {
      addResult('ERROR', fileName, 'podcast count must be at least ' + PHASE5_TARGETS.podcasts + ' for Phase 5');
    }

    data.forEach(function (item, index) {
      if (isBlank(item.audioUrl)) {
        addResult('ERROR', fileName, 'entries[' + index + '] missing field: audioUrl');
      } else if (!localAudioPathExists(item.audioUrl)) {
        addResult('ERROR', fileName, 'entries[' + index + '] audioUrl not reachable: ' + item.audioUrl);
      }
    });
  }

  if (fileName === 'hot-articles.json') {
    if (data.length < PHASE5_TARGETS.hotArticles) {
      addResult('ERROR', fileName, 'hot article count must be at least ' + PHASE5_TARGETS.hotArticles + ' for Phase 5');
    }

    data.forEach(function (item, index) {
      if (isBlank(item.url) || !isValidUrl(item.url)) {
        addResult('ERROR', fileName, 'entries[' + index + '] invalid url: ' + item.url);
      }
    });
  }
}

function validateBooksData(data, fileName) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected object with books films docs arrays');
    return;
  }

  ['books', 'films', 'docs'].forEach(function (groupName) {
    var list = data[groupName];
    var ids = {};
    var titles = {};

    if (!Array.isArray(list)) {
      addResult('ERROR', fileName, 'missing array: ' + groupName);
      return;
    }

    if (list.length < PHASE5_TARGETS.mediaPerType) {
      addResult('ERROR', fileName, 'group ' + groupName + ' count must be at least ' + PHASE5_TARGETS.mediaPerType + ' for Phase 5');
    }

    list.forEach(function (item, index) {
      ['id', 'title', 'author', 'rating', 'summary'].forEach(function (fieldName) {
        if (isBlank(item[fieldName])) {
          addResult('ERROR', fileName, groupName + '[' + index + '] missing field: ' + fieldName);
        }
        validateTextSafety(fileName, groupName + '[' + index + '] field "' + fieldName + '"', item[fieldName]);
      });

      validateUniqueValue(fileName, ids, groupName + ' id', item.id);
      validateUniqueValue(fileName, titles, groupName + ' title', item.title);
    });
  });
}

function validateFileData(fileName, data) {
  if (fileName === 'nouns.json') {
    validateNouns(data, fileName);
    return;
  }

  if (fileName === 'timeline.json') {
    validateTimeline(data, fileName);
    return;
  }

  if (fileName === 'people.json') {
    validatePeople(data, fileName);
    return;
  }

  if (fileName === 'films.json') {
    validateMediaList(fileName, data, ['id', 'title', 'type', 'creator', 'year', 'description']);
    return;
  }

  if (fileName === 'books.json') {
    validateBooksData(data, fileName);
    return;
  }

  if (fileName === 'podcasts.json') {
    validateMediaList(fileName, data, ['id', 'title', 'category', 'dur', 'author', 'audioUrl']);
    return;
  }

  if (fileName === 'hot-articles.json') {
    validateMediaList(fileName, data, ['id', 'title', 'url']);
    return;
  }

  if (fileName === 'discussions.json') {
    validateDiscussions(data, fileName);
    return;
  }

  if (fileName === 'questions.json') {
    validateQuestions(data, fileName);
  }
}

function validateAllJsonFiles() {
  var files = getJsonFiles();

  files.forEach(function (fileName) {
    var data;

    try {
      data = readJsonFile(fileName);
      addResult('OK', fileName, 'parsed');
      validateFileData(fileName, data);
    } catch (error) {
      addResult('ERROR', fileName, 'parse failed: ' + error.message);
    }
  });

  if (files.indexOf('questions.json') === -1) {
    addResult('ERROR', 'questions.json', 'file not found for Phase 5');
  }
}

function withIsolatedResults(callback) {
  var previousResults = results;
  var snapshot;
  results = [];
  callback();
  snapshot = results.slice();
  results = previousResults;
  return snapshot;
}

function validateFileDataForTest(fileName, data) {
  return withIsolatedResults(function () {
    validateFileData(fileName, data);
  });
}

function validateTimelineDataForTest(data) {
  return validateFileDataForTest('timeline.json', data);
}

function validatePeopleDataForTest(data) {
  return validateFileDataForTest('people.json', data);
}

function main() {
  console.log('History Learning data validation');
  console.log('');
  validateAllJsonFiles();
  printResults();
  printSummary();
}

if (!process.env.VITEST) {
  main();
}

export { validateFileDataForTest, validatePeopleDataForTest, validateTimelineDataForTest };
