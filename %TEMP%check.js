const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
let idx=0,scriptNum=0;
while(true){
  const open=html.indexOf('<script>',idx);
  if(open===-1)break;
  const close=html.indexOf('</script>',open);
  if(close===-1)break;
  const content=html.substring(open+8,close).trim();
  scriptNum++;
  if(content.length>100000){
    const outFile='script_check_'+scriptNum+'.js';
    fs.writeFileSync(outFile, content);
    console.log('Wrote Script #'+scriptNum+' ('+content.length+' chars) to '+outFile);
  }
  idx=close+9;
}
