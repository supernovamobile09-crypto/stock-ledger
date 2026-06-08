const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let startIdx = c.indexOf('function syncPLMTransactions');
let endIdx = c.indexOf('// Remove the link from processing', startIdx);
let block = c.substring(startIdx, endIdx);
let lines = block.split('\n');

console.log('First line:', lines[0].trim().substring(0, 80));

// Track brace count at each line to find jumps
let b = 0;
for (let i = 0; i < lines.length; i++) {
  let prevB = b;
  for (let ch of lines[i]) { if (ch == '{') b++; if (ch == '}') b--; }
  if (i < 5 || i % 500 === 0 || Math.abs(b - prevB) > 1) {
    console.log('Line', (i+1), '| count after:', b, '|', lines[i].trim().substring(0, 80));
  }
}
console.log('\nFinal count:', b);
