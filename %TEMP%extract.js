const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const scripts=[];let idx=0;
while(true){
  const open=html.indexOf('<script>',idx);
  if(open===-1)break;
  const close=html.indexOf('</script>',open);
  if(close===-1)break;
  const content=html.substring(open+8,close).trim();
  scripts.push({start:open,len:content.length,content});
  idx=close+9;
}
scripts.sort((a,b)=>b.len-a.len);
fs.writeFileSync('main_script.js', scripts[0].content);
console.log('Extracted main script: '+scripts[0].len+' chars');
