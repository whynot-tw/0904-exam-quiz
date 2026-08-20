import json
from pathlib import Path

root = Path('/home/ubuntu/sep4-exam-practice-app-v01/source')
questions = json.loads((root / 'questions-parsed.json').read_text())
legacy = [
    ('SRAM 主要組成元件', ['SRAM', '主要構成元件']),
    ('Linux 編輯排程', ['Linux', '預訂排程每 3 分鐘']),
    ('Windows 10 呼叫「說明」快速鍵', ['Windows 10', '呼叫「說明」']),
    ('Modem 連上 Internet 所需協定／配接卡', ['Modem', 'Internet', '協定及配接卡']),
]
results = []
for key, terms in legacy:
    candidates = [q for q in questions if all(term.lower() in q['question_text'].lower() for term in terms)]
    results.append({'legacy_key': key, 'candidates': [q['question_id'] for q in candidates], 'migration_status': 'matched' if len(candidates) == 1 else 'needs_review', 'matched_question_id': candidates[0]['question_id'] if len(candidates) == 1 else None})
(root / 'legacy-migration.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(json.dumps(results, ensure_ascii=False, indent=2))
