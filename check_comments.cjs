const fs = require('fs');
const content = fs.readFileSync('study-plan-styles.css', 'utf8');
let openCount = 0;
for (let i = 0; i < content.length - 1; i++) {
  if (content[i] === '/' && content[i+1] === '*') {
    openCount++;
    i++;
  } else if (content[i] === '*' && content[i+1] === '/') {
    openCount--;
    i++;
  }
}
console.log('Open comment count:', openCount);
