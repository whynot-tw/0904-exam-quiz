import json
for q in json.load(open('/home/ubuntu/sep4-exam-practice-app-v01/source/questions-parsed.json')):
    t=q['question_text']
    if any(x in t for x in ['SRAM','crontab','Windows 10','Modem','Internet']):
        print(q['question_id'], '|', t, '|', q['correct_option'])
