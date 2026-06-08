const fs = require('fs');
let c = fs.readFileSync('index (MASTER 2).html', 'utf8');
let startIdx = c.indexOf('function syncPLMTransactions');
console.log('startIdx:', startIdx);

// Find the function opening brace
let funcOpen = c.indexOf('{', startIdx);
console.log('funcOpen:', funcOpen);

// Now let's try to find a proper end by counting braces
let braceCount = 1; // assume the { is the function opening
let i = funcOpen + 1;
while (i < c.length && braceCount > 0) {
  if (c[i] == '{') braceCount++;
  if (c[i] == '}') braceCount--;
  i++;
}
console.log('braces balanced at position:', i);
console.log('Content near end:');
console.log(c.substring(i-100, i+50));

// Also check the search term
let altEnd = c.indexOf('// Remove the link from processing', startIdx);
console.log('\naltEnd:', altEnd);
console.log('Content at altEnd:', c.substring(altEnd, altEnd+80));
