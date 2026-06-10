const fs=require('fs');
const vm=require('vm');
const lines=fs.readFileSync('main_script.js','utf8').split('\n');
let lo=0,hi=lines.length;
while(lo<hi-1){
  const mid=Math.floor((lo+hi)/2);
  try{new vm.Script(lines.slice(0,mid).join('\n'))}catch(e){hi=mid;}
  try{new vm.Script(lines.slice(0,lo+1).join('\n'));lo=lo+1;}catch(e){}
}
console.log('Error at script line: '+hi);
for(let i=Math.max(0,hi-5);i<Math.min(lines.length,hi+3);i++){
  console.log((i+1===hi?'>>> ':'    ')+(i+1)+': '+lines[i]);
}
