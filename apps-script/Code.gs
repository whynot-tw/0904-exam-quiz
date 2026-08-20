const SPREADSHEET_ID = '1kyCJVFF74BZ_NR5KGHeXactHDd5zH2WfF2LQ0gOsGyU';
const REQUIRED_SHEETS = ['Questions', 'Attempts', 'AttemptAnswers', 'WrongQuestions', 'ReviewNotes', 'Settings'];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'bootstrap';
  if (action !== 'bootstrap') return json_({ error: 'unknown_action' });
  return json_(bootstrap_());
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'completeAttempt') return json_({ error: 'unknown_action' });
    return json_(completeAttempt_(body));
  } catch (err) {
    return json_({ error: String(err && err.message || err) });
  }
}

function bootstrap_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = validateSheets_(ss);
  const settings = rows_(sheets.Settings);
  const questions = rows_(sheets.Questions).filter(r => String(r.enabled).toUpperCase() === 'TRUE' && r.import_status === 'imported');
  const wrong = rows_(sheets.WrongQuestions);
  const attempts = rows_(sheets.Attempts).slice(-20).reverse();
  return { settings, questions, wrongQuestions: wrong, attempts };
}

function completeAttempt_(body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = validateSheets_(ss);
  const attempt = body.attempt || {};
  const answers = body.answers || [];
  if (!['practice', 'mock', 'wrong'].includes(attempt.mode)) throw new Error('invalid mode');
  if (![5, 10, 20].includes(Number(attempt.question_count))) throw new Error('invalid question count');
  if (answers.length !== Number(attempt.question_count)) throw new Error('answer count mismatch');
  const validIds = new Set(rows_(sheets.Questions).filter(r => r.import_status === 'imported' && String(r.enabled).toUpperCase() === 'TRUE').map(r => r.question_id));
  answers.forEach(a => { if (!validIds.has(a.question_id)) throw new Error('invalid question_id: ' + a.question_id); if (!['A','B','C','D'].includes(a.selected_option)) throw new Error('invalid selected_option'); });
  const correct = answers.filter(a => a.is_correct === true).length;
  const now = new Date();
  const attemptId = Utilities.getUuid();
  appendObject_(sheets.Attempts, { attempt_id: attemptId, started_at: attempt.started_at || now.toISOString(), completed_at: now.toISOString(), mode: attempt.mode, question_count: answers.length, correct_count: correct, wrong_count: answers.length - correct, score: Math.round(correct / answers.length * 100), passed_80: correct / answers.length >= .8 ? 'TRUE' : 'FALSE', filter_json: JSON.stringify(attempt.filter || {}) });
  answers.forEach((a, i) => appendObject_(sheets.AttemptAnswers, { attempt_answer_id: Utilities.getUuid(), attempt_id: attemptId, question_id: a.question_id, sequence_no: i + 1, selected_option: a.selected_option, correct_option_snapshot: a.correct_option, is_correct: a.is_correct ? 'TRUE' : 'FALSE', answered_at: now.toISOString(), marked_review_error: a.marked_review_error || '' }));
  return { ok: true, attempt_id: attemptId, correct_count: correct, score: Math.round(correct / answers.length * 100) };
}

function validateSheets_(ss) {
  const result = {};
  REQUIRED_SHEETS.forEach(name => { const sheet = ss.getSheetByName(name); if (!sheet) throw new Error('missing sheet: ' + name); result[name] = sheet; });
  return result;
}
function rows_(sheet) { const values = sheet.getDataRange().getDisplayValues(); if (!values.length) return []; const headers = values.shift(); return values.filter(row => row.some(Boolean)).map(row => headers.reduce((o, h, i) => { o[h] = row[i]; return o; }, {})); }
function appendObject_(sheet, obj) { const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]; sheet.appendRow(headers.map(h => obj[h] == null ? '' : obj[h])); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
