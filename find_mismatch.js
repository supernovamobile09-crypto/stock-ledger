const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('main_script.js', 'utf8');
const lines = code.split('\n');

// Binary search to find the EXACT line where nesting goes wrong
// We know line 5814 has the error. Let's find where the extra opening bracket is.

// Strategy: parse progressively larger chunks and track the depth state
// At the error point, the parser should be inside:
// - A function body (opened by `{` inside a function expression)
// - A function expression (opened by `(`)
// But if there's an extra `{` somewhere, the `}` at line 5814 closes it,
// leaving us NOT inside a function expression, so `)` is unexpected.

// Let's find ALL places where braces go negative or where the depth differs
// from what it should be.

// Actually, let's try a different approach: 
// Remove the orphaned line 5814 and find what other line needs fixing
const codeWithout5814 = lines.filter((_, i) => i !== 5813).join('\n');

try {
  acorn.parse(codeWithout5814, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
  console.log('SUCCESS: Removing line 5814 fixes it!');
} catch(e) {
  console.log('After removing 5814, error at line', e.loc.line, ':', e.message);
  
  // The error is at end of file - means there's a missing closing
  // Let's find it by removing the LAST closing and seeing if error changes
  // Actually, let's just check: how many unclosed brackets are there?
  // Parse the code without line 5814 and count the bracket state at the end
  
  // Better approach: try removing lines at the END to find the missing closer
  const testCode = codeWithout5814;
  const testLines = testCode.split('\n');
  
  // Try removing the last line and see if it parses
  for (let removeLast = 1; removeLast <= 10; removeLast++) {
    const shortened = testLines.slice(0, -removeLast).join('\n');
    try {
      acorn.parse(shortened, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
      console.log('SUCCESS when removing last', removeLast, 'lines (line', testLines.length - removeLast + 1, 'onward)');
      break;
    } catch(e2) {
      if (removeLast === 10) {
        console.log('Still fails after removing 10 lines from end');
      }
    }
  }
  
  // Alternative: find the first error in the truncated code
  try {
    acorn.parse(testCode, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
  } catch(e3) {
    console.log('\nDetailed error after removing 5814:');
    console.log('Line:', e3.loc.line, 'Col:', e3.loc.column);
    for (let i = Math.max(0, e3.loc.line - 5); i <= Math.min(testLines.length - 1, e3.loc.line + 3); i++) {
      const marker = (i + 1 === e3.loc.line) ? '>>>' : '   ';
      console.log(marker + ' ' + (i + 1) + ': ' + testLines[i]);
    }
  }
}
