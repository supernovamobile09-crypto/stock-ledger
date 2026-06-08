const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let block = c.substring(613380, 621251); // function syncPLMTransactions body
let open = 0, close = 0;
for (let ch of block) { if (ch == '{') open++; if (ch == '}') close++; }
console.log('Body braces - Open:', open, 'Close:', close);
console.log('Balanced:', open === close);
