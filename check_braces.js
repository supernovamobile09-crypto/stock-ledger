const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let startIdx = c.indexOf('function syncPLMTransactions');
let endIdx = c.indexOf('// Remove the link from processing', startIdx);
let block = c.substring(startIdx, endIdx);
console.log('Block length:', block.length);
let open = 0, close = 0;
for (let ch of block) { if (ch == '{') open++; if (ch == '}') close++; }
console.log('Open braces:', open, 'Close braces:', close);
if (open === close) console.log('BRACES BALANCED');
else console.log('MISMATCH!');
