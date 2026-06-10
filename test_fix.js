const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('main_script.js', 'utf8');
const lines = code.split('\n');

// Try parsing up to just before line 5814 to see what state the parser is in
// First, let's try to parse chunks and find where the nesting goes wrong

// Approach: parse the script and find all locations where an opening bracket
// doesn't have a matching closing
console.log('=== Strategy: Find the 2 extra opening brackets ===\n');

// Count ALL brackets (not just IIFEs) by parsing with acorn's tokenizer
let depth = {paren: 0, brace: 0, bracket: 0};
let maxDepth = {paren: 0, brace: 0, bracket: 0};

// Use a simpler approach: just check what acorn says about the error context
try {
  acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
} catch(e) {
  console.log('First error at line', e.loc.line, 'col', e.loc.column);
  
  // Now try parsing without the orphaned line
  const codeLines = code.split('\n');
  const codeWithout = codeLines.filter((_, i) => i !== 5813).join('\n'); // Remove line 5814 (0-indexed: 5813)
  
  try {
    acorn.parse(codeWithout, { ecmaVersion: 2022, sourceType: 'script', allowReserved: true, allowReturnOutsideFunction: true });
    console.log('\nWithout line 5814: NO ERRORS! The file is valid!');
  } catch(e2) {
    console.log('\nWithout line 5814: Error at line', e2.loc.line, 'col', e2.loc.column, ':', e2.message);
    // Show context
    const removed = codeLines.filter((_, i) => i !== 5813);
    for (let i = Math.max(0, e2.loc.line - 5); i <= Math.min(removed.length - 1, e2.loc.line + 3); i++) {
      const marker = (i + 1 === e2.loc.line) ? '>>>' : '   ';
      console.log(marker + ' ' + (i + 1) + ': ' + removed[i]);
    }
  }
}
