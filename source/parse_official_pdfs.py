import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path('/home/ubuntu/sep4-exam-practice-app-v01/source')


def normalize(text):
    text = text.replace('\f', '\n')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def parse_file(path, source_key, source_name, pattern, answer_map, answer_group=1, number_group=2):
    raw = path.read_text(errors='replace')
    matches = list(re.finditer(pattern, raw))
    rows = []
    for idx, m in enumerate(matches):
        start = m.start()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(raw)
        block = normalize(raw[start:end])
        answer_token = m.group(answer_group)
        number = m.group(number_group)
        body = normalize(raw[m.end():end])
        option_pattern = r'([①②③④])\s*' if source_key == 'HARDWARE' else r'\(([A-D])\)\s*'
        option_map = {'①': 'A', '②': 'B', '③': 'C', '④': 'D'}
        option_matches = list(re.finditer(option_pattern, body))
        options = {letter: '' for letter in 'ABCD'}
        question_text = body
        if option_matches:
            question_text = body[:option_matches[0].start()].strip()
            for j, om in enumerate(option_matches):
                ostart = om.end()
                oend = option_matches[j + 1].start() if j + 1 < len(option_matches) else len(body)
                letter = option_map.get(om.group(1), om.group(1))
                options[letter] = body[ostart:oend].strip(' .;；')
        explanation = ''
        if '【解析】' in block:
            question_part, explanation = block.split('【解析】', 1)
            explanation = explanation.strip()
            if option_matches:
                qbody = normalize(question_part[m.end():])
                om2 = list(re.finditer(option_pattern, qbody))
                question_text = qbody[:om2[0].start()].strip() if om2 else qbody
                for j, om in enumerate(om2):
                    ostart = om.end()
                    oend = om2[j + 1].start() if j + 1 < len(om2) else len(qbody)
                    letter = option_map.get(om.group(1), om.group(1))
                    options[letter] = qbody[ostart:oend].strip(' .;；')
        correct = answer_map(answer_token)
        media = any(k in block for k in ['如下圖', '如下圖所示', '波形', '接線圖', '如圖', '圖中'])
        review_reasons = []
        if correct not in 'ABCD': review_reasons.append('missing_answer')
        if any(not options[x] for x in 'ABCD'): review_reasons.append('non_four_choice')
        if media: review_reasons.append('requires_media')
        status = 'needs_review' if review_reasons else 'imported'
        enabled = status == 'imported'
        qid = f'{source_key}-{number}'
        rows.append({
            'question_id': qid,
            'source_key': source_key,
            'source_section': source_name,
            'source_question_no': number,
            'source_page': raw[:start].count('\f') + 1,
            'category': source_name,
            'question_text': question_text,
            'option_a': options['A'], 'option_b': options['B'], 'option_c': options['C'], 'option_d': options['D'],
            'correct_option': correct,
            'explanation': explanation,
            'enabled': enabled,
            'requires_media': media,
            'source_raw': block,
            'source_url': '',
            'import_status': status,
            'verified': False,
            'notes': ','.join(review_reasons),
        })
    counts = Counter()
    for r in rows:
        counts['total'] += 1
        counts['enabled'] += int(r['enabled'])
        counts['needs_review'] += int(r['import_status'] == 'needs_review')
        counts['requires_media'] += int(r['requires_media'])
        counts['missing_answer'] += int(r['correct_option'] not in 'ABCD')
        counts['non_four_choice'] += int(any(not r[k] for k in ('option_a','option_b','option_c','option_d')))
    seen = Counter(normalize(r['question_text']) for r in rows)
    counts['duplicate_suspicions'] = sum(v - 1 for v in seen.values() if v > 1)
    return rows, dict(counts)


def hw_answer(token):
    return 'ABCD'[int(token) - 1] if token.isdigit() and 1 <= int(token) <= 4 else ''


def ai_answer(token):
    return token if token in 'ABCD' else ''

hardware, hw_qa = parse_file(ROOT / 'official-hardware.txt', 'HARDWARE', '電腦硬體裝修', r'(?m)^\s*(\d+)\.\s*\((\d)\)', hw_answer, answer_group=2, number_group=1)
ai, ai_qa = parse_file(ROOT / 'official-ai.txt', 'AI', 'AI人工智慧工具應用', r'\(([A-D])\)\s*(\d+)\.', ai_answer)
all_rows = hardware + ai
seen_ids = {}
for row in all_rows:
    base = row['question_id']
    seen_ids[base] = seen_ids.get(base, 0) + 1
    if seen_ids[base] > 1:
        row['question_id'] = f"{base}-{seen_ids[base]}"
        row['notes'] = (row['notes'] + ',' if row['notes'] else '') + 'duplicate_source_question_no'
(ROOT / 'questions-parsed.json').write_text(json.dumps(all_rows, ensure_ascii=False, indent=2))
qa = {'hardware': hw_qa, 'ai': ai_qa, 'all_question_ids': [r['question_id'] for r in all_rows], 'needs_review': [r for r in all_rows if r['import_status'] == 'needs_review']}
(ROOT / 'qa-summary.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2))
print(json.dumps({'hardware': hw_qa, 'ai': ai_qa, 'total': len(all_rows)}, ensure_ascii=False, indent=2))
