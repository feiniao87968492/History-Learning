# Task 0.4 Data Validation Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-file CLI validator that scans `src/data/*.json`, reports parse and schema issues, and exits non-zero when deterministic data errors are found.

**Architecture:** Keep everything inside `scripts/validate-data.js` using Node built-ins only. Build the script in layers: first directory scanning and result reporting, then generic JSON parsing, then file-specific validators for the plan-required data files, and finally CLI summary and exit behavior. Match the current repository reality, especially `people.json` using a `centers` object rather than the plan's earlier graph-array assumption.

**Tech Stack:** Node.js, JavaScript, fs, path, Markdown, Git

---

## File Map

- Create: `scripts/validate-data.js`
- Read: `src/data/nouns.json`
- Read: `src/data/timeline.json`
- Read: `src/data/people.json`
- Read: `src/data/films.json`
- Read: `src/data/podcasts.json`
- Read: `src/data/hot-articles.json`

---

### Task 1: Build The CLI Skeleton And Generic JSON Parse Checks

**Files:**
- Create: `scripts/validate-data.js`

- [ ] **Step 1: Write the initial script skeleton**

Create `scripts/validate-data.js` with:

```js
var fs = require('fs');
var path = require('path');

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

function validateAllJsonFiles() {
  var files = getJsonFiles();

  files.forEach(function (fileName) {
    try {
      readJsonFile(fileName);
      addResult('OK', fileName, 'parsed');
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
```

- [ ] **Step 2: Run the script and verify the generic parse report works**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
One [OK] line per parseable JSON file and a Summary line at the end.
```

- [ ] **Step 3: Improve file-path wording so missing directory errors stay consistent with the repo layout**

Update the missing directory branch to:

```js
if (!fs.existsSync(dataDir)) {
  addResult('ERROR', 'src/data', 'directory not found');
  return [];
}
```

Keep the file field for normal items as the basename such as `nouns.json`.

- [ ] **Step 4: Re-run the script and verify the output is stable**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
Stable parse output, no crashes, and exit code 0 unless a real parse error exists.
```

- [ ] **Step 5: Commit the generic validator skeleton**

Run:

```bash
git add scripts/validate-data.js
git commit -m "feat: add data validator skeleton"
```

Expected:

```text
[main ...] feat: add data validator skeleton
```

---

### Task 2: Add `nouns.json` And `timeline.json` Specialized Validation

**Files:**
- Modify: `scripts/validate-data.js`
- Read: `src/data/nouns.json`
- Read: `src/data/timeline.json`

- [ ] **Step 1: Add `nouns.json` validation helpers**

Insert these helpers above `validateAllJsonFiles()`:

```js
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
          if (!data.hasOwnProperty(relatedName)) {
            addResult('ERROR', fileName, 'entry "' + nounName + '" related target not found: ' + relatedName);
          }
        });
      }
    }
  });
}
```

- [ ] **Step 2: Add `timeline.json` validation helpers**

Insert these helpers below `validateNouns()`:

```js
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
```

- [ ] **Step 3: Dispatch specialized validators during the main pass**

Replace `validateAllJsonFiles()` with:

```js
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
```

- [ ] **Step 4: Run the script and verify noun/timeline errors appear clearly if current data violates the plan**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
The report still shows all parsed files, and may now include deterministic ERROR lines for missing noun fields or invalid timeline coordinates in current data.
```

- [ ] **Step 5: Commit the noun and timeline validators**

Run:

```bash
git add scripts/validate-data.js
git commit -m "feat: validate nouns and timeline data"
```

Expected:

```text
[main ...] feat: validate nouns and timeline data
```

---

### Task 3: Add `people.json`, `questions.json`, And Media List Validation

**Files:**
- Modify: `scripts/validate-data.js`
- Read: `src/data/people.json`
- Read: `src/data/films.json`
- Read: `src/data/podcasts.json`
- Read: `src/data/hot-articles.json`

- [ ] **Step 1: Add `people.json` compatibility-aware validation**

Insert these helpers below `validateTimeline()`:

```js
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
```

- [ ] **Step 2: Add `questions.json` validation and media list validation helpers**

Insert these helpers below `validatePeople()`:

```js
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
```

- [ ] **Step 3: Extend dispatch for people, missing `questions.json`, and media files**

Replace `validateFileData()` with:

```js
function validateFileData(fileName, data, availableFiles) {
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
    return;
  }
}
```

Then replace the loop setup in `validateAllJsonFiles()` with:

```js
function validateAllJsonFiles() {
  var files = getJsonFiles();

  files.forEach(function (fileName) {
    var data;

    try {
      data = readJsonFile(fileName);
      addResult('OK', fileName, 'parsed');
      validateFileData(fileName, data, files);
    } catch (error) {
      addResult('ERROR', fileName, 'parse failed: ' + error.message);
    }
  });

  if (files.indexOf('questions.json') === -1) {
    addResult('WARN', 'questions.json', 'file not found, specialized checks skipped');
  }
}
```

- [ ] **Step 4: Run the script and inspect the report**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
The report includes parse results, people.json compatibility WARN output for the current centers-based structure, a questions.json skipped WARN, and media-field errors only when required fields are truly blank.
```

