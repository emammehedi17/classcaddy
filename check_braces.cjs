const fs = require('fs');
const content = fs.readFileSync('study-plan-styles.css', 'utf8');
const stack = [];
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') {
    stack.push(i);
  } else if (char === '}') {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log('Unmatched } at index', i);
    }
  }
}
if (stack.length > 0) {
  console.log('Unclosed { at indices:', stack.map(i => {
    let lines = content.slice(0, i).split('\n');
    return 'line ' + lines.length;
  }).join(', '));
} else {
  console.log('All braces match!');
}
