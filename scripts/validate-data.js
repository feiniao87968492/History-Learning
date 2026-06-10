import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var projectRoot = path.resolve(__dirname, '..');
var dataDir = path.join(projectRoot, 'src', 'data');
var results = [];

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

function validateNouns(data, fileName) {
  var nounNames;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected object map of noun entries');
    return;
  }

  nounNames = Object.keys(data);

  nounNames.forEach(function (nounName) {
    var entry = data[nounName];

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      addResult('ERROR', fileName, 'entry "' + nounName + '" must be an object');
      return;
    }

    ['text', 'dynasty', 'category'].forEach(function (fieldName) {
      if (isBlank(entry[fieldName])) {
        addResult('ERROR', fileName, 'entry "' + nounName + '" missing field: ' + fieldName);
      }
    });

    if (typeof entry.related !== 'undefined') {
      if (!Array.isArray(entry.related)) {
        addResult('ERROR', fileName, 'entry "' + nounName + '" field "related" must be an array');
      } else {
        entry.related.forEach(function (relatedName) {
          if (!Object.prototype.hasOwnProperty.call(data, relatedName)) {
            addResult('ERROR', fileName, 'entry "' + nounName + '" related target not found: ' + relatedName);
          }
        });
      }
    }
  });
}

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function inRange(value, min, max) {
  return value >= min && value <= max;
}

function validateTimeline(data, fileName) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected object with dynasties and events');
    return;
  }

  if (!Array.isArray(data.events)) {
    addResult('ERROR', fileName, 'missing events array');
    return;
  }

  data.events.forEach(function (eventItem, index) {
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
  });
}

function validatePeople(data, fileName) {
  var ids = {};

  if (Array.isArray(data)) {
    data.forEach(function (person, index) {
      if (!person || typeof person !== 'object') {
        addResult('ERROR', fileName, 'entries[' + index + '] must be an object');
        return;
      }

      if (isBlank(person.id)) {
        addResult('ERROR', fileName, 'entries[' + index + '] missing field: id');
        return;
      }

      if (ids[person.id]) {
        addResult('ERROR', fileName, 'duplicate person id: ' + person.id);
      } else {
        ids[person.id] = true;
      }
    });

    if (Array.isArray(data.relations)) {
      addResult('WARN', fileName, 'array data with relations property is unexpected, relation checks skipped');
    }
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

  if (!Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected array of questions');
    return;
  }

  data.forEach(function (item, index) {
    if (isBlank(item.id)) {
      addResult('ERROR', fileName, 'questions[' + index + '] missing field: id');
    } else if (ids[item.id]) {
      addResult('ERROR', fileName, 'duplicate question id: ' + item.id);
    } else {
      ids[item.id] = true;
    }

    if (!Array.isArray(item.options) || !item.options.length) {
      addResult('ERROR', fileName, 'questions[' + index + '] missing options array');
      return;
    }

    if (item.options.indexOf(item.answer) === -1) {
      addResult('ERROR', fileName, 'questions[' + index + '] answer not found in options');
    }
  });
}

function validateMediaList(fileName, data, requiredFields) {
  if (!Array.isArray(data)) {
    addResult('ERROR', fileName, 'expected array');
    return;
  }

  data.forEach(function (item, index) {
    requiredFields.forEach(function (fieldName) {
      if (isBlank(item[fieldName])) {
        addResult('ERROR', fileName, 'entries[' + index + '] missing field: ' + fieldName);
      }
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
    validateMediaList(fileName, data, ['id', 'title', 'type']);
    return;
  }

  if (fileName === 'podcasts.json') {
    validateMediaList(fileName, data, ['id', 'title']);
    return;
  }

  if (fileName === 'hot-articles.json') {
    validateMediaList(fileName, data, ['title']);
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
    addResult('WARN', 'questions.json', 'file not found, specialized checks skipped');
  }
}

function main() {
  console.log('History Learning data validation');
  console.log('');
  validateAllJsonFiles();
  printResults();
  printSummary();
}

main();
