const acorn = require('acorn');
const fs = require('fs');

const code = fs.readFileSync('main_script.js', 'utf8');

try {
  acorn.parse(code, {
    ecmaVersion: 2022,
    sourceType: 'script',
    allowReserved: true,
    allowReturnOutsideFunction: true
  });
  console.log('No syntax errors found!');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Position:', e.pos);
  console.log('Line:', e.loc.line);
  console.log('Column:', e.loc.column);
  
  // Show context around the error
  const lines = code.split('\n');
  const errLine = e.loc.line;
  for (let i = Math.max(0, errLine - 5); i <= Math.min(lines.length - 1, errLine + 2); i++) {
    const marker = (i + 1 === errLine) ? '>>>' : '   ';
    console.log(marker + ' ' + (i + 1) + ': ' + lines[i]);
  }
}
