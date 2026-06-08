const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let startIdx = c.indexOf('function syncPLMTransactions');
let endIdx = c.indexOf('// Remove the link from processing', startIdx);
let block = c.substring(startIdx, endIdx);
let lines = block.split('\n');

// Show lines around 9618-9622
for (let i = 9615; i < 9630 && i < lines.length; i++) {
  console.log((i+1) + ': ' + lines[i].trim().substring(0, 120));
}

// Also count braces after line 9617 to find where the extra { is
let b = 0;
for (let i = 0; i < 9620 && i < lines.length; i++) {
  for (let ch of lines[i]) { if (ch == '{') b++; if (ch == '}') b--; }
}
console.log('\nBrace count at line 9620:', b);
let endB = b;
for (let i = 9620; i < lines.length; i++) {
  for (let ch of lines[i]) { if (ch == '{') endB++; if (ch == '}') endB--; }
}
console.log('Final brace count:', endB);
