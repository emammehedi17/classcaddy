import glob
import re

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all class="..."
    classes = re.findall(r'class="([^"]*)"', content)
    for i, cls in enumerate(classes):
        if cls.count('(') != cls.count(')'):
            print(f"File {file} has unbalanced parenthesis in class: {cls}")
            
    # Also find all class='...'
    classes_sq = re.findall(r"class='([^']*)'", content)
    for i, cls in enumerate(classes_sq):
        if cls.count('(') != cls.count(')'):
            print(f"File {file} has unbalanced parenthesis in class: {cls}")
