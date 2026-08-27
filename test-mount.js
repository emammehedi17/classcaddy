import fs from 'fs';
console.log("Checking index.html size:", fs.statSync('dist/index.html').size);
