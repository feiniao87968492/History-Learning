# Task 0.5 Test Baseline And Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the current test and data-validation commands, then record the exact repository baseline in a root-level `CHANGELOG.md` without fixing any failures.

**Architecture:** Keep Task 0.5 strictly documentation-only. Re-run the two required commands to confirm the live baseline, summarize the results into one dated changelog entry, and avoid touching application code, test files, or `src/data` files. Treat all failures and warnings as factual current-state output rather than work items to solve in this task.

**Tech Stack:** Markdown, Vitest, Node.js, JavaScript, Git

---

## File Map

- Create: `CHANGELOG.md`
- Create: `docs/superpowers/plans/2026-06-10-task-0-5-test-baseline-and-changelog-plan.md`
- Read: `docs/superpowers/specs/2026-06-10-task-0-5-test-baseline-and-changelog-design.md`
- Read: `scripts/validate-data.js`
- Read: `tests/app-static-data.test.js`
- Read: `tests/film.test.js`
- Read: `tests/resources-structure.test.js`

---

### Task 1: Re-Run The Required Test Baseline Command

**Files:**
- Read: `tests/app-static-data.test.js`
- Read: `tests/film.test.js`
- Read: `tests/resources-structure.test.js`

- [ ] **Step 1: Run the required Vitest command exactly as specified**

Run:

```bash
npx vitest run --environment jsdom
```

Expected:

```text
The command exits non-zero because the current repository baseline contains known failures.
```

- [ ] **Step 2: Record the file-level failure summary from the live output**

Capture these facts from the command output:

```text
Test Files  3 failed | 9 passed (12)
Tests       4 failed | 32 passed (36)
```

Also capture these failing files:

```text
tests/app-static-data.test.js
tests/film.test.js
tests/resources-structure.test.js
```

- [ ] **Step 3: Record the failure reasons in changelog-ready wording**

Use this exact summary text for the later changelog entry:

```md
- `tests/app-static-data.test.js`: `app.js` has not wired meme, feedback type, hot article, discussion, and profile menu static data into the shell containers.
- `tests/film.test.js`: `app.js` has not wired film dataset loading, rankings loading, and film module initialization.
- `tests/resources-structure.test.js`: the normalized `resources/images/...` directory skeleton does not exist in the expected shape.
```

- [ ] **Step 4: Re-run only if the first command output was truncated or unclear**

Run only when needed:

```bash
npx vitest run --environment jsdom
```

Expected:

```text
The same three failing test files and the same 12-file / 36-test totals appear again.
```

- [ ] **Step 5: Do not change any test or app files**

Check:

```text
Task 0.5 only records the current baseline. Do not modify tests, `src/js/app.js`, or resource directories in response to the failures above.
```

---

### Task 2: Re-Run The Required Data Validation Baseline Command

**Files:**
- Read: `scripts/validate-data.js`

- [ ] **Step 1: Run the required data-validation command exactly as specified**

Run:

```bash
node scripts/validate-data.js
```

Expected:

```text
The command exits with code 1 because the current data baseline contains deterministic ERROR entries.
```

- [ ] **Step 2: Record the summary totals from the live output**

Capture these facts from the command output:

```text
Summary: 13 OK, 2 WARN, 20 ERROR
```

- [ ] **Step 3: Record the warning summary in changelog-ready wording**

Use this exact warning summary later in `CHANGELOG.md`:

```md
- `people.json`: current data uses a `centers`-based structure, so the validator skips `id` and `relations` checks.
- `questions.json`: the file is currently absent, so specialized question validation is skipped.
```

- [ ] **Step 4: Record the error summary in changelog-ready wording**

Use this exact error summary later in `CHANGELOG.md`:

```md
- All `20` errors come from `nouns.json`.
- The current error categories are missing `dynasty`, missing `category`, and `related` references that point to nouns not present in the same file.
```

- [ ] **Step 5: Do not edit any JSON files or validator logic**

Check:

