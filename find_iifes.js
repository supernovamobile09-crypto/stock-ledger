// Use acorn-like approach: parse the script and find all bracket mismatches
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('main_script.js', 'utf8');
const lines = code.split('\n');

// Find the first error precisely using vm.Script
try {
  new vm.Script(code);
  console.log('No errors found!');
} catch(e) {
  console.log('Error:', e.message);
  // Try to get line info from the stack
  if (e.stack) {
    const stackLines = e.stack.split('\n');
    stackLines.forEach(l => {
      if (l.includes('main_script.js') || l.includes('<anonymous>')) {
        console.log('Stack:', l.trim());
      }
    });
  }
}

// Now let's do a proper scan looking for unmatched IIFE patterns
// Find all lines with (function(){ that open IIFEs
console.log('\n--- IIFE Openings (;(function(){ patterns) ---');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s*;?\s*\(function\s*\(/)) {
    console.log('  L' + (i+1) + ': ' + lines[i].trim().substring(0, 80));
  }
}

console.log('\n--- IIFE Closings (})(); or })() patterns) ---');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s*\}\)\(\);?$/)) {
    console.log('  L' + (i+1) + ': ' + lines[i].trim());
  }
  if (lines[i].match(/^\s*\}\)\(\)\s*$/)) {
    console.log('  L' + (i+1) + ': ' + lines[i].trim());
  }
}
