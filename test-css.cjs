const css = require('css');
const fs = require('fs');
const content = fs.readFileSync('study-plan-styles.css', 'utf8');
try {
  const obj = css.parse(content);
  console.log('Parse successful!');
} catch(err) {
  console.log('Parse error:', err);
}
