const fs=require('fs');
const code=fs.readFileSync('main_script.js','utf8');
const lines=code.split('\n');
let depth=0,maxDepth=0;
let inString=false,stringChar='',escaped=false;
let inLineComment=false,inBlockComment=false;
let issues=[];
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  inLineComment=false;
  for(let j=0;j<line.length;j++){
    const c=line[j];
    const next=j<line.length-1?line[j+1]:'';
    if(inBlockComment){
      if(c==='*'&&next==='/'){inBlockComment=false;j++;continue;}
      continue;
    }
    if(inLineComment){continue;}
    if(escaped){escaped=false;continue;}
    if(c==='\\'){escaped=true;continue;}
    if(inString){if(c==='\\'){j++;continue;}if(c===stringChar)inString=false;continue;}
    if(c==='/'&&next==='/'){inLineComment=true;continue;}
    if(c==='/'&&next==='*'){inBlockComment=true;j++;continue;}
    if(c==='\''){inString=true;stringChar='\'';continue;}
    if(c==='"'){inString=true;stringChar='"';continue;}
    if(c==='`'){inString=true;stringChar='`';continue;}
    if(c==='('||c==='{'||c==='[')depth++;
    if(c===')'||c==='}'||c===']')depth--;
  }
  if(depth<0){
    issues.push({line:i+1,depth:depth,content:line.trim().substring(0,120)});
    depth=0;
  }
  if(depth>maxDepth)maxDepth=depth;
}
console.log('Final depth: '+depth);
console.log('Max depth: '+maxDepth);
console.log('Total lines: '+lines.length);
if(issues.length>0){
  console.log('Negative depth incidents:');
  issues.forEach(x=>console.log('  Line '+x.line+' depth='+x.depth+' | '+x.content));
} else {
  console.log('No negative depth - searching for where depth differs from expected...');
  // Find where depth goes to unusual values
  depth=0;inString=false;inBlockComment=false;inLineComment=false;escaped=false;
  let lastOpen=[];
  for(let i=0;i<lines.length;i++){
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
      if(c==='('||c==='{'||c==='['){depth++;lastOpen.push({line:i+1,ch:c,depth});}
      if(c===')'||c==='}'||c===']'){
        const expected=c===')'?'(':c==='}'?'{':'[';
        if(lastOpen.length>0&&lastOpen[lastOpen.length-1].ch!==expected){
          console.log('MISMATCH at line '+(i+1)+': found "'+c+'" but expected "'+expected+'" to close open from line '+lastOpen[lastOpen.length-1].line+' ('+lastOpen[lastOpen.length-1].ch+')');
        }
        if(lastOpen.length>0)lastOpen.pop();
        depth--;
      }
    }
  }
}
