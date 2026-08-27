import glob
import re

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    classes = re.findall(r'class="([^"]*)"', content)
    for i, cls in enumerate(classes):
        if cls.count('[') != cls.count(']'):
            print(f"File {file} has unbalanced bracket in class: {cls}")
