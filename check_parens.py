import sys

def check_file(filename):
    with open(filename, 'r') as f:
        text = f.read()
    
    stack = []
    lines = text.split('\n')
    for line_no, line in enumerate(lines, 1):
        for col_no, char in enumerate(line, 1):
            if char in '({[':
                stack.append((char, line_no, col_no))
            elif char in ')}]':
                if not stack:
                    print(f"Unmatched closing '{char}' at line {line_no}, col {col_no}")
                    return
                top_char, top_line, top_col = stack.pop()
                if (top_char == '(' and char != ')') or \
                   (top_char == '{' and char != '}') or \
                   (top_char == '[' and char != ']'):
                    print(f"Mismatched '{char}' at line {line_no}, col {col_no}. Expected match for '{top_char}' from line {top_line}")
                    return

    if stack:
        for char, line_no, col_no in stack:
            print(f"Unmatched opening '{char}' at line {line_no}, col {col_no}")
    else:
        print("All parentheses matched!")

check_file('study-plan-styles.css.bak')
