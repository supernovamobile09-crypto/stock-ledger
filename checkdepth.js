const fs=require('fs');
const code=fs.readFileSync('main_script.js','utf8');
const lines=code.split('\n');
let depth=0;
let inString=false,stringChar='',escaped=false;
let inLineComment=false,inBlockComment=false;

// Track depth at each line and find mismatches
for(let i=0;i<lines.length;i++){
  // Print depth around the target area (script line ~5814 = HTML line ~7977)
  if((i+1)%500===0 || (i>=5790 && i<=5830)){
    console.log('L'+(i+1)+' depth='+depth+' | '+lines[i].substring(0,90));
  }
  const line=lines[i];
  inLineComment=false;
  for(let j=0;j<line.length;j++){
    const c=line[j];
    const next=j<line.length-1?line[j+1]:'';
    if(inBlockComment){if(c==='*'&&next==='/'){inBlockComment=false;j++;continue;}continue;}
    if(inLineComment)continue;
    if(escaped){escaped=false;continue;}
    if(c==='\\'){escaped=true;continue;}
    if(inString){if(c==='\\'){j++;continue;}if(c===stringChar)inString=false;continue;}
    if(c==='/'&&next==='/'){inLineComment=true;continue;}
    if(c==='/'&&next==='*'){inBlockComment=true;j++;continue;}
    if(c==='\''||c==='"'||c==='`'){inString=true;stringChar=c;continue;}
    if(c==='('||c==='{'||c==='[')depth++;
    if(c===')'||c==='}'||c===']')depth--;
  }
}
console.log('\nFinal depth: '+depth);
console.log('Total lines: '+lines.length);