```text
Task 0.5 treats the validator output as baseline evidence. Do not change `src/data/*.json` or `scripts/validate-data.js` while capturing this entry.
```

---

### Task 3: Create The Root Changelog With The Baseline Entry

**Files:**
- Create: `CHANGELOG.md`

- [ ] **Step 1: Create the changelog file with the title and dated section**

Create `CHANGELOG.md` with this exact initial structure:

```md
# CHANGELOG

## 2026-06-10

### Test Baseline

- Command: `npx vitest run --environment jsdom`
- Test files: `12`
- Passed files: `9`
- Failed files: `3`
- Total tests: `36`
- Passed tests: `32`
- Failed tests: `4`
- Current failing areas:
- `tests/app-static-data.test.js`: `app.js` has not wired meme, feedback type, hot article, discussion, and profile menu static data into the shell containers.
- `tests/film.test.js`: `app.js` has not wired film dataset loading, rankings loading, and film module initialization.
- `tests/resources-structure.test.js`: the normalized `resources/images/...` directory skeleton does not exist in the expected shape.

### Data Validation Baseline

- Command: `node scripts/validate-data.js`
- Summary: `13 OK`, `2 WARN`, `20 ERROR`
- Current warnings:
- `people.json`: current data uses a `centers`-based structure, so the validator skips `id` and `relations` checks.
- `questions.json`: the file is currently absent, so specialized question validation is skipped.
- Current errors:
- All `20` errors come from `nouns.json`.
- The current error categories are missing `dynasty`, missing `category`, and `related` references that point to nouns not present in the same file.

### Known Baseline Notes

- This entry records the repository state observed on `2026-06-10`.
- The failing tests, warnings, and errors above were not fixed as part of this task.
- Later work should compare against this entry rather than replacing or hiding these baseline results.
```

- [ ] **Step 2: Normalize the markdown so every bullet is factual and scope-safe**

Verify the file keeps these constraints:

```text
No remediation promises.
No TODO markers.
No “next step” project-management language.
No omitted failure categories.
```

- [ ] **Step 3: Read the full file and verify the numbers match the live command outputs**

Check `CHANGELOG.md` against the captured results:

```text
Vitest: 12 files, 9 passed files, 3 failed files, 36 tests, 32 passed tests, 4 failed tests
Validator: 13 OK, 2 WARN, 20 ERROR
```

- [ ] **Step 4: Ensure the changelog entry stays concise instead of pasting raw terminal logs**

Check:

```text
The changelog contains summary bullets only. It does not paste the full Vitest stack traces or every individual nouns.json error line.
```

- [ ] **Step 5: Save the file without touching unrelated docs**

Check:

```text
Only `CHANGELOG.md` is newly created for Task 0.5 execution. Existing spec and plan files remain unchanged unless execution tracking requires checkbox updates.
```

---

### Task 4: Verify Scope And Prepare The Commit

**Files:**
- Read: `CHANGELOG.md`

- [ ] **Step 1: Check the working tree before staging**

Run:

```bash
git status --short
```

Expected:

```text
`CHANGELOG.md` appears as a new file for this task. Other unrelated repository changes may still exist and must be left untouched.
```

- [ ] **Step 2: Stage only the changelog file**

Run:

```bash
git add CHANGELOG.md
```

Expected:

```text
Only the new changelog entry is staged for the Task 0.5 commit.
```

- [ ] **Step 3: Verify the staged diff contains only the baseline record**

Run:

```bash
git diff --cached -- CHANGELOG.md
```

Expected:

```text
The staged diff shows one new markdown file with the 2026-06-10 baseline entry and no code changes.
```

- [ ] **Step 4: Commit with the planned message**

Run:

```bash
git commit -m "docs: establish test baseline and changelog"
```

Expected:

```text
[main ...] docs: establish test baseline and changelog
```

- [ ] **Step 5: Confirm no accidental extra files were committed**

Run:

```bash
git show --stat --oneline HEAD~0
```

Expected:

```text
The commit summary lists `CHANGELOG.md` only, or only the intended execution-tracking artifact if your workflow explicitly updates the plan checkbox state in the same commit.
```

---

### Task 5: Final Task 0.5 Completion Check

**Files:**
- Read: `CHANGELOG.md`
- Read: `docs/superpowers/specs/2026-06-10-task-0-5-test-baseline-and-changelog-design.md`

- [ ] **Step 1: Verify the changelog satisfies the spec output requirements**

Check that `CHANGELOG.md` contains all required sections:

```text
Document title
2026-06-10 baseline entry
Test baseline summary
Data validation baseline summary
Known baseline notes
```

- [ ] **Step 2: Verify the task stayed within scope**

Check:

```text
No test failures were fixed.
No data files were fixed.
No frontend logic was changed.
No validator rules were changed.
```

- [ ] **Step 3: Verify the entry is honest about failures**

Check:

```text
The changelog explicitly lists all three failing test files and states that all 20 validator errors come from nouns.json.
```

- [ ] **Step 4: Verify future readers can compare later runs against this baseline**

Check:

```text
The changelog includes the exact commands used to produce the baseline and the exact numeric summaries from those commands.
```

- [ ] **Step 5: Hand off Task 0.5 as complete**

Report:

```text
Task 0.5 is complete when CHANGELOG.md exists, records the 2026-06-10 test and data-validation baseline accurately, and the commit history contains the documentation-only baseline commit.
```

---

## Self-Review

- **Spec coverage:** The plan covers both required commands, the creation of `CHANGELOG.md`, factual summaries for tests and validator output, and the final documentation-only commit.
- **Placeholder scan:** Every step includes concrete commands, exact numeric baselines, and exact changelog text; there are no `TODO`, `TBD`, or deferred placeholders.
- **Type consistency:** The same command strings, counts, filenames, and changelog section names are used consistently from capture steps through final verification.
