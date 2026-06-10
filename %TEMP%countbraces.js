const fs=require('fs');
const code=fs.readFileSync('main_script.js','utf8');
const lines=code.split('\n');
let depth=0,maxDepth=0;
let inString=false,stringChar='',escaped=false;
let issues=[];
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  const prevDepth=depth;
  for(let j=0;j<line.length;j++){
    const c=line[j];
    if(escaped){escaped=false;continue;}
    if(c==='\'){escaped=true;continue;}
    if(inString){if(c===stringChar)inString=false;continue;}
    if(c==='\"'||c==="\'"||c==='`'){inString=true;stringChar=c;continue;}
    if(c==='('||c==='{'||c==='[')depth++;
    if(c===')'||c==='}'||c===']')depth--;
  }
  if(depth<0){
    issues.push({line:i+1,depth,content:line.trim().substring(0,100)});
    depth=0;
  }
  if(depth>maxDepth)maxDepth=depth;
}
console.log('Final depth: '+depth);
console.log('Max depth: '+maxDepth);
console.log('Total lines: '+lines.length);
if(issues.length>0){console.log('Negative depth incidents:');issues.forEach(x=>console.log('  Line '+x.line+' depth='+x.depth+' '+x.content))}