- [ ] **Step 5: Commit the people and media validators**

Run:

```bash
git add scripts/validate-data.js
git commit -m "feat: add specialized data validation rules"
```

Expected:

```text
[main ...] feat: add specialized data validation rules
```

---

### Task 4: Polish Report Output And Final Validation

**Files:**
- Modify: `scripts/validate-data.js`

- [ ] **Step 1: Improve result formatting for more actionable output**

Update `printResults()` to:

```js
function printResults() {
  results.forEach(function (item) {
    console.log('[' + item.level + '] ' + item.file + ': ' + item.message);
  });
}
```

Update `printSummary()` to:

```js
function printSummary() {
  var counts = { OK: 0, WARN: 0, ERROR: 0 };

  results.forEach(function (item) {
    counts[item.level] = (counts[item.level] || 0) + 1;
  });

  console.log('');
  console.log('Summary: ' + counts.OK + ' OK, ' + counts.WARN + ' WARN, ' + counts.ERROR + ' ERROR');

  if (counts.ERROR > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}
```

- [ ] **Step 2: Add a top-level header so the command output is easier to scan**

Update `main()` to:

```js
function main() {
  console.log('History Learning data validation');
  console.log('');
  validateAllJsonFiles();
  printResults();
  printSummary();
}
```

- [ ] **Step 3: Run the final validator and check its exit code behavior**

Run:

```bash
node scripts/validate-data.js
echo $LASTEXITCODE
```

Expected:

```text
The first command prints the full report. The second prints 0 when only OK/WARN exist, or 1 when deterministic ERROR entries exist.
```

- [ ] **Step 4: Run diagnostics on the script**

Check diagnostics for:

```text
scripts/validate-data.js
```

Expected:

```text
No diagnostics introduced by Task 0.4 changes.
```

- [ ] **Step 5: Commit the final CLI polish**

Run:

```bash
git add scripts/validate-data.js
git commit -m "feat: finalize data validation report"
```

Expected:

```text
[main ...] feat: finalize data validation report
```

---

### Task 5: Final Task 0.4 Completion Check

**Files:**
- Read: `scripts/validate-data.js`

- [ ] **Step 1: Verify the script stays single-file and in scope**

Run:

```bash
git status --short
```

Expected:

```text
Only the planned script file appears as changed for Task 0.4. No src/data files are modified.
```

- [ ] **Step 2: Verify the required validators exist**

Run:

```bash
rg -n "validateNouns|validateTimeline|validatePeople|validateQuestions|validateMediaList|printSummary" scripts/validate-data.js
```

Expected:

```text
Matches confirm the generic and specialized validators are all present in the single script.
```

- [ ] **Step 3: Create the final Task 0.4 summary commit if any cleanup remains**

Run:

```bash
git status --short
```

Expected:

```text
No unexpected modified files remain for Task 0.4.
```

If there are final staged adjustments after diagnostics, finish with:

```bash
git add scripts/validate-data.js
git commit -m "feat: add data validation script"
```

Expected:

```text
[main ...] feat: add data validation script
```

---

## Self-Review

- **Spec coverage:** The plan covers parse checks for all JSON files, specialized rules for nouns, timeline, people, questions, films, podcasts, and hot articles, plus CLI reporting and exit codes.
- **Placeholder scan:** The plan contains concrete code, commands, and expected outputs; no `TODO` or deferred implementation text remains.
- **Type consistency:** The plan consistently uses one script file, one `results` array, and the same validator function names from the first dispatch introduction through final verification.
