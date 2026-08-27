with open('study-plan-styles.css', 'r', encoding='utf-8') as f:
    css = f.read()
import re
css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
css = re.sub(r'\'[^\']*\'', '', css)
css = re.sub(r'\"[^\"]*\"', '', css)

depth = 0
for i, c in enumerate(css):
    if c == '(': depth += 1
    elif c == ')':
        depth -= 1
        if depth < 0:
            print('Extra ) at', i)
            print(css[max(0, i-50):i+50])
            depth = 0 # reset to find more
print('Final depth:', depth)
