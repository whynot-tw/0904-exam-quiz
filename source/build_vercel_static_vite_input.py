import json
from pathlib import Path
src = json.loads(Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-input.json').read_text())
src['name'] = '0904-exam-quiz-vite-preview'
src['projectSettings'] = {'framework': 'vite', 'outputDirectory': '.', 'buildCommand': 'echo static-preview-ready', 'installCommand': 'echo no-install-needed'}
src['files'].append({'file': 'package.json', 'encoding': 'utf-8', 'data': '{"name":"0904-exam-quiz-vite-preview","version":"0.1.0","private":true,"scripts":{"build":"echo static-preview-ready"}}'})
Path('/home/ubuntu/sep4-exam-practice-app-v01/source/vercel-static-vite-input.json').write_text(json.dumps(src, ensure_ascii=False))
print('files', len(src['files']))
