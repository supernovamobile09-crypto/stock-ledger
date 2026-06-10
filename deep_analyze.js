const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('main_script.js', 'utf8');
const lines = code.split('\n');

// Track bracket depth using acorn tokenizer
let depth = 0;
let depthAtLine = [];
let prevLine = 0;

try {
  const tokens = acorn.tokenizer(code, { ecmaVersion: 2022, allowReserved: true });
  for (const tok of tokens) {
    const line = tok.loc ? tok.loc.line : prevLine;
    if (line !== prevLine) {
      // Record depth at the start of each new line
      for (let l = prevLine + 1; l <= line; l++) {
        depthAtLine[l] = depth;
      }
      prevLine = line;
    }
    if (tok.type && tok.type.keyword === undefined) {
      const val = tok.value;
      if (val === '(' || val === '{' || val === '[') depth++;
      if (val === ')' || val === '}' || val === ']') depth--;
    }
  }
} catch(e) {
  // Tokenizer might fail at the same error point, that's OK
}

// Fill remaining lines
for (let l = prevLine + 1; l <= lines.length; l++) {
  depthAtLine[l] = depth;
}

console.log('Final depth:', depth);
console.log('Lines:', lines.length);

// Find where depth becomes -1 (extra closing) or where it's anomalous
console.log('\n--- Depth around the error (lines 5800-5820) ---');
for (let i = 5800; i <= 5820; i++) {
  if (depthAtLine[i] !== undefined) {
    console.log('L' + i + ' depth=' + depthAtLine[i] + ' | ' + lines[i-1].substring(0, 80));
  }
}

console.log('\n--- Depth at module boundaries ---');
[437, 614, 2490, 2697, 4232, 4440, 5002, 5349, 5810, 5814, 5817, 6346, 6614].forEach(l => {
  console.log('L' + l + ' depth=' + (depthAtLine[l]||'?') + ' | ' + lines[l-1].substring(0, 80));
});

// Find all lines where depth drops to 0 from a higher value (module-level closings)
console.log('\n--- Lines where depth reaches 0 (potential module boundaries) ---');
for (let i = 1; i <= lines.length; i++) {
  if (depthAtLine[i] === 0 && depthAtLine[i-1] > 0) {
    console.log('L' + i + ' depth=0 | ' + lines[i-1].substring(0, 80));
  }
}
