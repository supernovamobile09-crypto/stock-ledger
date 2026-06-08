const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let startIdx = c.indexOf('function syncPLMTransactions');
let endIdx = c.indexOf('// Remove the link from processing', startIdx);
let block = c.substring(startIdx, endIdx);
let lines = block.split('\n');

// Count braces line by line
let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  for (let ch of lines[i]) {
    if (ch == '{') braceCount++;
    if (ch == '}') braceCount--;
  }
  if (i % 100 === 0) {
    // Find line number in file
    let fileLine = startIdx - c.indexOf('function syncPLMTransactions', 0);
    // Actually let's track this differently
  }
}
console.log('Final brace count:', braceCount);

// Second pass: find when braceCount goes negative (too many closes)
let b2 = 0;
for (let i = 0; i < lines.length; i++) {
  for (let ch of lines[i]) {
    if (ch == '{') b2++;
    if (ch == '}') b2--;
  }
  if (b2 < 0) {
    console.log('Brace count went negative at line', i+1, 'content:', lines[i].trim().substring(0, 80));
    break;
  }
}

// Third pass: find last positive brace count
b2 = 0;
let lastPosLine = 0;
for (let i = 0; i < lines.length; i++) {
  for (let ch of lines[i]) {
    if (ch == '{') b2++;
    if (ch == '}') b2--;
  }
  if (b2 > 0) lastPosLine = i + 1;
  if (b2 === 0 && lastPosLine > 0) {
    // reset lastPosLine when balanced
    lastPosLine = 0;
  }
}
console.log('Outermost unclosed brace near line:', lastPosLine);
if (lastPosLine > 0) {
  for (let i = Math.max(0, lastPosLine - 3); i < Math.min(lines.length, lastPosLine + 3); i++) {
    console.log((i+1) + ': ' + lines[i].trim().substring(0, 100));
  }
}
