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
    console.log('[' + item.level + '] ' + item.file + ' ' + item.message);
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

function validateFileData(fileName, data) {
  if (fileName === 'nouns.json') {
    validateNouns(data, fileName);
    return;
  }

  if (fileName === 'timeline.json') {
    validateTimeline(data, fileName);
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
}

function main() {
  validateAllJsonFiles();
  printResults();
  printSummary();
}

main();
