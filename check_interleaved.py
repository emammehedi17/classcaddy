with open('study-plan-styles.css', 'r', encoding='utf-8') as f:
    css = f.read()
import re
css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
css = re.sub(r'\'[^\']*\'', '', css)
css = re.sub(r'\"[^\"]*\"', '', css)

stack = []
for i, char in enumerate(css):
    if char == '(':
        stack.append('(')
    elif char == '{':
        stack.append('{')
    elif char == ')':
        if not stack or stack[-1] != '(':
            print(f"Error at index {i}: expected ), but stack is {stack[-5:]}")
            print(css[max(0, i-50):i+50])
            break
        stack.pop()
    elif char == '}':
        if not stack or stack[-1] != '{':
            print(f"Error at index {i}: expected }}, but stack is {stack[-5:]}")
            print(css[max(0, i-50):i+50])
            break
        stack.pop()
