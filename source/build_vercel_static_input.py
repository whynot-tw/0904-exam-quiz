import json
from pathlib import Path

root = Path('/home/ubuntu/sep4-exam-practice-app-v01/dist/public')
files = []
for path in root.rglob('*'):
    if path.is_file():
        rel = path.relative_to(root).as_posix()
        files.append({'file': rel, 'data': path.read_text(encoding='utf-8', errors='replace'), 'encoding': 'utf-8'})
Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-input.json').write_text(json.dumps({'name': '0904-exam-quiz', 'target': 'preview', 'files': files}, ensure_ascii=False))
print('files', len(files), 'bytes', Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-input.json').stat().st_size)
