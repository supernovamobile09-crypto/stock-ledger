const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('main_script.js', 'utf8');
const lines = code.split('\n');

// Try parsing up to line 5813 (before the error line)
const before5814 = lines.slice(0, 5813).join('\n');
try {
  acorn.parse(before5814, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
  console.log('Lines 1-5813: VALID');
} catch(e) {
  console.log('Lines 1-5813: ERROR at line', e.loc.line, ':', e.message);
}

// Try parsing up to line 5814 (including error line)
const upTo5814 = lines.slice(0, 5814).join('\n');
try {
  acorn.parse(upTo5814, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
  console.log('Lines 1-5814: VALID');
} catch(e) {
  console.log('Lines 1-5814: ERROR at line', e.loc.line, ':', e.message);
}

// Binary search: find the FIRST line where parsing breaks
let lo = 1, hi = lines.length;
while (lo < hi - 1) {
  const mid = Math.floor((lo + hi) / 2);
  const chunk = lines.slice(0, mid).join('\n');
  try {
    acorn.parse(chunk, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
    lo = mid;
  } catch(e) {
    hi = mid;
  }
}
console.log('\nFirst parse error at line:', hi);
console.log('Context:');
for (let i = Math.max(0, hi - 5); i <= Math.min(lines.length - 1, hi + 3); i++) {
  const marker = (i + 1 === hi) ? '>>>' : '   ';
  console.log(marker + ' ' + (i + 1) + ': ' + lines[i].substring(0, 100));
}

// Also check: what is the error message at that line?
const chunk = lines.slice(0, hi).join('\n');
try {
  acorn.parse(chunk, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
} catch(e) {
  console.log('\nError:', e.message);
  console.log('Position:', e.pos);
  console.log('Line:', e.loc.line, 'Col:', e.loc.column);
}
