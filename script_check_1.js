window.bindClick=window.bindClick||function(id,fn){var el=document.getElementById(id);if(el)el.addEventListener("click",fn)}
// ===================== LOCAL DATABASE (localStorage JSON) =====================
const DB = {
  db: [],
  init() { this.db = []; },
  save() { },
  nextId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  getTransactions() { return [...this.db].reverse(); },
  insertTransactions(txns) {
    for (var i = 0; i < txns.length; i++) {
      var t = txns[i];
      this.db.push({ id: this.nextId(), date: t.date || '', transaction_type: t.transaction_type || '', customer_vendor: t.customer_vendor || '', marks: t.marks || '', item_name: t.item_name || '', storage: t.storage || '', specs: t.specs || '', color: t.color || '', quantity: Number(t.quantity) || 0, transaction_status: t.transaction_status || '', logistics: t.logistics || '', linkId: t.linkId || '', linkName: t.linkName || '', created_at: new Date().toISOString() });
    }
    this.save();
    return txns.length;
  },
  deleteAll() { this.db = []; this.save(); },
  deleteById(id) {
    var idx = -1;
    for (var i = 0; i < this.db.length; i++) { if (String(this.db[i].id) === String(id)) { idx = i; break; } }
    if (idx >= 0) this.db.splice(idx, 1);
    this.save();
  },
  addTransaction(row) {
    this.db.push({ id: this.nextId(), date: row.date || '', transaction_type: row.transaction_type || '', customer_vendor: row.customer_vendor || '', marks: row.marks || '', item_name: row.item_name || '', storage: row.storage || '', specs: row.specs || '', color: row.color || '', quantity: Number(row.quantity) || 0, transaction_status: row.transaction_status || '', logistics: row.logistics || '', linkId: row.linkId || '', linkName: row.linkName || '', created_at: new Date().toISOString() });
    this.save();
    return true;
  },
  updateById(id, row) {
    var idx = -1;
    for (var i = 0; i < this.db.length; i++) { if (String(this.db[i].id) === String(id)) { idx = i; break; } }
    if (idx >= 0) {
      this.db[idx] = { id: String(id), date: row.date || '', transaction_type: row.transaction_type || '', customer_vendor: row.customer_vendor || '', marks: row.marks || '', item_name: row.item_name || '', storage: row.storage || '', specs: row.specs || '', color: row.color || '', quantity: Number(row.quantity) || 0, transaction_status: row.transaction_status || '', logistics: row.logistics || '', linkId: row.linkId || '', linkName: row.linkName || '', created_at: this.db[idx].created_at || new Date().toISOString() };
      this.save();
      return true;
    }
    return false;
  },
  exportBackup() {
    var json = JSON.stringify({ transactions: this.db, backedUpAt: new Date().toISOString() }, null, 2);
    localStorage.setItem('stockLedgerBackup', json);
    return this.db.length;
  },
  importBackup(jsonData) {
    var data = JSON.parse(jsonData);
    if (!Array.isArray(data.transactions)) throw new Error('Invalid backup file');
    this.db = [];
    for (var i = 0; i < data.transactions.length; i++) {
      var t = data.transactions[i];
      this.db.push({ id: this.nextId(), date: t.date || '', transaction_type: t.transaction_type || '', customer_vendor: t.customer_vendor || '', marks: t.marks || '', item_name: t.item_name || '', storage: t.storage || '', specs: t.specs || '', color: t.color || '', quantity: Number(t.quantity) || 0, transaction_status: t.transaction_status || '', logistics: t.logistics || '', linkId: t.linkId || '', linkName: t.linkName || '', created_at: new Date().toISOString() });
    }
    this.save();
    return data.transactions.length;
  }
};
// ===================== SUPABASE SYNC LAYER =====================
window.SUPABASE_URL='https://rvizcshgwdjvwxqvuacd.supabase.co'
window.SUPABASE_ANON_KEY='sb_publishable_fWYJ79gwC0ThFIc5DnBX7g_o30WSGzL'
window._supabaseReady=false

async function supabaseReq(table,method,query,body,prefer){
  var url=SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:'')
  var headers={'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json'}
  if(prefer)headers['Prefer']=prefer;else headers['Prefer']='return=minimal'
  var res=await fetch(url,{method:method||'GET',headers:headers,body:body?JSON.stringify(body):undefined})
  if(!res.ok&&method!=='POST')throw new Error('Supabase '+method+' '+table+': '+res.status)
  var ct=res.headers.get('content-type')
  return(ct&&ct.includes('json'))?res.json():null
}

window._syncTimer=null
function scheduleSync(){
  if(window._syncTimer)clearTimeout(window._syncTimer)
  window._syncTimer=setTimeout(syncToSupabase,3000)
}

async function loadFromSupabase(){
  if(window._supabaseDisabled)return
  try{
    var txns=await supabaseReq('transactions','GET','select=*')
    if(txns&&txns.length>0&&!window._supabaseDisabled){
      if(typeof DB!=='undefined'&&DB){DB.db=txns.map(function(t){
        return{id:t.id,date:t.date||'',transaction_type:t.transaction_type||'',customer_vendor:t.customer_vendor||'',marks:t.marks||'',item_name:t.item_name||'',storage:t.storage||'',specs:t.specs||'',color:t.color||'',quantity:Number(t.quantity)||0,transaction_status:t.transaction_status||'',logistics:t.logistics||'',linkId:t.linkId||'',linkName:t.linkName||'',created_at:t.created_at||new Date().toISOString()}
      })}
      localStorage.setItem('stockLedgerDB',JSON.stringify(txns.map(function(t){
        return{id:t.id,date:t.date||'',transaction_type:t.transaction_type||'',customer_vendor:t.customer_vendor||'',marks:t.marks||'',item_name:t.item_name||'',storage:t.storage||'',specs:t.specs||'',color:t.color||'',quantity:Number(t.quantity)||0,transaction_status:t.transaction_status||'',logistics:t.logistics||'',linkId:t.linkId||'',linkName:t.linkName||'',created_at:t.created_at||new Date().toISOString()}
      })))
    }
    var pending=await supabaseReq('pricing_pending','GET','select=*')
    if(pending&&!window._supabaseDisabled){
      localStorage.setItem('pricingPending',JSON.stringify(pending.map(function(e){
        var items=typeof e.items==='string'?JSON.parse(e.items):(e.items||[])
        var pricing=typeof e.pricing==='string'?JSON.parse(e.pricing):(e.pricing||[])
        return{id:e.id,customer:e.customer,week:e.week,status:e.status,date:e.date,logistics:e.logistics,marks:e.marks,items:items,completed:!!e.completed,approved:e.approved===null?undefined:e.approved,warehousePacked:!!e.warehouse_packed,cashReleased:!!e.cash_released,pricing:pricing,currency:e.currency||'USD'}
      })))
    }
    var keys=await supabaseReq('pricing_submitted_keys','GET','select=*')
    if(keys&&!window._supabaseDisabled){
      var obj={};keys.forEach(function(k){obj[k.key]=k.qty})
      localStorage.setItem('pricingSubmittedKeys',JSON.stringify(obj))
    }
    var users=await supabaseReq('users','GET','select=*')
    if(users&&users.length>0&&!window._supabaseDisabled){
      var uobj={};users.forEach(function(u){uobj[u.username]={password:u.password,role:u.role,name:u.name||u.username}})
      var existing={};try{existing=JSON.parse(localStorage.getItem('loginUsers')||'{}')}catch(e){}
      for(var dk in existing){
        if(!uobj[dk])uobj[dk]=existing[dk]
        else{for(var f in existing[dk]){if(uobj[dk][f]==null)uobj[dk][f]=existing[dk][f]}}
      }
      localStorage.setItem('loginUsers',JSON.stringify(uobj))
    }
    console.log('[Supabase] Data loaded from cloud (localStorage refreshed from cloud)')
  }catch(e){console.warn('[Supabase] Load failed:',e.message)}
  window._supabaseReady=true
}

async function syncToSupabase(){
  try{
    var db=typeof DB!=='undefined'&&DB&&DB.db?DB.db:[]
    if(db.length){for(var i=0;i<db.length;i+=100){
      var batch=db.slice(i,i+100).map(function(t){return{id:t.id,date:t.date||'',transaction_type:t.transaction_type||'',customer_vendor:t.customer_vendor||'',marks:t.marks||'',item_name:t.item_name||'',storage:t.storage||'',specs:t.specs||'',color:t.color||'',quantity:Number(t.quantity)||0,transaction_status:t.transaction_status||'',logistics:t.logistics||'',linkId:t.linkId||'',linkName:t.linkName||'',created_at:t.created_at||new Date().toISOString()}})
      await supabaseReq('transactions','POST','',batch,'resolution=merge-duplicates')
    }}
    var pending=JSON.parse(localStorage.getItem('pricingPending')||'[]')
    if(pending.length){var pBody=pending.map(function(e){return{id:e.id,customer:e.customer||'',week:e.week||'',status:e.status||'',date:e.date||'',logistics:e.logistics||'',marks:e.marks||'',items:JSON.stringify(e.items||[]),completed:!!e.completed,approved:e.approved===undefined?null:e.approved,warehouse_packed:!!e.warehousePacked,cash_released:!!e.cashReleased,pricing:JSON.stringify(e.pricing||[]),currency:e.currency||'USD'}})
    var pUrl=SUPABASE_URL+'/rest/v1/pricing_pending'
    var pRes=await fetch(pUrl,{method:'POST',headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify(pBody)})
    if(!pRes.ok&&pRes.status!==409&&pRes.status!==201)console.warn('[Supabase] pricing_pending sync:',pRes.status)}
    var keysObj=JSON.parse(localStorage.getItem('pricingSubmittedKeys')||'{}')
    var keys=Object.entries(keysObj)
    if(keys.length){var kBody=keys.map(function(k){return{key:k[0],qty:k[1]}})
    var kUrl=SUPABASE_URL+'/rest/v1/pricing_submitted_keys'
    var kRes=await fetch(kUrl,{method:'POST',headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify(kBody)})
    if(!kRes.ok&&kRes.status!==409&&kRes.status!==201)console.warn('[Supabase] pricing_submitted_keys sync:',kRes.status)}
    var usersObj=JSON.parse(localStorage.getItem('loginUsers')||'{}')
    var users=Object.entries(usersObj)
    if(users.length){var uBody=users.map(function(u){return{username:u[0],password:u[1].password,role:u[1].role,name:u[1].name||u[0]}})
    var uUrl=SUPABASE_URL+'/rest/v1/users'
    var uRes=await fetch(uUrl,{method:'POST',headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify(uBody)})
    if(!uRes.ok&&uRes.status!==409&&uRes.status!==201)console.warn('[Supabase] users sync:',uRes.status)}
    console.log('[Supabase] Data synced to cloud')
  }catch(e){console.warn('[Supabase] Sync failed:',e.message)}
}

// Cloud sync engine — syncs to Supabase when DB changes
var _cloudSyncPending = false
function triggerCloudSync() {
  if (_cloudSyncPending) return
  _cloudSyncPending = true
  syncToSupabase().then(function(){setTimeout(function(){_cloudSyncPending=false},1000)})
}
// Hook DB.save
var _dbSave=DB.save.bind(DB)
DB.save=function(){ 
  _dbSave(); 
  try{localStorage.setItem('stockLedgerDB',JSON.stringify(DB.db.map(function(t){
    return{id:t.id,date:t.date||'',transaction_type:t.transaction_type||'',customer_vendor:t.customer_vendor||'',marks:t.marks||'',item_name:t.item_name||'',storage:t.storage||'',specs:t.specs||'',color:t.color||'',quantity:Number(t.quantity)||0,transaction_status:t.transaction_status||'',logistics:t.logistics||'',linkId:t.linkId||'',linkName:t.linkName||'',created_at:t.created_at||new Date().toISOString()}
  })))}catch(e){}
  scheduleSync(); 
// ===================== FULL BACKUP SYSTEM =====================
window.FULL_BACKUP_KEY='supernovaFullBackup'
window.createFullBackup=function(){
  // Fallback: if DB.db is empty, try loading from localStorage
  var dbData=(window.DB&&DB.db&&DB.db.length)?DB.db:[];
  if(!dbData.length){
    try{var cached=JSON.parse(localStorage.getItem('stockLedgerDB')||'[]');if(cached.length)dbData=cached}catch(e){}
  }
  var data={
    version:2,
    backedUpAt:new Date().toISOString(),
    database:dbData,
    pricingPending:[],
    users:[],
    localStorage:{}
  }
  try{data.pricingPending=JSON.parse(localStorage.getItem('pricingPending')||'[]')}catch(e){console.warn('[BACKUP] read pricingPending:',e.message)}
  try{data.pricingSubmittedKeys=JSON.parse(localStorage.getItem('pricingSubmittedKeys')||'{}')}catch(e){console.warn('[BACKUP] read pricingSubmittedKeys:',e.message)}
  try{data.users=Object.entries(JSON.parse(localStorage.getItem('loginUsers')||'{}')).map(function(u){return{username:u[0],password:u[1].password,role:u[1].role,name:u[1].name||u[0]}})}catch(e){console.warn('[BACKUP] read users:',e.message)}
  var keys=['vendorList','logisticsList','marksList','itemList','colorList','salesmen',
    'backupFolder','pdfFolderName','companyLogo','invoiceCounter','lastInvoiceNo',
    'specsList','vendor_custom','marks_custom','logistics_custom','learnedItems',
    'plm_links_v1','plm_notif_v1','plm_settings_v1',
    'acctJournalEntries','darkMode','autoFixTypos','bgImage','bgOpacity','bgBlur','cardOpacity']
  keys.forEach(function(k){
    try{var v=localStorage.getItem(k);if(v)data.localStorage[k]=v}catch(e){}
  })
  try{localStorage.setItem(window.FULL_BACKUP_KEY,JSON.stringify(data,null,2))}catch(e){console.warn('[BACKUP] write FULL_BACKUP_KEY:',e.message)}
  return data
}
window.autoBackup=function(){
  try{return window.createFullBackup()}catch(e){console.warn('[autoBackup] error:',e)}
}
window.restoreFullBackup=function(data){
  try{
    if(!data||!data.version)throw new Error('Invalid backup file')
    // Restore database
    if(data.database&&Array.isArray(data.database)){
      DB.db=[]
      data.database.forEach(function(t){
        DB.db.push({
          id:t.id||DB.nextId(),date:t.date||'',transaction_type:t.transaction_type||'',
          customer_vendor:t.customer_vendor||'',marks:t.marks||'',item_name:t.item_name||'',
          storage:t.storage||'',specs:t.specs||'',color:t.color||'',
          quantity:Number(t.quantity)||0,transaction_status:t.transaction_status||'',
          logistics:t.logistics||'',linkId:t.linkId||'',linkName:t.linkName||'',
          created_at:t.created_at||new Date().toISOString()
        })
      })
      DB.save()
    }
    // Refresh allSavedTx
    try{if(typeof allSavedTx!=='undefined'){allSavedTx=DB.getTransactions()}}catch(e){}
    // Restore pricingPending
    if(data.pricingPending&&Array.isArray(data.pricingPending)){
      try{localStorage.setItem('pricingPending',JSON.stringify(data.pricingPending))}catch(e){}
    }
    // Restore pricingSubmittedKeys (clear if not in backup to avoid stale Supabase keys)
    if(data.pricingSubmittedKeys){
      try{localStorage.setItem('pricingSubmittedKeys',JSON.stringify(data.pricingSubmittedKeys))}catch(e){}
    }else{
      try{localStorage.setItem('pricingSubmittedKeys','{}')}catch(e){}
    }
    // Restore localStorage items
    if(data.localStorage&&typeof data.localStorage==='object'){
      Object.keys(data.localStorage).forEach(function(k){
        try{localStorage.setItem(k,data.localStorage[k])}catch(e){}
      })
    }
    // Restore users
    if(data.users&&Array.isArray(data.users)&&data.users.length){
      try{
        var existing={};try{existing=JSON.parse(localStorage.getItem('loginUsers')||'{}')}catch(e){}
        data.users.forEach(function(u){existing[u.username]={password:u.password,role:u.role,name:u.name||u.username}})
        localStorage.setItem('loginUsers',JSON.stringify(existing))
      }catch(e){console.warn('[RESTORE] users:',e.message)}
    }
    return 'DB:'+(data.database?data.database.length:0)+' rows, PP:'+(data.pricingPending?data.pricingPending.length:0)+' items'
  }catch(e){return 'Restore failed: '+e.message}
}
// ===================== SUPERNOVA PARSING FUNCTIONS =====================
const Zf={KR:'KOREA',KOREA:'KOREA',HK:'HONG KONG',HONG:'HONG KONG',JP:'JAPAN',JAPAN:'JAPAN',IN:'INDIA',INDIA:'INDIA',KH:'KOREA'}
const Zs=new Set((typeof window!=='undefined'&&window.SPECS_LIST)||['AA/A','Ukraine','AE/A','AH/A','AM/A','Asia-akasa','BRAZIL','AUS','Canada','China','Euro','HK','HK/KOREA','HK - ACT','HK - NOF','India','India - NOF','indonesia','AF/A','Japan','Korea','Ksa','Ksa-tra','Latin','LL/A','MALAYSIAN','singapore','singapore - ACT','Thai','Tra','UK','Usa','Usa - NOF','Vietnam','Vietnam - ACT','ZA/A','ZD/A','ZP/A','QL/A','QN/A','EURO ACTIVE'])
function refreshZs(){if(window.SPECS_LIST){Zs.clear();window.SPECS_LIST.forEach(s=>Zs.add(s))}}
const Qf={GO:'GOLD',GOLD:'GOLD',GD:'GOLD',WH:'WHITE',WHITE:'WHITE',BK:'BLACK',BLACK:'BLACK',BU:'BLUE',BLUE:'BLUE',OR:'ORANGE',ORANGE:'ORANGE',GN:'SAGE',GE:'SAGE',GREEN:'SAGE',SAGE:'SAGE',LA:'LAVENDER',LIGHTBLUE:'LIGHT BLUE',SI:'SILVER',SILVER:'SILVER',PK:'PINK',PINK:'PINK',PU:'LAVENDER',PURPLE:'LAVENDER',LAVENDER:'LAVENDER',TEAL:'TEAL',LV:'LAVENDER',V:'LAVENDER',BR:'BROWN',BROWN:'BROWN',CREAM:'CREAM'}
const $f=['17 PRO','17 PRO MAX','16 PRO','16 PRO MAX','15 PRO','15 PRO MAX']
const ep=/^(total|delivery|monday|tuesday|wednesday|thursday|friday|add|order|spec|emirates)\b/i
const tp=/^(?:mark|maek|mrak)\s*[:：\s]?\s*(.+)/i
const npColors=[
{re:/\bROSE\s+GOLD\b/i,name:'Rose Gold'},{re:/\bSPACE\s+BLACK\b/i,name:'Space Black'},{re:/\bSPACE\s+GRAY\b/i,name:'Space Gray'},{re:/\bSKY\s+BLUE\b/i,name:'Sky Blue'},{re:/\bJET\s+BLACK\b/i,name:'Jet Black'},{re:/\bSTARLIGHT\b/i,name:'Starlight'},{re:/\bMIDNIGHT\b/i,name:'Midnight'},{re:/\bINDIGO\b/i,name:'Indigo'},{re:/\bCITRUS\b/i,name:'Citrus'},{re:/\bDEEP\s+BLUE\b/i,name:'Deep Blue'},{re:/\bLIGHT\s+BLUE\b/i,name:'Light Blue'},{re:/\bSILVER\b/i,name:'Silver'},{re:/\bGOLD\b/i,name:'Gold'},{re:/\bBLUE\b/i,name:'Blue'},{re:/\bORANGE\b/i,name:'Orange'},{re:/\bPURPLE\b/i,name:'Purple'},{re:/\bPINK\b/i,name:'Pink'},{re:/\bWHITE\b/i,name:'White'},{re:/\bBLACK\b/i,name:'Black'},{re:/\bRED\b/i,name:'Red'},{re:/\bGREEN\b/i,name:'Green'}
]
const _p={MWUV3:{model:'iMac 24" M4 Chip',storage:'16GB/512GB'},MHFA4:{model:'MacBook Neo A18 Pro',storage:'8GB/256GB'},MHFF4:{model:'MacBook Neo A18 Pro',storage:'8GB/256GB'},MHFC4:{model:'MacBook Neo A18 Pro',storage:'8GB/512GB'},MHFE4:{model:'MacBook Neo A18 Pro',storage:'8GB/512GB'},MHFG4:{model:'MacBook Neo A18 Pro',storage:'8GB/512GB'},MC6U4:{model:'MacBook Air 13" M4',storage:'16GB/512GB'},Z1H81:{model:'MacBook Air 13" M4',storage:'16GB/512GB'},MW0X3:{model:'MacBook Air 13" M4',storage:'16GB/512GB'},MW103:{model:'MacBook Air 13" M4',storage:'16GB/512GB'},MW133:{model:'MacBook Air 13" M4',storage:'16GB/512GB'},MC7A4:{model:'MacBook Air 15" M4',storage:'16GB/256GB'},MW1L3:{model:'MacBook Air 15" M4',storage:'16GB/256GB'},MDHA4:{model:'MacBook Air 13" M5',storage:'16GB/512GB'},MDHE4:{model:'MacBook Air 13" M5',storage:'16GB/512GB'},MDHH4:{model:'MacBook Air 13" M5',storage:'16GB/512GB'},MDH84:{model:'MacBook Air 13" M5',storage:'16GB/1TB'},MDHC4:{model:'MacBook Air 13" M5',storage:'16GB/1TB'},MDHF4:{model:'MacBook Air 13" M5',storage:'16GB/1TB'},MDHJ4:{model:'MacBook Air 13" M5',storage:'16GB/1TB'},MDHD4:{model:'MacBook Air 13" M5',storage:'24GB/1TB'},MDHK4:{model:'MacBook Air 13" M5',storage:'24GB/1TB'},MDVD4:{model:'MacBook Air 15" M5',storage:'16GB/512GB'},MDVH4:{model:'MacBook Air 15" M5',storage:'16GB/512GB'},MDVQ4:{model:'MacBook Air 15" M5',storage:'16GB/512GB'},MDVE4:{model:'MacBook Air 15" M5',storage:'16GB/1TB'},MDVK4:{model:'MacBook Air 15" M5',storage:'16GB/1TB'},MDVT4:{model:'MacBook Air 15" M5',storage:'16GB/1TB'},MDVF4:{model:'MacBook Air 15" M5',storage:'24GB/1TB'},MDVN4:{model:'MacBook Air 15" M5',storage:'24GB/1TB'},MDVU4:{model:'MacBook Air 15" M5',storage:'24GB/1TB'},MPHJ3:{model:'MacBook Pro 14" M2',storage:'16GB/1TB'},MTL83:{model:'MacBook Pro 14" M3',storage:'8GB/1TB'},MX2E3:{model:'MacBook Pro 14" M4 Pro',storage:'24GB/512GB'},MX2H3:{model:'MacBook Pro 14" M4 Pro',storage:'24GB/512GB'},MX2F3:{model:'MacBook Pro 14" M4 Pro',storage:'24GB/1TB'},MX2J3:{model:'MacBook Pro 14" M4 Pro',storage:'24GB/1TB'},MX2G3:{model:'MacBook Pro 14" M4 Max',storage:'36GB/1TB'},MX2K3:{model:'MacBook Pro 14" M4 Max',storage:'36GB/1TB'},MX2T3:{model:'MacBook Pro 16" M4 Pro',storage:'24GB/512GB'},MX2X3:{model:'MacBook Pro 16" M4 Pro',storage:'24GB/512GB'},MX2Y3:{model:'MacBook Pro 16" M4 Pro',storage:'48GB/512GB'},MX303:{model:'MacBook Pro 16" M4 Max',storage:'36GB/1TB'},MDE14:{model:'MacBook Pro 14" M5',storage:'16GB/1TB'},MDE44:{model:'MacBook Pro 14" M5',storage:'16GB/1TB'},MDE34:{model:'MacBook Pro 14" M5',storage:'24GB/1TB'},MDE64:{model:'MacBook Pro 14" M5',storage:'24GB/1TB'},MGDN4:{model:'MacBook Pro 14" M5 Pro',storage:'24GB/1TB'},MGDR4:{model:'MacBook Pro 14" M5 Pro',storage:'24GB/1TB'},MGDP4:{model:'MacBook Pro 14" M5 Pro 20-Core GPU',storage:'24GB/2TB'},MGDT4:{model:'MacBook Pro 14" M5 Pro 20-Core GPU',storage:'24GB/2TB'},MJLV4:{model:'MacBook Pro 14" M5 Pro 16-Core GPU',storage:'24GB/2TB'},MJ3D4:{model:'MacBook Pro 14" M5 Max',storage:'32GB/1TB'},MJ3E4:{model:'MacBook Pro 14" M5 Max',storage:'32GB/1TB'},MGDU4:{model:'MacBook Pro 14" M5 Max',storage:'36GB/2TB'},MGEA4:{model:'MacBook Pro 16" M5 Pro',storage:'24GB/1TB'},MGE64:{model:'MacBook Pro 16" M5 Pro',storage:'48GB/1TB'},MGE74:{model:'MacBook Pro 16" M5 Max',storage:'36GB/2TB'},MGED4:{model:'MacBook Pro 16" M5 Max',storage:'36GB/2TB'},MGE94:{model:'MacBook Pro 16" M5 Max',storage:'48GB/2TB'},MD3Y4:{model:'iPad 11th Gen A16 WIFI',storage:'128GB'},MD4A4:{model:'iPad 11th Gen A16 WIFI',storage:'128GB'},MD4G4:{model:'iPad 11th Gen A16 WIFI',storage:'256GB'},MD4H4:{model:'iPad 11th Gen A16 WIFI',storage:'256GB'},MD4P4:{model:'iPad 11th Gen A16 WIFI',storage:'256GB'},MD7F4:{model:'iPad 11th Gen A16 WIFI+Cell',storage:'128GB'},MD7G4:{model:'iPad 11th Gen A16 WIFI+Cell',storage:'128GB'},MC9Y4:{model:'iPad Air 11-IN M3 WIFI',storage:'128GB'},MCNH4:{model:'iPad Air 13-IN M3 WIFI',storage:'128GB'},MCNJ4:{model:'iPad Air 13-IN M3 WIFI',storage:'128GB'},MCNK4:{model:'iPad Air 13-IN M3 WIFI',storage:'128GB'},MCNL4:{model:'iPad Air 13-IN M3 WIFI',storage:'128GB'},MCNP4:{model:'iPad Air 13-IN M3 WIFI',storage:'256GB'},MCNQ4:{model:'iPad Air 13-IN M3 WIFI',storage:'256GB'},MCNR4:{model:'iPad Air 13-IN M3 WIFI',storage:'256GB'},MCJ14:{model:'iPad Air 13-IN M3 WIFI+Cell',storage:'128GB'},MH314:{model:'iPad Air 11-IN M4 WIFI',storage:'128GB'},MH334:{model:'iPad Air 11-IN M4 WIFI',storage:'128GB'},MH344:{model:'iPad Air 11-IN M4 WIFI',storage:'128GB'},MH354:{model:'iPad Air 11-IN M4 WIFI',storage:'256GB'},MH364:{model:'iPad Air 11-IN M4 WIFI',storage:'256GB'},MH374:{model:'iPad Air 11-IN M4 WIFI',storage:'256GB'},MH394:{model:'iPad Air 11-IN M4 WIFI',storage:'256GB'},MH5N4:{model:'iPad Air 13-IN M4 WIFI',storage:'128GB'},MH5P4:{model:'iPad Air 13-IN M4 WIFI',storage:'128GB'},MH5Q4:{model:'iPad Air 13-IN M4 WIFI',storage:'128GB'},MH5U4:{model:'iPad Air 13-IN M4 WIFI',storage:'256GB'},MH5V4:{model:'iPad Air 13-IN M4 WIFI',storage:'256GB'},MH5X4:{model:'iPad Air 13-IN M4 WIFI',storage:'256GB'},MH794:{model:'iPad Air 13-IN M4 WIFI+Cell',storage:'128GB'},MVVC3:{model:'iPad Pro 11-IN M4 WIFI',storage:'512GB'},MVVD3:{model:'iPad Pro 11-IN M4 WIFI',storage:'512GB'},MWR63:{model:'iPad Pro 11-IN M4 WIFI Nano Texture',storage:'1TB'},MWR83:{model:'iPad Pro 11-IN M4 WIFI Nano Texture',storage:'2TB'},MVW13:{model:'iPad Pro 11-IN M4 WIFI+CELL',storage:'256GB'},MVX93:{model:'iPad Pro 13-IN M4 WIFI',storage:'2TB'},MDWK4:{model:'iPad Pro 11-IN M5 WIFI',storage:'256GB'},MDWL4:{model:'iPad Pro 11-IN M5 WIFI',storage:'256GB'},MDYJ4:{model:'iPad Pro 13-IN M5 WIFI',storage:'256GB'},MDYK4:{model:'iPad Pro 13-IN M5 WIFI',storage:'256GB'},ME2N4:{model:'iPad Pro 11-IN M5 WIFI+Cell',storage:'256GB'},ME7W4:{model:'iPad Pro 13-IN M5 WIFI+Cell',storage:'256GB'},MEV44:{model:'Apple Watch S11 46MM GPS',storage:''},MWWE3:{model:'Apple Watch S10 42MM GPS',storage:''},MWWH3:{model:'Apple Watch S10 42MM GPS',storage:''},MEHQ4:{model:'Apple Watch SE 3 44MM GPS',storage:''},MEPJ4:{model:'Apple Watch SE 3 44MM GPS+Cell',storage:''},MXEJ3:{model:'Apple Watch SE 2 44MM (2024)',storage:''},MXEK3:{model:'Apple Watch SE 2 44MM (2024)',storage:''},MXEP3:{model:'Apple Watch SE 2 44MM (2024)',storage:''},MXG23:{model:'Apple Watch SE 2 44MM GPS+Cell',storage:''},MF0J4:{model:'Apple Watch Ultra 3',storage:''},MXP63:{model:'AirPod 4',storage:''},MXP93:{model:'AirPod 4 ANC',storage:''},MFHP4:{model:'AirPod Pro 3',storage:''},MTJV3:{model:'AirPod Pro 2 USB-C',storage:''},MHWK4:{model:'AirPod Max 2',storage:''},MHWL4:{model:'AirPod Max 2',storage:''},MHWM4:{model:'AirPod Max 2',storage:''},MHWN4:{model:'AirPod Max 2',storage:''},MHWP4:{model:'AirPod Max 2',storage:''},MWW43:{model:'AirPod Max USB-C',storage:''},MWW53:{model:'AirPod Max USB-C',storage:''},MWW63:{model:'AirPod Max USB-C',storage:''},MWW73:{model:'AirPod Max USB-C',storage:''},MWW83:{model:'AirPod Max USB-C',storage:''},MUWA3:{model:'Apple Pencil USB-C',storage:''},MX2D3:{model:'Apple Pencil Pro',storage:''},MFE94:{model:'AirTag Gen 2',storage:''},MX542:{model:'AirTag Gen 1',storage:''}}

const AW={MEV44:{model:'Apple Watch S11 46mm'},MWWE3:{model:'Apple Watch S10 42mm'},MWWH3:{model:'Apple Watch S10 42mm'},MEHQ4:{model:'Apple Watch SE 3 44mm'},MEPJ4:{model:'Apple Watch SE 3 44mm GPS+Cell'},MXEJ3:{model:'Apple Watch SE 2 44mm'},MXEK3:{model:'Apple Watch SE 2 44mm'},MXEP3:{model:'Apple Watch SE 2 44mm'},MXG23:{model:'Apple Watch SE 2 44mm GPS+Cell'},MF0J4:{model:'Apple Watch Ultra 3'},MEU04:{model:'Apple Watch'},MEV04:{model:'Apple Watch'}}
let gp={}

function npClean(e){let t=e.toUpperCase().replace(/^IPHONE/,'');t=t.replace(/(17AIR|17E|17PROMAX|17PRO|17MAX|16AIR|16PROMAX|16PRO|16MAX|16E|15PROMAX|15PRO|15|14PROMAX|14PRO|14PLUS|14|13PROMAX|13PRO|13MINI|13|12PROMAX|12PRO|12MINI|12|11PROMAX|11PRO|11|SE)(2TB|1TB|2048|1024|512|256|128|64)/g,'$1 $2');t=t.replace(/(2TB|1TB|2048|1024|512|256|128|64)(LV|V|WH|BK|BU|OR|GN|GE|GD|LA|SI|PK|PU|GO)$/g,'$1 $2');return t}
function rp(e){let t=e.replace(/\*/g,'').replace(/@[\d.]+/g,'').trim();t=t.replace(/\(([^)]+)\)\/(\w+)/g,(e,t,n)=>t+' '+n);t=t.replace(/(\d+)\/(\d+)/g,'$1 $2');t=t.replace(/[-–"—]/g,' ');t=t.replace(/\t/g,' ');t=t.replace(/\b(2TB|1TB|2048|1024|512GB|256GB|128GB|64GB|512|256|128|64)(LV|V|WH|BK|BU|OR|GN|GE|GD|LA|SI|PK|PU|GO|WHITE|BLACK|BLUE|GOLD|SILVER|GREEN|PINK|PURPLE|ORANGE|BROWN|CREAM|SAGE|TEAL|LAVENDER)\b/gi,'$1 $2');t=t.replace(/\b(JP|KR|HK|IN|KH)(\d+)/gi,'$1 $2');t=t.replace(/(\d+)(JP|KR|HK|IN|KH)\b/gi,'$1 $2');return t.split(/[\s,]+/).filter(Boolean).map(e=>/^(IPHONE)?(17|16|15|14|13|12|11|SE)/i.test(e)?npClean(e):e.toUpperCase()).join(' ').replace(/\s+/g,' ').trim()}
function ip(e){e=e.replace(/IPHONE/g,'');const models=[{re:/\b17\s*PRO\s*MAX\b/,model:'17 PRO MAX'},{re:/\b17\s*PROMAX\b/,model:'17 PRO MAX'},{re:/\b17\s*MAX\b/,model:'17 PRO MAX'},{re:/\b17\s*PRO\b/,model:'17 PRO'},{re:/\b17\s*AIR\b/,model:'17 AIR'},{re:/\b17E\b/,model:'17E'},{re:/\b17\b/,model:'17'},{re:/\b16\s*PRO\s*MAX\b/,model:'16 PRO MAX'},{re:/\b16\s*PROMAX\b/,model:'16 PRO MAX'},{re:/\b16\s*MAX\b/,model:'16 PRO MAX'},{re:/\b16\s*PRO\b/,model:'16 PRO'},{re:/\b16\s*AIR\b/,model:'16 AIR'},{re:/\b16E\b/,model:'16E'},{re:/\b16\b/,model:'16'},{re:/\b15\s*PRO\s*MAX\b/,model:'15 PRO MAX'},{re:/\b15\s*PRO\b/,model:'15 PRO'},{re:/\b15\b/,model:'15'},{re:/\b14\s*PRO\s*MAX\b/,model:'14 PRO MAX'},{re:/\b14\s*PROMAX\b/,model:'14 PRO MAX'},{re:/\b14\s*PRO\b/,model:'14 PRO'},{re:/\b14\s*PLUS\b/,model:'14 PLUS'},{re:/\b14\b/,model:'14'},{re:/\b13\s*PRO\s*MAX\b/,model:'13 PRO MAX'},{re:/\b13\s*PROMAX\b/,model:'13 PRO MAX'},{re:/\b13\s*PRO\b/,model:'13 PRO'},{re:/\b13\s*MINI\b/,model:'13 MINI'},{re:/\b13\b/,model:'13'},{re:/\b12\s*PRO\s*MAX\b/,model:'12 PRO MAX'},{re:/\b12\s*PROMAX\b/,model:'12 PRO MAX'},{re:/\b12\s*PRO\b/,model:'12 PRO'},{re:/\b12\s*MINI\b/,model:'12 MINI'},{re:/\b12\b/,model:'12'},{re:/\b11\s*PRO\s*MAX\b/,model:'11 PRO MAX'},{re:/\b11\s*PROMAX\b/,model:'11 PRO MAX'},{re:/\b11\s*PRO\b/,model:'11 PRO'},{re:/\b11\b/,model:'11'},{re:/\bSE\b/,model:'SE'}];for(let{re:t,model:n}of models)if(t.test(e))return n;return null}
function ap(e){let t=e.match(/\b(2\s*TB|1\s*TB|512\s*GB|256\s*GB|128\s*GB|64\s*GB)\b/i);if(t){let e=t[1].replace(/\s/g,'').toUpperCase();if(e==='2TB')return'2TB';if(e==='1TB')return'1TB';if(e==='512GB')return'512GB';if(e==='256GB')return'256GB';if(e==='128GB')return'128GB';if(e==='64GB')return'64GB'}let n=e.match(/\b(2048|1024|512|256|128)\b/);if(n){if(n[1]==='2048')return'2TB';if(n[1]==='1024')return'1TB';if(n[1]==='512')return'512GB';if(n[1]==='256')return'256GB';if(n[1]==='128')return'128GB'}return null}
function op(e){
  for(let[t,n]of Object.entries(Zf))if(RegExp('\\b'+t+'\\b','i').test(e))return n
  for(let s of Zs)if(RegExp('\\b'+s.replace(/[-\/]/g,'[-\/]')+'\\b','i').test(e))return s
  return null
}
function sp(e,t){
  if(!e) return null;
  
  // Clean the input by removing prices, model numbers, and extra text
  let cleanInput = e.replace(/\$\d+/g, '').replace(/\d{2,4}GB/gi, '').replace(/\b(17|16|15|14|13|12|11)\s*(PRO|MAX|AIR|PLUS|MINI|E)\b/gi, '').replace(/KOREA|JAPAN|INDIA|HK|HONG\s*KONG/gi, '').trim();
  // Insert space between color name and following digit (e.g. Orange10 -> Orange 10)
  cleanInput = cleanInput.replace(/([A-Za-z]+)(\d+)/g, '$1 $2');
  
  // Try named colors first
  for(let{re,name:n}of npColors)if(re.test(cleanInput))return n;
  
  // Try color mappings
  for(let[r,i]of Object.entries(Qf)){
    let o=r.length<=2?RegExp('(^|\\s|[\\s/])'+r+'(?=\\s|[\\s/]|\\d|$)','i'):RegExp('\\b'+r+'\\b','i');
    if(o.test(cleanInput))return i
  }
  
  // If we have a target model, try to find color after it
  if(t){
    let n=e.toUpperCase(),r=t.toUpperCase(),i=n.indexOf(r);
    if(i!==-1){
      let afterModel=n.slice(i+r.length).replace(/\$\d+/g, '').replace(/\d+шт/g, '').trim();
      // Try to extract just the color word
      let colorMatch=afterModel.match(/\b([A-Z][a-z]+)\b/);
      if(colorMatch){
        let colorWord=colorMatch[1];
        for(let{re,name:n}of npColors)if(re.test(colorWord))return n;
        for(let[r,i]of Object.entries(Qf)){
          let o=RegExp('\\b'+r+'\\b','i');
          if(o.test(colorWord))return i
        }
        return colorWord.charAt(0).toUpperCase()+colorWord.slice(1).toLowerCase();
      }
    }
  }
  
  return null
}
function cp(e,t){
  // First priority: look for "pcs" or "шт" (Russian) keywords
  let pcsM=e.match(/(\d{1,5})\s*(?:pcs?|шт)\b/i);
  if(pcsM)return parseFloat(pcsM[1]);
  
  // Remove all price patterns before processing
  let priceCleaned=e.replace(/\$['']?\d+(?:\.\d+)?/g,'').replace(/@\s*\$?\d+(?:\.\d+)?/g,'').replace(/@[\d.]+/g,'');
  
  if(t){
    let n=priceCleaned.toUpperCase(),r=t.toUpperCase(),i=n.indexOf(r);
    // Try abbreviation if full color name not found
    if(i===-1){
      let abbrevs={WHITE:'WH',BLACK:'BK',BLUE:'BU',ORANGE:'OR',GOLD:'GD',SILVER:'SI',PINK:'PK',PURPLE:'PU',LAVENDER:'LV',SAGE:'GN',GREEN:'GN','LIGHT BLUE':'LA','ROSE GOLD':'GO',BROWN:'BR',CREAM:'CR'}
      let abbr=abbrevs[r]
      if(abbr){let ai=n.indexOf(abbr);if(ai!==-1){let after=n.slice(ai+abbr.length).trim();let arr=after.match(/\b(\d{1,4})\b/g);if(arr&&arr.length>0)return parseFloat(arr[0])}}
    }
    if(i!==-1){
      let afterColor=n.slice(i+r.length).trim();
      let arr=afterColor.match(/\b(\d{1,4})\b/g);
      if(arr&&arr.length>0)return parseFloat(arr[0])
    }
  }
  
  // Fallback: remove storage numbers and model numbers, take last remaining number
  let n=priceCleaned.replace(/\b(2TB|1TB|512GB|256GB|128GB|64GB|2048|1024)\b/gi,'STOR');
  n=n.replace(/\b(17|16|15|14|13|12|11)\s*(PRO|MAX|AIR|PLUS|MINI|E)\b/gi,'MDL');
  n=n.replace(/\bIPHONE(17|16|15|14|13|12|11|SE)\b/gi,'MDL');
  // Remove bare storage numbers (256, 512, 128, 64) that appear BEFORE a color abbreviation
  n=n.replace(/\b(512|256|128|64)\s+(WH|BK|BU|OR|GN|GE|GD|LA|SI|PK|PU|GO|LV|V|BR)\b/gi,'STOR $2');
  let r=n.match(/\b(\d{1,4})\b/g);if(!r)return null;
  let i=r.filter(e=>!['17','16','15','14','13','12','11','SE','256','512','128','64','1024','2048'].includes(e));
  let a=i.length>0?i:r;return parseFloat(a[a.length-1])}
function lp(e){return!ip(e)&&!ap(e)&&!sp(e,null)&&!op(e)&&!/^\d{10,}/.test(e)&&!/^[A-Z]{2,}\/\d+[A-Za-z]?$/.test(e)&&!/\$\d+/.test(e)&&!/^(iMac|MacBook|Apple|AirPod|AirTag|iPad|iWatch)\b/i.test(e)&&e.length>2}



function up(e){let t=e.split('\n'),n=[],r=null,i=null,a=null,o='',s='',lg='',c=-1,l=-1;for(let e of t){let t=e.replace(/\*/g,'').trim();if(!t||/^\d{10,}/.test(t)||/^(iMac|MacBook|Apple\s+(Watch|Pencil|TV)|AirPods?|AirTag|iPad|AirPod)\b/i.test(t))continue;let u=rp(e);if(!u||/^TOTAL\b/.test(u))continue;if(ep.test(u)){r=null;i=null;a=null;continue}
// Mark detection on original line (preserves inner asterisks e.g. **/1LN)
let markOrig=e.match(/^mark\s*[:：\s-]?\s*(.+)$/i);
if(markOrig){
  s=markOrig[1].trim();
  s=s.replace(/^\*(.*)\*$/,'$1').trim();
  if(!s)s=t.trim();
  for(let e=Math.max(0,l);e<n.length;e++)(!n[e].marks||n[e].marks==='NO MARK')&&(n[e].marks=s);
  l=n.length;continue
}
let d=u.match(tp);if(d){s=d[1].trim();for(let e=Math.max(0,l);e<n.length;e++)(!n[e].marks||n[e].marks==='NO MARK')&&(n[e].marks=s);l=n.length;continue}let isMark=fuzzyMatchMarks(u)!==null;if(isMark){s=t.trim();for(let e=Math.max(0,l);e<n.length;e++)(!n[e].marks||n[e].marks==='NO MARK')&&(n[e].marks=s);l=n.length;continue}let firstWord=u.split(' ')[0];let startsWithColor=sp(firstWord,null)!==null;let f=startsWithColor?null:ip(u);if(f&&/\bIPHONE\b/.test(u))f='iPhone '+f;let p=ap(u),m=op(u),h=sp(u,f||r),g=cp(u,h);if(!f&&/[A-Z0-9]{4,}\/[A-Z]+/.test(u))continue;if(!f&&!p&&!m&&!h&&/^[A-Z]{2,}\/\d+[A-Za-z]?$/.test(u)){s=t;for(let e=Math.max(0,l);e<n.length;e++)(!n[e].marks||n[e].marks==='NO MARK')&&(n[e].marks=s);l=n.length;continue}if(!f&&!p&&!m&&!h&&/^[A-Z]{2,}(?:\s+\d{2,}|\d{2,})$/.test(u)){s=t;for(let e=Math.max(0,l);e<n.length;e++)(!n[e].marks||n[e].marks==='NO MARK')&&(n[e].marks=s);l=n.length;continue}if(lp(u)){let raw=t.replace(/(?:\s+(?:ORDER|CO|LTD|LLC|INC|FZCO))+\s*$/i,'').trim();let lm=fuzzyMatchLogistics(raw);let isLog=lm!==raw||LOGISTICS_LIST.some(v=>v.toUpperCase()===raw.toUpperCase());if(isLog){lg=isLog?lm:raw;for(let e=Math.max(0,c);e<n.length;e++)n[e].logistics||(n[e].logistics=lg)}else{let _mv=fuzzyMatchVendor(raw);o=_mv!==raw||VENDOR_LIST.some(v=>v.toUpperCase()===raw.toUpperCase())?_mv:t;for(let e=Math.max(0,c);e<n.length;e++)n[e].vendor||(n[e].vendor=o);c=n.length;r=null;i=null;a=null}continue}if(f&&(r=f),p&&(i=p),m&&(a=m),h&&g!==null){let e=f||r;e&&n.push({model:e,storage:p||i||'',country:m||a||'',color:h,qty:g,vendor:o,marks:s||'NO MARK',logistics:lg||''})}}return{rows:n}}

function fp(e){for(let{re:t,name:n}of npColors)if(t.test(e))return n;return null}
function pp(e){let t=e.replace(/\$[`']?\d+(?:\.\d+)?/g,'').trim(),n=t.match(/^(.+?)\s+(\d+)\s*GB\s+Memory\s+(\d+)\s*(GB|TB)\b/i);if(n)return{model:n[1].trim(),storage:n[2]+'GB/'+n[3]+n[4].toUpperCase()};let r=t.match(/^(.+?)\s+(\d+)\s*GB\s*\/\s*(\d+)\s*(GB|TB)\b/i);if(r)return{model:r[1].trim(),storage:r[2]+'GB/'+r[3]+r[4].toUpperCase()};let i='',a=t,o=t.match(/\b(\d+)\s*(GB|TB)\b/i);return o&&(i=o[1]+o[2].toUpperCase(),a=t.replace(/\b\d+\s*(?:GB|TB)\b/i,'').trim(),a=a.replace(/\s+/g,' ').trim()),{model:a.replace(/[,.]$/,'').trim(),storage:i}}
function mp(e){let t=e.trim();t=t.replace(/\s*\$[`']?\d+(?:\.\d+)?\s*$/,'').trim();let n=null,r=null,i=t,a=t.match(/^([A-Z0-9]+\/[A-Z]+)\s*\(([A-Z0-9]+\/[A-Z]+)\)/i);if(a)n=a[2],r=a[1],i=t.slice(a[0].length).trim();else if(a=t.match(/^([A-Z0-9]+\/[A-Z]+)/i)){n=a[1],i=t.slice(a[0].length).trim();let e=i.match(/^\(([A-Z0-9]+\/[A-Z]+)\)/i);e&&(r=e[1],i=i.replace(e[0],'').trim())}else{let e=t.match(/\(([A-Z0-9]+\/[A-Z]+)\)/i);if(e)n=e[1],i=t.replace(e[0],'').trim().replace(/^[A-Z0-9]+\s+/,'').trim();else{let e=t.match(/([A-Z0-9]+\/[A-Z]+)/i);e&&(n=e[1],i=t.replace(e[0],'').trim())}}if(!n)return null;let o='';/LL\/A$/i.test(n)?o='USA':/HN\/A$/i.test(n)?o='INDIA':r&&/LL\/A$/i.test(r)?o='USA':r&&/HN\/A$/i.test(r)&&(o='INDIA');let s=i.match(/(\d+)\s*-?\s*Pack\s*-?\s*(\d+)/i);if(s)return{code:n,specs:o,color:'WHITE',qty:parseInt(s[2]),parenCode:r};let c=[...i.matchAll(/[-]\s*(\d+)/g)];if(c.length===0){let e=i.trim().length>0?fp(i.trim())||i.trim():'WHITE';return{code:n,specs:o,color:e,qty:1,parenCode:r}}let l=c[c.length-1],u=parseInt(l[1]),d=i.slice(0,l.index).replace(/[-]\s*$/,'').trim();d=d.replace(/\s+(S\/M|M\/L|S|M|L)\s*$/i,'').trim();let f='WHITE';return d.length>0&&(f=fp(d)||d),{code:n,specs:o,color:f,qty:u,parenCode:r}}
function hp(e){let t=e.match(/^([A-Z0-9]+?)(?:LL|HN|LW|AM)\/A$/i);if(t)return t[1].toUpperCase();let n=e.match(/^([A-Z0-9]+?)\/[A-Z]+$/i);return n?n[1].toUpperCase():e.toUpperCase().replace(/\/.*/,'')}
function vp(e){let t=e.split('\n').map(e=>e.trim()).filter(Boolean);if(t.length===0)return false;let n=0,r=0;for(let e of t)(/Memory/.test(e)||/^\$[`']/.test(e.trim())||/^(iMac|MacBook|Apple\s+(Watch|Pencil|TV)|AirPods?|AirTag|iPad)\b/i.test(e))&&n++,/^[A-Z0-9]+\/[A-Z]+/.test(e.trim())&&r++,/\([A-Z0-9]+\/[A-Z]+\)/.test(e.trim())&&r++;return n>=1||r>=1}
function yp(e){let t=e.split('\n').map(e=>e.trim()).filter(Boolean),n=[],r=null,_pendingVendor='',_pendingPhone='';for(let _li=0;_li<t.length;_li++){let e=t[_li];if(/^-{3,}$/.test(e))continue;let productLine=e.replace(/\s*\$[`']?\d+(?:\.\d+)?\s*$/,'').trim();if(/Memory|^(iMac|MacBook|Apple\s+(Watch|Pencil|TV)|AirPods?|AirTag|iPad)\b/i.test(productLine)||/\b\d+\s*(GB|TB)\b.*\b\d+\s*(GB|TB)\b/i.test(productLine)&&!/^[A-Z0-9]+\/[A-Z]+/.test(productLine)){r=pp(e);continue}let _w=wp(e);if(_w){n.push({model:_w.model,storage:_w.storage,country:'',color:_w.color,qty:_w.qty,vendor:'',marks:'',logistics:''});r=null;continue}let t=mp(e);if(!t)continue;let i=hp(t.code);let _row;if(r){gp[i]={model:r.model,storage:r.storage};_row={model:r.model,storage:r.storage,country:t.specs,color:t.color||'',qty:t.qty,vendor:'',marks:'',logistics:''}}else{let e=gp[i]||_p[i]||AW[i];if(!e&&t.parenCode){let n=hp(t.parenCode);e=gp[n]||_p[n]||AW[n]}if(e)_row={model:e.model,storage:e.storage,country:t.specs,color:t.color||'',qty:t.qty,vendor:'',marks:'',logistics:''};else _row={model:'',storage:'',country:t.specs,color:t.color||'',qty:t.qty,vendor:'',marks:'',logistics:''}}let _vm=e.match(/\*([^*\d][^*]*)\*/);if(_vm){let _v=_vm[1].trim();let _mv=typeof fuzzyMatchVendor==='function'?fuzzyMatchVendor(_v):_v;if(_mv&&_mv!==_v)_row.vendor=_mv;else if(VENDOR_LIST.some(function(v){return v.toUpperCase()===_v.toUpperCase()}))_row.vendor=_v;else _row.vendor=_v}if(_row.vendor)_pendingVendor='';let _pm=e.match(/\b(\d{10,})\b/);if(_pm)_pendingPhone=_pm[1];if(_pendingPhone){_row.logistics=_pendingPhone;_pendingPhone=''}n.push(_row)}return{rows:n}}
function bp(e){return[...new Set(e.map(e=>e.trim()).filter(Boolean))].sort()}
function today(){return new Date().toISOString().split('T')[0]}
function formatItemName(m){if(!m)return'';if(/^(Apple|iPhone|iMac|MacBook|iPad|AirPods?|AirTag)/i.test(m))return m;let w=m.split(' '),n=w[0],r=w.slice(1).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');return r?n+' '+r:n}
function formatColor(c){if(!c)return'';let k=c.toUpperCase().replace(/\s+/g,' '),M={'WHITE':'White','BLACK':'Black','BLUE':'Blue','LAVENDER':'Lavender','GREEN':'Sage','GOLD':'Gold','ORANGE':'Orange','PINK':'Pink','PURPLE':'Lavender','SILVER':'Silver','BROWN':'Brown','CREAM':'Cream','TEAL':'Teal','SAGE':'Sage','RED':'Red','ROSE GOLD':'Rose Gold','SPACE BLACK':'Space Black','SPACE GRAY':'Space Gray','SKY BLUE':'Sky Blue','JET BLACK':'Jet Black','STARLIGHT':'Starlight','MIDNIGHT':'Midnight','INDIGO':'Indigo','CITRUS':'Citrus','LIGHT BLUE':'Light Blue','DEEP BLUE':'Deep Blue'};return M[k]||c}
function formatSpecs(c){if(!c)return'';let k=c.toUpperCase().trim(),M={'HONG KONG':'HK','KOREA':'Korea','JAPAN':'Japan','INDIA':'India','USA':'USA','CHINA':'China','EURO':'Euro'};if(k.includes('/')||/^[A-Z]{2,}(?:\s*-\s*[A-Z]+)?$/.test(k))return k;return M[k]||c.split(' ').map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(' ')}

// ===================== APP STATE =====================
const API_BASE='/api'
let transactions=[] // in-memory transactions for the editable table
let buyers=[]
let sellers=[]
let listsLoaded=false
let allSavedTx=[]
let filteredTx=[]
let currentSort={column:'item',direction:'asc'}
let currentPage=1
let balanceHistory=[] // saved transactions mapped for balance calculation
const rowsPerPage=12
let VENDOR_LIST=[`4 ALL GENERAL TARDING LLC`,`ABDUL KADER -EMP`,`Abo Omer`,`ABS GENERAL TRADING`,`Abu Kazakh`,`ACENT-TECK(HK)`,`ACLOUD DIGITAL FZCO`,`AD TRADE INC`,`Adilia Order`,`ADLINA RUSSAIN`,`ADPRESS INTERNATIONAL FZE`,`Advance Cellular`,`AFAF`,`AHMADZAI MUBIN MASCOW`,`Aibad ullah`,`akmaral asfura`,`MELIS LIDER MOBILE`,`BEKARYS`,`SHANIDAR TELECOM`,`ADVANCE WAY TRADING`,`AIDYN`,`BRIGHT BREEZ`,`SEVEN ELECTRIONCS`,`CASH CUSTOMER FARIZ`,`DARKHAN`,`AIKA BB TRADING`,`INONICS`,`AINURKE`,`AIZHAN`,`TAKAFUL TRADING`,`FMS GRAND PHONES`,`AJAOM MOBILE`,`VIGOR PLUS ELECTRONICS`,`STORE999`,`IKLAAS TELECOM`,`GADGET UNIVERSE`,`AKMARAL`,`GUL RAJ TRADING`,`NURBOL`,`VENUS DISTRIBUTORS FZCO`,`TECHNOLINK FZCO`,`RICH TRADING FZCO`,`AKT`,`ROYAL BLUE TRADING`,`CITY CHOICE`,`AL AMIN`,`JABRAIL`,`KINGDOM GROUP FAZCO`,`AL TAREEQ AL SAHEL MOBILE PHONES TRADING LLC`,`Al Thanayyan`,`ILHAM MOSTOVOY KAZAKHSTAN`,`MAC HUB TRADING FZCO`,`WORLDTEL IRAQ`,`GOLDEN VISION MOBILE PHONES`,`ALI  bhai reems (local)`,`ALI KAZAKH`,`MAXUS CORAL`,`ILTON ELECTRONIC`,`ALI TANZANIA`,`SPC MOBILES PHONES`,`SNIPER TRADING`,`HK VISION`,`ALIBEK`,`IK STORE`,`ALIBI FOXTEK KAZAKH`,`TOO MANISSA LLP`,`SKETELL`,`Mr Trade Pte Ltd`,`SQUARE ELECTROINCS FZE`,`ALINA MOSCOW`,`ALISHER`,`ALIYA`,`Alpha Dane`,`Amico telezone`,`AMIR GROUP FZCO`,`ANACO PLUS FZCO`,`ANARBEK`,`LIDEP MOBILE`,`Angel international`,`ANVA GROUP FZCO`,`VSTORE MOSCOW999`,`ULTRAVENTURES TRADING FZCO`,`Arabian Tech`,`ARAI`,`ARMAN`,`ARTHUR`,`ARYA MOBILE`,`ASAR MOBILE`,`Asfura`,`TECH TROVE`,`ATK`,`AVANT DISTRIBUTORS INC.`,`AVO`,`KORNER WORLD`,`AXIOM TELECOM`,`AYAAN IMPEX`,`AZAHRA`,`AZAT`,`AZIZ JAHESH MOBILE`,`AZMAT`,`AZONSHOP`,`BABA EXIM`,`BLUE RHINE OVERSEAS`,`Bahdur`,`HAM CELLULAR LEBANON`,`EASY LINK`,`BAKHTINUR`,`BAYAN`,`BEKA`,`Beksultan`,`BELIM`,`Belim - Return`,`Belim.`,`BELTEL FZE`,`Blessings Telecom`,`BLOOMS`,`Bora`,`Brightcom`,`Buy and sell`,`Cash Customer`,`CASH CUSTOMER (ATTA)`,`CASH CUSTOMER (WASEEM)`,`CASH CUSTOMER LOCAL (RAZA)`,`Cash Customer(HASNAIN)`,`CASH CUSTOMER(HASNAIN)`,`CASH CUSTOMER(RAZA)`,`Cash Purchases`,`Cellever Trading Private limited`,`CELLULAR PARADISE`,`Cellutech`,`CELLWINGS`,`CENTURY EXPORTS LIMITED`,`CLOUD CONNECT MOBILE`,`COMPU CELL GENERAL TRADING LLC`,`Computech Asia Ltd`,`CONSTANTA`,`Credit note`,`CTG`,`DAIRELER`,`DAMELYA`,`DAMIR KAZAKH`,`DAU-Tell(Tokshayeva Leila)`,`DAVRAN`,`DESA`,`Dexiconn`,`DIGITAL MARKET`,`Digitek`,`DILARA`,`DILSHAD ASTANA`,`DILSHAT`,`Dilshod  Burkhanov`,`DK CO.LTD`,`DO TEK`,`Dolphin Global`,`DOT EVNTURES`,`DOT WIRELESS`,`EASTERN TRADE`,`EGOR`,`Electronics Bazar`,`ELNUR`,`ESSATH electronics`,`EVERWISH`,`EXIM`,`FAKHREE ELCTRONICS`,`FARUZ`,`FGF TRADING LLC`,`FIMEX FZCO`,`Flagship Technology`,`FLEXTECH TRADING DWC-LLC`,`FM magnit general trading llc`,`FOXTEK`,`Frostees`,`GADGET UNIVERSE`,`GALIA`,`GANPATI INTERNATIONAL`,`GATE ZONE`,`Gifts`,`GIGA PULSE ELECTRONICS FZCO`,`GLOBAL PRECISION`,`GLOBAL TECH`,`Globelink`,`GOLD ELEGANCE`,`GRABDEALS`,`GRAND VIEW`,`GREAT CALL`,`GSM BAZAAR FZE`,`GUL MIRA`,`HAJI MURAT`,`HANGCHONG TRADING CO`,`HARBOUR LIGHTS`,`HARESH PTE`,`HASSNAIN PAKISTAN`,`Heaveny Group company Limited`,`HI TEL`,`Hope Enterprise`,`IBRAHIM UZBEK`,`Iconnect`,`IKONIC`,`ILYAS`,`Imee`,`INNOVATIVE TECH`,`Intrasteller`,`CLASSIC GOLDEN`,`IRINA`,`ISKANDAR`,`Istyle7`,`TELE FLEX`,`J2 INTERNATIONAL LIMITED`,`Japan Digital`,`Jas Mobile Phones Trading LLC`,`JASMIN(SANIYA)`,`Jubel&kashif`,`Jubilation Sourcing Solutions (Pvt) Ltd`,`junaid al hamd`,`Kaikyou`,`Kamran`,`KANABAR INTERNATIONAL`,`KANAT`,`Kanone-Tech`,`KARA SUU AIKYZ`,`KAYRAT KZ`,`KAZ TRADING`,`KING EASY`,`King Speed`,`Kisha Overseas`,`KTC GROUP`,`LALA-Global`,`LEGEND WHOLESALE`,`LIDER MOBILE BISHKEK`,`LINK PHONES`,`LOCAL`,`LUMINARI`,`MAC Mobile`,`Magnit general trading llc`,`MAHMOOD BANIYAS`,`MAJA`,`MAJA 2`,`MAKHINUR`,`MAKSIM MOSCOW`,`Malmas`,`MANAS`,`Mannat Enterprises fzco`,`Mansour Moscow`,`MARFLEX`,`MARSEL`,`MASTER GADGETS`,`MAXXOLON`,`Metro chitari`,`Mighty One overseas`,`Mike sumi`,`MIKIMORI`,`MILLENNIUM GIFT`,`MINA AL KHALEEJ`,`MIRALI CASH CUSTOMER`,`MM impex`,`Mobile Connection`,`MOBILLKA MOSCOW`,`Mobinics`,`MOLDIR`,`MOVIL IMPEX`,`MR TAQI`,`MUHAMMAD MIRZA`,`MYE TELECOM`,`NEW DGL ELECTRONICS TRADING LLC`,`New Life Co. Ltd`,`NEWLIFE CO.LTD`,`Nexus mobile FZCO`,`Nirav mobile`,`Noor Al Bayan Electronics trading llc`,`NUR SULTAN`,`NURIK`,`NURPEIS`,`OM Group`,`ONTEL`,`Oska`,`parekh group`,`PLANET CELLULAR`,`PPA INTERNATIONAL`,`PRIME TECH`,`PrimeCom Trading DMCC`,`PrimeNet Singapore`,`PRIMETECH`,`Pro Tech`,`RAMIL`,`RINAT ASTANA`,`ROCKET APPLE`,`RocketDrop`,`ROMAN`,`Romex Telecom`,`RUSTAM`,`SABIRJAN`,`SAFI MOBILE ZONE`,`SAI SMART`,`Saigon Tech`,`SANDER RUSSIA`,`Saral Traders`,`SERGEI KARAGANDA`,`SHAVKAT`,`KAKAJI TRADING LLC`,`SHREE MANGALAM`,`SIMESH OVERSEAS FZ-LLC`,`SLM INTERNATIONAL`,`Smart Care General`,`SMART TALK`,`SMZ`,`SOFI`,`SREE MANGALAM GROUP`,`STAR IMPORTS`,`Stremline`,`Sumi international`,`Sun smart`,`SUNLIKE ELECTRONICS`,`Super Vision`,`TAHMINA`,`TALHA BIN SALEEM`,`TAWAKKUL TRADING`,`TEAM COMPANY(AZIZ)`,`TECH PLANET`,`Techbay`,`TECHNEST`,`TECHNOLOGY 52`,`ALI KYRGYZSTAN`,`TECHPARK`,`TELZEN`,`Trade Smart (HK)ltd`,`TURAN ELECTRONICS FZCO`,`TURAN ELECTRONICS MOSCOW`,`UK MOBILE`,`Unikorn Distribution`,`UNIQUE Ventures Trading`,`UNIQUE WIRELESS`,`V9 Gadget LLP`,`ARUN MOSCOW`,`STORE 606`,`VIBRANT ENT`,`VIKTOR`,`VISION WISE ELECTRONICS LLC`,`IRISMO TRADING`,`Vladislav`,`waqas al madani`,`NOVITELL`,`LENAR`,`WELTEL TELECOM FZCO`,`TRADEBAY ELECTRONIC FZCO`,`WORLDWIDE DISTRIBUTION PRODUCTS LNC`,`lunar`,`TRIMETRA MOBILE PHONES TRADING`,`EZONE MOBILE PHONES LLC`,`LUX MOBILE FZCO`,`LUMIX`,`VLINK`,`MOSTOVOY`,`PHONES4YOU`,`FONECOM LLC`,`ROMARIO RUSSIA`,`BRIGHT ZONE`,`X TRADING`,`PARVEZ ALI ELECTRONICS`,`SPC TELECOM`,`THREE HEROS`,`RAM MOBILES PHONES KSA`,`Xfinity`,`YELENA`,`YERBOL KAZAKH`,`ASIA SOZ`,`SMART E ZONE`,`ZAHID KARAGANDA`,`ZARIF`,`SERGEI MOSCOW`,`ZEN NIHON TSUSHO`,`ZHASIK`,`ZHULDYZ`,`ZIANUDDIN TRADING`,`ZOMOR`]
let ITEM_LIST=[`11`,`12`,`13`,`14`,`15`,`16`,`17`,`17 Pro`,`17 Pro Max`,`12 Pro`,`12 Pro Max`,`13 Pro`,`13 Pro Max`,`14 Plus`,`14 Pro`,`14 Pro Max`,`15 Plus`,`15 Pro`,`15 Pro Max`,`16 Plus`,`16 Pro`,`16 Pro Max`,`16E`,`17E`,`17 Air`,`17P256JPBK`,`MAGSAFE BATTERY`,`Honor Magic V5`,`AIR TAG 4`,`Airpod Max Type C`,`Ipad Air M4 Wifi 11"`,`Ipad Air M4 Wifi 13"`,`Airpod Pro 2`,`Airpod pro 2 Type C`,`Airpod Pro 2 Wireless`,`IPAD AIR 5GEN`,`IMAC M4`,`Airpod pro Type C`,`MACBOOK AIR 15" M4`,`Airpod Wireless`,`Airpods`,`AIRPODS 4`,`AirpodS 2`,`AirpodS 2 - Charging Case`,`BUDS PRO 3`,`AirpodS Pro 3`,`AirpodS 3 - Lightening`,`AirpodS 3 Magsafe`,`AirpodS 4`,`AirpodS 4 - ANC`,`AirpodS 4 - Lightening`,`AirpodS Max`,`Airpods wired 2`,`APPLE PENCIL 1`,`APPLE PENCIL 2`,`AIPODS 3`,`APPLE PENCIL Pro`,`APPLE PENCIL USB - C`,`Beats Solo 4`,`Beats Studio pro`,`DYSON AIRWRAP HS05`,`Fold 5`,`Fold 7`,`S24 FE`,`Google Pixel 7`,`Google Pixel 9`,`HONOR 200 PRO`,`HONOR X9 5G`,`IMAC 24 ALL IN ONE M1`,`IMAC 24 ALL IN ONE M3`,`IPAD 11 GEN A16`,`IPAD 11 WI-FI`,`META QUEST`,`IPAD 7 WIFI`,`IPAD A16`,`IPAD Air 6`,`IPAD Air 6 13' WIFI M2`,`IPAD 11 WFI+CELL`,`IPAD AIR 7`,`IPAD AIR 7 11' WIFI`,`IPAD PRO M5 13' WIFI`,`IPAD AIR 7 13' WIFI`,`IPAD AIR 7 11' WIFI - M3`,`IPAD AIR 7 13' WIFI - M3`,`IPAD MINI 6 WIFI`,`IPAD MINI 7`,`IPAD MINI 7 WIFI`,`IPAD PRO M4 WIFI`,`IPAD PRO M5WIFI`,`IPAD-10`,`IPAD-10 WIFI`,`IPAD-11 PRO M4`,`IPAD-11 PRO M2`,`IPAD-11 PRO WIFI`,`IPAD-11 PRO WIFI M2`,`IPAD-11 PRO WIFI M4`,`IPAD-11 WIFI`,`IPAD-12.9 PRO WIFI M1`,`IPAD-12.9 PRO WIFI M2`,`IPAD-13 PRO M4`,`IPAD-13 PRO WIFI`,`IPAD-13 PRO WIFI M4`,`IPAD-6 MINI WIFI`,`IPAD-9`,`IPAD-9 WIFI`,`IPAD-AIR 11 - M2`,`IPAD-AIR 11 - M4`,`IPAD-AIR 11 WIFI`,`IPAD-AIR 11 WIFI - M2`,`IPAD-AIR 13 WIFI`,`IPAD-AIR 5`,`IPAD-AIR 5 WIFI`,`IPAD-AIR 6 M2`,`IPAD-AIR-7 M3`,`IPAD-AIR-M3`,`Iwatch S10`,`Iwatch S10 - Cellular`,`Iwatch S11`,`Iwatch S7 - Cellular`,`Iwatch S7 - GPS`,`Iwatch S8 - Cellular`,`Iwatch S8 - GPS`,`Iwatch S9`,`Iwatch SE`,`Iwatch SE - Cellular`,`Iwatch SE 2`,`Iwatch SE 2023`,`Iwatch SE 2024`,`APPLE TV`,`Iwatch SE 3- GPS`,`Iwatch Ultra 2`,`Iwatch Ultra 3`,`Iwatch Ultra - Cellular`,`MAC MINI`,`MAC STUDIO M4`,`MACBOOK`,`Macbook 13 M1`,`Macbook 13 M2`,`Macbook 13 M3`,`Macbook 13 M4`,`Macbook 15 M1`,`Macbook 15 M2`,`Macbook 15 M3`,`Macbook 15 M4`,`Macbook Air 13 M1`,`Macbook Air 13 M2`,`Macbook Air 13 M3`,`Macbook Air 13 M4`,`Macbook Air 15 M1`,`Macbook Air 15 M2`,`Macbook Air 15 M3`,`Macbook Air 15 M4`,`Macbook Air M1`,`Macbook Air M2`,`Macbook Air M3`,`Macbook Air M4`,`Macbook Pro 13 M1`,`Macbook Pro 13 M2`,`Macbook Pro 13 M3`,`Macbook Pro 13 M4`,`Macbook PRO 14 M1`,`Macbook PRO 14 M2`,`Macbook PRO 14 M3`,`Macbook PRO 14 M4`,`Macbook PRO 16 M1`,`Macbook PRO 16 M2`,`Macbook PRO 16 M3`,`Macbook PRO 16 M4`,`Magic Keyboard 11" M2`,`Magic Keyboard 11" M4`,`Magic Keyboard 12.9"`,`Magic Keyboard 13"`,`Marshall Major IV`,`Marshall Major V`,`Play Station 5 Disc Slim`,`Play Station 5 Portal`,`Play Station 5 Pro`,`S9 - SS`,`SAMSUNG A16`,`STARLINK KIT V4`,`Ultra 1`,`Ultra 2`,`Ultra 2 - 2024`,`Z Flip`]
let MARKS_LIST=[`001`,`27`,`48`,`86`,`551`,`-`,`*/1 B190`,`*/1 B191`,`*/1 B192`,`*/1 B193`,`*/1 B194`,`*/1 B195`,`*/1 B196`,`71-E`,`A-72`,`*/1 B198`,`*/1 B197`,`*/1 B199`,`*/1 F13`,`*/1 F3`,`ASH7-NUR SULTAN`,`*/1 F30`,`*/1 F29`,`*/1 F33`,`*/1 F35`,`KLC-ILH`,`*/1 F36`,`*/1 F40`,`*/1 F4`,`*/1 F10`,`*/1 F42`,`*/1 F48`,`*/1 F14`,`BKR08`,`NUR SULTAN`,`*/1 F43`,`DRH 08`,`*/1 F46`,`*/1 R150`,`*/1 R151`,`*/1 F53`,`*/1 R152`,`*/1 R153`,`*/1 R154`,`XXESU/B191/3-APL`,`*/1 B196`,`*/1 R155`,`*/1 R156`,`*/1 R158`,`SKT-VLAD`,`*/1 R157`,`SCT`,`SKT-DDD`,`AZD TLP01`,`ND02`,`KCL NUR01`,`*/1 R159`,`XXESU/R159/1`,`*/1LN`,`*/3 SL`,`NUR/2`,`NUR/1`,`*/1 SL`,`*/1MM`,`22-555`,`4-A`,`4ina07`,`5-F`,`5-F1`,`KLC-VLAD`,`5-L`,`XXESU/F10/1`,`6-F1`,`8-D`,`9-D`,`A7722`,`JAN07`,`516`,`AAA/AS`,`AASH7 - VLAD`,`AASH7-ANDREY`,`AB/DA/IP`,`ABR`,`ABU ALI 02`,`AC-100`,`ADAM01`,`ADAM-02`,`DSN40`,`Adi07`,`adik/dfm/da`,`ADIK777`,`AH`,`AIBA`,`AID/DA/IP`,`Aido 777`,`AIDO 777NQZ`,`AIDO777`,`AKK777`,`AKTAU 777`,`Alexander Supernova`,`ALH/DA/IP`,`ALH2/DA/IP`,`ALI777`,`ALIAAA`,`ALIBBB`,`ALIBI `,`ALIBI AKTOBE`,`ALIBI ASTANA`,`ALIFFF`,`ALIGGG`,`ALIJJJ`,`ALIMMM`,`ALINNN`,`ALIRRR`,`ALMATY 777`,`ALW02`,`ALW02 ( E )`,`ALW02 ( N )`,`KLC/NUR01`,`ALW02(ADL)`,`AN88`,`AN88`,`ANARBEK-BISHKEK`,`ALW02(KUK)`,`AND 034`,`ANJ07`,`AnnaS.222`,`Anv07`,`AR`,`AR/DAM/IP`,`AR/DF/IP`,`ARAI`,`ARS07`,`ART111`,`ART-777`,`AZA-349`,`AZD 27`,`AZD-DINARA02`,`Azonstore k39`,`AZU 888`,`BAG 09`,`BAG999-01`,`BAHA9`,`BAX07`,`BBB007`,`BBR777`,`BEK 777`,`BEKA 02`,`BEKA02`,`BEKA07`,`BKN01`,`BMW-09`,`BU/DF/IP`,`BUL`,`ccc123`,`CK-88`,`CUBA777`,`DANIK-4`,`DANIK-4`,`DCN828`,`DDD777`,`DLT-777`,`DM001`,`Dn7`,`DSN150`,`DSN165`,`DSN20`,`DSN252`,`DSN26`,`DSN500`,`DV-18`,`DV-349`,`DV-349`,`E-40`,`EE-80`,`EE90`,`ELR222`,`EMA777`,`ER/DA/IP`,`ERA-777`,`ERB/DA/IP`,`ERBO 2`,`ERK/DA/IP`,`ERNI07`,`FARA07`,`FFF-119`,`FFF222`,`FFF-500`,`FFF550`,`FFF551`,`FFF555`,`FFF558`,`FFF559`,`FFF800`,`FFF995`,`FFF-TOMI`,`G01`,`G04`,`G48`,`G55`,`G8`,`GAF`,`GGG`,`GISA777`,`GMR001`,`GOG777`,`GREK07`,`GTF-AB-10`,`GTF-AB-11`,`GTF-AB-12`,`GTF-AB-14`,`GTF-AB-15`,`GTF-AB-4`,`GTF-AB-5`,`GTF-AB-6`,`GTF-AB-7`,`GTF-AB-8`,`GTF-AB-9`,`Gum07`,`H111`,`H5`,`Hacker_nout`,`HHH05`,`HHH51`,`ILH-L/DM/MB`,`ISTORE606`,`JS1`,`K1`,`K1/da/ip`,`KAI777`,`KAR-777`,`KAYRAT KZ`,`KAZ 777`,`KEL`,`KEMA`,`KKK444`,`KKKLLL`,`KOP 777`,`KUBA-777`,`KUBA777NQZ`,`KUL`,`KUTYA01`,`KZL/DA/IP`,`L300`,`L4`,`LEA07`,`LM112`,`M12`,`M15`,`M17`,`M18`,`M29`,`M39`,`M4`,`M41`,`M48`,`M71`,`M888`,`MAJA`,`MANDI`,`MANS333`,`*/1LN IPHONE `,`MAV777`,`MAX`,`MBM07`,`MER777`,`MER-777`,`MERRY777`,`MIX`,`MIX 2`,`MJJJ`,`MKS/DA/IP`,`MM80`,`MMM-777`,`MOB-777`,`MOB777NQZ`,`MOBI-22`,`MR1`,`*/1 F16`,`MUR07`,`NAS-LL4`,`NAS-VVV`,`NIK 777`,`NIK777`,`NIKl`,`NN92`,`NNN777`,`No Mark`,`NOUT.KG`,`NRDL/IP/DAM`,`NUR 07`,`NUR 15`,`NUR ASTANA`,`NUR SHYMKENT`,`NUR/99`,`NUR/99 ASTANA`,`NUR/ALMATY`,`NUR/ALMATY/BEK`,`NUR-09`,`NUR777`,`NUR-777`,`NUR99ASTANA`,`NURIBEK`,`NURS/BEK/ALMATY`,`NURS/BEK/ASTANA`,`NURS777`,`OLJ777`,`omrzv/dam/ipd`,`omrzv/dam/mb`,`OMS777`,`OS07`,`OSKA`,`PASCAL/DM`,`PL-SN/AW/0907`,`PL-SN/IPD/0907`,`PL-SN/MB/0907`,`PL-SN/PEN/0907`,`PSCL`,`PSCL/AW`,`PSCL/DM`,`PSCL/DM/MB`,`PSCL/IPD`,`PSCL/MB`,`RAN`,`Reza07`,`RF/da/ip`,`RIN`,`RIN-777`,`RO#20/10`,`ROMAN`,`RUF01`,`S312`,`S315`,`S320`,`S-72`,`SABR777`,`SAD/DA/IP`,`SANDER`,`SANJ07`,`SBR777`,`SENDER`,`SER 08`,`SER777`,`SERIK 777`,`SH/DF/IP`,`Sha/df/ip`,`SHAH/312S`,`SHAH/312S`,`SHAH/320S`,`SHAH/320S`,`Shah312/222`,`Shah312/S`,`SHAH312S`,`Shah320/S`,`SHAHDIYAR/AZA`,`SAD07`,`Shat/df/acs`,`SHAT/DF/IP16`,`SHAT777`,`SHER02`,`SHER02`,`SHES02`,`BBRAA(ADL)`,`SJJJ`,`SOBR 777`,`KCL/412S`,`SS200`,`SS202`,`SSS777`,`STORE 606`,`SUP07`,`TAKE777`,`TDD 01`,`*/1 SL`,`TDD01`,`TDD-01`,`TOMI`,`72-A`,`TRA/DM`,`TTT`,`TTT - VLAD`,`TTT/320S`,`TTT/S3120`,`TTT/TOMI`,`78-F`,`TTT333S`,`TTT444S`,`TTT-ANDREI`,`TTT-AR`,`TTT-ARAI`,`TTT-AZIZ`,`TTT-istore`,`TTT-LLL4`,`TTT-MAJA`,`TTT-NUR 15`,`TTT-TTT4`,`Tur/bek222`,`Tur/bek222(il)`,`Tur/bek222(super)`,`Tur/bek222(SV)`,`TUR999`,`U01`,`UTA`,`UZYA07`,`VALI/DA/IP`,`VLAD`,`VZ`,`XAB 777`,`XAN 777`,`Y01`,`YAR/DA/IP`,`YERB  1/1`,`ZA/DF/IP`,`ZAHID AKB`,`ZAR-AP`,`ZAR-APM`,`ZAR-AW`,`ZAR-IP`,`ZAR-IPD`,`ZAR-MB`,`ZRF01`,`ZRF-01`]
let LOGISTICS_LIST=[`FM magnit general trading llc`,`GSM BAZAAR FZE`,`Fimex FZCO`,`Action Logistics`,`Airlog solutions fzco`,`AJ Logistics`,`AMJ GLOBAL LOGISTICS`,`APL  LOGISTIC FOR SALES EXPERT`,`APL GLOBAL LOGISTIC LLC`,`APL GLOBAL LOGISTIC LLC FOR RR CARGO`,`APL GLOBAL LOGISTIC LLC FOR SHAVKAT`,`APL GLOBAL LOGISTIC LLC FOR TECHNO GID`,`INTEGRA ONE SOLUTIONS`,`APOLLO logistics`,`BEKNAZAR SHANRAQ CARGO FZCO`,`CAPTAINS FREIGHT SERVICES FZCO`,`Crown Logistics`,`Deepa logistics`,`EMPIRE CARGO`,`EZZY-TECHO GID`,`Flash logistics fzco`,`Flash logistics fzco  EZZY/ TECHNO GID`,`FLC LOGISTICS FZCO`,`GIGA PULSE LOGISTICS`,`GLOBAL TRADE AND FORWARDING FZCO`,`ika logistics`,`Inside Freezone`,`ANKER LOGISTICS`,`EXPRESS LOGISTICS`,`Local`,`ONE SOLUTION `,`EASY WORLD LOGISTICS FZCO`,`LOCAL (RAZA)`,`Logix one fze`,`LUMANARI-I07`,`polar star logistics`,`RR Cargo /APL Logistics`,`Sasco Logistics`,`SHANRAQ CARGO FZCO`,`Shepherd Logistics D07`,`SKYBRIDGE/TECNO GID)SKYBRIDGE FREIGHT SOLUTIONS LLC `,`Turbo Logistics`,`UNION LOGISTICS`,`UNITED FREIGHT NETWORK FZCO`,`UNITEL`,`Universal Logistics`,`VLINK Logistics fzco`,`KEREUN LOGISTICS EZZY-TECHOGID`,`KEREUN LOGISTICS FOR SHAVKAT /SHAHDIYA`,`Yesi logistics`]

let columnFilters={}
function fuzzyMatchLogistics(raw){if(!raw||!raw.trim())return raw;let m=matchItem(raw,LOGISTICS_LIST,LOGISTICS_ALIASES,'Logistics','logistics');if(m)return m;let q=raw.trim().toUpperCase();let ex=LOGISTICS_LIST.find(v=>v.toUpperCase()===q);if(ex)return ex;let qw=q.split(/[\s,;]+/).filter(x=>x.length>2);if(qw.length){let m=LOGISTICS_LIST.filter(v=>{let u=v.toUpperCase();return qw.every(x=>u.includes(x))});if(m.length>=1)return m.sort((a,b)=>a.length-b.length)[0]}let best=null,bestScore=0;for(let v of LOGISTICS_LIST){let u=v.toUpperCase(),vw=u.split(/[\s,;]+/).filter(Boolean),score=0;for(let qx of qw.length?qw:[q]){let ms=vw.reduce((mx,vx)=>{let d=ldist(qx,vx),s=1-d/Math.max(qx.length,vx.length);return s>mx?s:mx},0);score+=ms}score/=(qw.length||1);if(score>bestScore||(score===bestScore&&(!best||v.length<best.length))){bestScore=score;best=v}}if(bestScore>0.49)return best;if(qw.length){let m=LOGISTICS_LIST.filter(v=>{let u=v.toUpperCase(),vw=u.split(/[\s,;]+/).filter(Boolean);return vw.some(vx=>qw.some(qx=>vx.includes(qx)||qx.includes(vx)))});if(m.length>=1)return m.sort((a,b)=>a.length-b.length)[0]}return raw}
function ldist(a,b){let m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=a[i-1]===b[j-1]?d[i-1][j-1]:1+Math.min(d[i-1][j],d[i][j-1],d[i-1][j-1]);return d[m][n]}
// ===================== ENHANCED MATCHING ENGINE =====================
let matchDebug=[];
function nrm(s){if(!s)return'';return s.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim()}
const VENDOR_ALIASES={'hc':'Hangchong Trading Co','hangchong':'Hangchong Trading Co','hang chong':'Hangchong Trading Co','h chong':'Hangchong Trading Co','ali bhai':'ALI  bhai reems (local)','ali reems':'ALI  bhai reems (local)','mac hub':'MAC HUB TRADING FZCO','technolink':'TECHNOLINK FZCO','t technolink':'TECHNOLINK FZCO','rich trading':'RICH TRADING FZCO','golden vision':'GOLDEN VISION MOBILE PHONES','turky':'AL TAREEQ AL SAHEL MOBILE PHONES TRADING LLC','al tareeq':'AL TAREEQ AL SAHEL MOBILE PHONES TRADING LLC','store 999':'STORE999','store999':'STORE999','baba exim':'BABA EXIM','blue rhine':'BLUE RHINE OVERSEAS','easy link':'EASY LINK','hk vision':'HK VISION','prime tech':'PRIME TECH','pro tech':'Pro Tech','smart talk':'SMART TALK','super vision':'Super Vision','tech planet':'TECH PLANET','uk mobile':'UK MOBILE','vibrant ent':'VIBRANT ENT','vision wise':'VISION WISE ELECTRONICS LLC','x trading':'X TRADING','zen nihon':'ZEN NIHON TSUSHO','nova tell':'NOVITELL','phone 4 you':'PHONES4YOU','phone4you':'PHONES4YOU','bright zone':'BRIGHT ZONE','smart e zone':'SMART E ZONE','asia soz':'ASIA SOZ','kakaji':'KAKAJI TRADING LLC','shree mangalam':'SHREE MANGALAM','sree mangalam':'SREE MANGALAM GROUP','star imports':'STAR IMPORTS','sunlike':'SUNLIKE ELECTRONICS','technology 52':'TECHNOLOGY 52','worldtel':'WORLDTEL IRAQ','zarif':'ZARIF','zianuddin':'ZIANUDDIN TRADING','belim':'BELIM','belim return':'Belim - Return','blessings telecom':'Blessings Telecom','cash customer':'Cash Customer','cash customer atta':'CASH CUSTOMER (ATTA)','cash customer waseem':'CASH CUSTOMER (WASEEM)','cellular paradise':'CELLULAR PARADISE','cloud connect':'CLOUD CONNECT MOBILE','compu cell':'COMPU CELL GENERAL TRADING LLC','digital market':'DIGITAL MARKET','digital bazar':'DIGITAL MARKET','eastern trade':'EASTERN TRADE','electronics bazar':'Electronics Bazar','fakhree':'FAKHREE ELCTRONICS','fms':'FMS GRAND PHONES','fms grand':'FMS GRAND PHONES','gate zone':'GATE ZONE','giga pulse':'GIGA PULSE ELECTRONICS FZCO','global tech':'GLOBAL TECH','gul raj':'GUL RAJ TRADING','gul mira':'GUL MIRA','haji murat':'HAJI MURAT','hop enterprise':'Hope Enterprise','iklaas':'IKLAAS TELECOM','ilham':'ILHAM MOSTOVOY KAZAKHSTAN','ilton':'ILTON ELECTRONIC','jabrail':'JABRAIL','kana bar':'KANABAR INTERNATIONAL','king easy':'KING EASY','king speed':'King Speed','kisha':'Kisha Overseas','leader':'LIDER MOBILE BISHKEK','legend wholesale':'LEGEND WHOLESALE','link phones':'LINK PHONES','mac mobile':'MAC Mobile','master gadgets':'MASTER GADGETS','maxxolon':'MAXXOLON','metro chitari':'Metro chitari','mighty one':'Mighty One overseas','min al khaleej':'MINA AL KHALEEJ','my telecom':'MYE TELECOM','nexus mobile':'Nexus mobile FZCO','noor al bayan':'Noor Al Bayan Electronics trading llc','om group':'OM Group','planet cellular':'PLANET CELLULAR','ppa international':'PPA INTERNATIONAL','primecom':'PrimeCom Trading DMCC','primetech':'PRIMETECH','rocket apple':'ROCKET APPLE','rocket drop':'RocketDrop','rome':'Romex Telecom','safi mobile':'SAFI MOBILE ZONE','sai smart':'SAI SMART','saigon tech':'Saigon Tech','saral':'Saral Traders','simesh':'SIMESH OVERSEAS FZ-LLC','smart care':'Smart Care General','smz':'SMZ','sun smart':'Sun smart','tahmina':'TAHMINA','tawakkal':'TAWAKKUL TRADING','techbay':'Techbay','technest':'TECHNEST','telzen':'TELZEN','trade smart':'Trade Smart (HK)ltd','unikorn':'Unikorn Distribution','unique ventures':'UNIQUE Ventures Trading','unique wireless':'UNIQUE WIRELESS','v9 gadget':'V9 Gadget LLP','waqas':'waqas al madani','wel tel':'WELTEL TELECOM FZCO','tradebay':'TRADEBAY ELECTRONIC FZCO','dolphin':'Dolphin Global','flagship':'Flagship Technology','flext':'FLEXTECH TRADING DWC-LLC','mobinics':'Mobinics','movil impex':'MOVIL IMPEX','prime net':'PrimeNet Singapore','jubilation':'Jubilation Sourcing Solutions (Pvt) Ltd','jubel kashif':'Jubel&kashif','kanone':'Kanone-Tech','kayrat':'KAYRAT KZ','kaz trading':'KAZ TRADING','link phones':'LINK PHONES','lider mobile':'LIDER MOBILE BISHKEK','mannat':'Mannat Enterprises fzco','masco':'AHMADZAI MUBIN MASCOW','mobile connection':'Mobile Connection','mobillka':'MOBILLKA MOSCOW','moldir':'MOLDIR','nur sultan':'NUR SULTAN','pixel':'GOOGLE PIXEL 9','samsung':'SAMSUNG'};
const LOGISTICS_ALIASES={'shanraq':'SHANRAQ CARGO FZCO','shanyraq':'SHANRAQ CARGO FZCO','shanyrak':'SHANRAQ CARGO FZCO','shan':'SHANRAQ CARGO FZCO','beknazar':'BEKNAZAR SHANRAQ CARGO FZCO','beknazar shanraq':'BEKNAZAR SHANRAQ CARGO FZCO','apl':'APL GLOBAL LOGISTIC LLC','apl logistic':'APL LOGISTIC FOR SALES EXPERT','apl shavkat':'APL GLOBAL LOGISTIC LLC FOR SHAVKAT','apl rr':'APL GLOBAL LOGISTIC LLC FOR RR CARGO','apl techno':'APL GLOBAL LOGISTIC LLC FOR TECHNO GID','rr cargo':'RR Cargo /APL Logistics','rr':'RR Cargo /APL Logistics','fm magnit':'FM magnit general trading llc','fimex':'FIMEX FZCO','gulf':'EMPIRE CARGO','empire':'EMPIRE CARGO','cargo':'EMPIRE CARGO','action':'Action Logistics','airlog':'Airlog solutions fzco','amj':'AMJ GLOBAL LOGISTICS','apollo':'APOLLO logistics','crown':'Crown Logistics','deepa':'Deepa logistics','ezzy':'EZZY-TECHO GID','flash':'Flash logistics fzco','flash ezzy':'Flash logistics fzco  EZZY/ TECHNO GID','flc':'FLC LOGISTICS FZCO','giga':'GIGA PULSE LOGISTICS','global trade':'GLOBAL TRADE AND FORWARDING FZCO','ika':'ika logistics','anker':'ANKER LOGISTICS','express':'EXPRESS LOGISTICS','easy world':'EASY WORLD LOGISTICS FZCO','local raza':'LOCAL (RAZA)','logix one':'Logix one fze','lumanari':'LUMANARI-I07','polar star':'polar star logistics','sasco':'Sasco Logistics','shepherd':'Shepherd Logistics D07','skybridge':'SKYBRIDGE/TECNO GID)SKYBRIDGE FREIGHT SOLUTIONS LLC','turbo':'Turbo Logistics','union':'UNION LOGISTICS','united freight':'UNITED FREIGHT NETWORK FZCO','unitel':'UNITEL','universal':'Universal Logistics','vlink':'VLINK Logistics fzco','kereun':'KEREUN LOGISTICS EZZY-TECHOGID','kereun shavkat':'KEREUN LOGISTICS FOR SHAVKAT /SHAHDIYA','yesi':'Yesi logistics','integra':'INTEGRA ONE SOLUTIONS','captains':'CAPTAINS FREIGHT SERVICES FZCO','inside':'Inside Freezone','inside freezone':'Inside Freezone'};
const MARKS_ALIASES={};
let _fuseInstances={};
function getFuse(list,key){if(!_fuseInstances[key]){_fuseInstances[key]=new Fuse(list.map((v,i)=>({id:i,name:v})),{keys:['name'],threshold:0.25,includeScore:true,ignoreLocation:true,minMatchCharLength:2})}return _fuseInstances[key]}
function matchItem(raw,list,aliases,listName,fuseKey){
  if(!raw||!raw.trim())return null;
  let normalized=nrm(raw);
  if(!normalized)return null;
  let exact=list.find(v=>nrm(v)===normalized);
  if(exact){matchDebug.push({field:listName,original:raw,matched:exact,type:'Exact',confidence:1});return exact}
  if(aliases[normalized]){matchDebug.push({field:listName,original:raw,matched:aliases[normalized],type:'Alias',confidence:1});return aliases[normalized]}
  if(typeof Fuse!=='undefined'){
    let fuse=getFuse(list,fuseKey);
    let results=fuse.search(normalized);
    if(results.length>0&&results[0].score<=0.25){
      let match=list[results[0].item.id];
      matchDebug.push({field:listName,original:raw,matched:match,type:'Fuzzy',confidence:1-results[0].score});
      return match
    }
  }
  for(let a in aliases){if(normalized===a||normalized.startsWith(a)||a.startsWith(normalized)){matchDebug.push({field:listName,original:raw,matched:aliases[a],type:'Alias',confidence:1});return aliases[a]}}
  matchDebug.push({field:listName,original:raw,matched:null,type:'No Match',confidence:0});
  return null
}
function fuzzyMatchVendor(raw){
  if(!raw||!raw.trim())return raw;
  let m=matchItem(raw,VENDOR_LIST,VENDOR_ALIASES,'Vendor','vendor');
  if(m)return m;
  let q=raw.trim().toUpperCase();let ex=VENDOR_LIST.find(v=>v.toUpperCase()===q);if(ex)return ex;let w=q.split(/\s+/).filter(x=>x.length>2);if(w.length){let m=VENDOR_LIST.filter(v=>{let u=v.toUpperCase();return w.every(x=>u.includes(x))});if(m.length>=1)return m.sort((a,b)=>a.length-b.length)[0]}let best=null,bestScore=0;for(let v of VENDOR_LIST){let u=v.toUpperCase(),vw=u.split(/[\s,;]+/).filter(Boolean),score=0;for(let qx of w.length?w:[q]){let ms=vw.reduce((mx,vx)=>{let d=ldist(qx,vx),s=1-d/Math.max(qx.length,vx.length);return s>mx?s:mx},0);score+=ms}score/=(w.length||1);if(score>bestScore||(score===bestScore&&(!best||v.length<best.length))){bestScore=score;best=v}}if(bestScore>0.49)return best;if(w.length){let m=VENDOR_LIST.filter(v=>{let u=v.toUpperCase(),vw=u.split(/[\s,;]+/).filter(Boolean);return vw.some(vx=>w.some(qx=>vx.includes(qx)||qx.includes(vx)))});if(m.length>=1)return m.sort((a,b)=>a.length-b.length)[0]}return raw}
function fuzzyMatchMarks(raw){
  if(!raw||!raw.trim())return null;
  let m=matchItem(raw,MARKS_LIST,MARKS_ALIASES,'Marks','marks');
  if(m)return m;
  let q=raw.trim().toUpperCase();let ex=MARKS_LIST.find(v=>v.toUpperCase()===q);if(ex)return ex;let w=q.split(/\s+/).filter(x=>x.length>2);if(!w.length)return null;let ml=MARKS_LIST.filter(v=>{let u=v.toUpperCase();return w.every(x=>u.includes(x))});if(ml.length===1)return ml[0];if(ml.length>1)return ml.sort((a,b)=>a.length-b.length)[0];return null}
function fuzzyMatchSpecs(raw){
  if(!raw||!raw.trim())return null
  let list=window.SPECS_LIST||[]
  let q=raw.trim().toUpperCase()
  let ex=list.find(v=>v.toUpperCase()===q)
  if(ex)return ex
  let slashed=list.find(v=>v.toUpperCase().replace(/\//g,'')===q.replace(/\//g,''))
  if(slashed)return slashed
  let wordMatch=list.find(v=>v.toUpperCase().split(/[\s-\/]+/).some(part=>part===q))
  if(wordMatch)return wordMatch
  let contains=list.filter(v=>v.toUpperCase().includes(q))
  if(contains.length===1)return contains[0]
  if(contains.length>1)return contains.sort((a,b)=>a.length-b.length)[0]
  return null}

// ===================== CUSTOM AUTOCOMPLETE ENGINE =====================
;(function(){
  function getACList(type){
    if(type==='vendor'){var vs=VENDOR_LIST.slice();Object.values(VENDOR_ALIASES).forEach(function(v){if(!vs.includes(v))vs.push(v)});Object.keys(VENDOR_ALIASES).forEach(function(k){var uk=k.toUpperCase();if(!vs.includes(uk))vs.push(uk)});return vs}
    if(type==='marks')return MARKS_LIST
    if(type==='logistics'){var ls=LOGISTICS_LIST.slice();Object.values(LOGISTICS_ALIASES).forEach(function(v){if(!ls.includes(v))ls.push(v)});Object.keys(LOGISTICS_ALIASES).forEach(function(k){var uk=k.toUpperCase();if(!ls.includes(uk))ls.push(uk)});return ls}
    if(type==='item')return ITEM_LIST
    if(type==='color')return window.COLOR_LIST&&window.COLOR_LIST.length?window.COLOR_LIST:['Black','Blue','White','Silver','Gold','Orange','Pink','Lavender','Sage','Brown','Cream','Teal','Midnight','Starlight','Indigo','Rose Gold','Space Black','Space Gray','Sky Blue','Light Blue']
    if(type==='specs')return window.SPECS_LIST||['Korea','Japan','India','HK','USA','China']
    if(type==='storage')return ['64GB','128GB','256GB','512GB','1TB','2TB','8GB/256GB','8GB/512GB','16GB/256GB','16GB/512GB','16GB/1TB','24GB/1TB','24GB/2TB']
    return []
  }
  function filterACList(list,query){
    if(!query)return list.slice(0,50)
    var q=query.toLowerCase()
    var exact=[],starts=[],contains=[],fuzzy=[]
    for(var i=0;i<list.length;i++){
      var v=list[i],vl=v.toLowerCase()
      if(vl===q)exact.push(v)
      else if(vl.indexOf(q)===0)starts.push(v)
      else if(vl.indexOf(q)!==-1)contains.push(v)
      else if(q.length>=3){
        var qi=0
        for(var ci=0;ci<vl.length&&qi<q.length;ci++){if(vl[ci]===q[qi])qi++}
        if(qi===q.length)fuzzy.push(v)
      }
    }
    return exact.concat(starts,contains,fuzzy).slice(0,40)
  }
  var acDropdown=null
  function getDropdown(){
    if(!acDropdown){
      acDropdown=document.createElement('div')
      acDropdown.className='ac-dropdown'
      acDropdown.id='globalAcDropdown'
      document.body.appendChild(acDropdown)
    }
    return acDropdown
  }
  var acState={input:null,items:[],activeIdx:-1}
  function showAC(input,items,activeIdx){
    var d=getDropdown()
    acState={input:input,items:items,activeIdx:activeIdx}
    d.innerHTML=''
    items.forEach(function(item,i){
      var el=document.createElement('div')
      el.className='ac-item'+(i===activeIdx?' ac-active':'')
      el.textContent=item
      el.addEventListener('mousedown',function(e){e.preventDefault();acceptAC(item)})
      d.appendChild(el)
    })
    var r=input.getBoundingClientRect()
    d.style.position='fixed'
    d.style.left=r.left+'px'
    d.style.top=r.bottom+'px'
    d.style.minWidth=Math.max(r.width,180)+'px'
    d.classList.add('open')
    if(activeIdx>=0){var a=d.querySelectorAll('.ac-item')[activeIdx];if(a)a.scrollIntoView({block:'nearest'})}
  }
  function hideAC(){
    var d=getDropdown()
    d.classList.remove('open')
    d.innerHTML=''
    acState={input:null,items:[],activeIdx:-1}
  }
  function acceptAC(value){
    var inp=acState.input
    hideAC()
    if(!inp)return
    inp.value=value
    inp.dispatchEvent(new Event('input',{bubbles:true}))
    inp.dispatchEvent(new Event('change',{bubbles:true}))
    // Move to next column
    var td=inp.closest('td')
    if(td){
      var next=td.nextElementSibling
      while(next){var x=next.querySelector('input,select');if(x){x.focus();try{x.select()}catch(e){}; return}next=next.nextElementSibling}
    }
  }
  function refreshAC(input){
    var list=getACList(input.dataset.aclist)
    var items=filterACList(list,input.value)
    if(items.length>0)showAC(input,items,-1)
    else hideAC()
  }
  document.addEventListener('input',function(e){
    var inp=e.target
    if(!inp.classList||!inp.classList.contains('ac-input'))return
    refreshAC(inp)
  },true)
  document.addEventListener('focus',function(e){
    var inp=e.target
    if(!inp.classList||!inp.classList.contains('ac-input'))return
    refreshAC(inp)
  },true)
  document.addEventListener('blur',function(e){
    var inp=e.target
    if(!inp.classList||!inp.classList.contains('ac-input'))return
    setTimeout(function(){
      if(document.activeElement!==inp){
        hideAC()
      }
    },200)
  },true)
  // Intercept keydown for ac-input BEFORE table nav
  document.addEventListener('keydown',function(e){
    var inp=e.target
    if(!inp.classList||!inp.classList.contains('ac-input'))return
    var d=getDropdown()
    var isOpen=d.classList.contains('open')&&acState.input===inp
    if(e.key==='ArrowDown'){
      if(!isOpen){refreshAC(inp);return}
      e.preventDefault();e.stopImmediatePropagation()
      var ni=Math.min(acState.activeIdx+1,acState.items.length-1)
      showAC(inp,acState.items,ni)
      return
    }
    if(e.key==='ArrowUp'){
      if(!isOpen)return
      e.preventDefault();e.stopImmediatePropagation()
      var pi=Math.max(acState.activeIdx-1,-1)
      showAC(inp,acState.items,pi)
      return
    }
    if(e.key==='ArrowRight'){
      if(isOpen&&acState.items.length>0&&acState.activeIdx>=0){
        e.preventDefault();e.stopImmediatePropagation()
        var sel3=acState.items[acState.activeIdx]
        acceptAC(sel3)
        return
      }
      if(isOpen) hideAC()
      return
    }
    if(e.key==='Tab'){
      if(isOpen) hideAC()
      // Allow default Tab behavior to move to next field
      return
    }
    if(e.key==='Enter'){
      if(isOpen&&acState.items.length>0&&acState.activeIdx>=0){
        e.preventDefault();e.stopImmediatePropagation()
        var sel2=acState.items[acState.activeIdx]
        acceptAC(sel2)
        // Move down to next row after accepting
        var inp2=acState.input
        if(inp2){
          var td=inp2.closest('td')
          if(td){
            var tr=td.closest('tr'),tbody=tr.closest('tbody')
            if(tbody){
              var rows=Array.from(tbody.querySelectorAll(':scope > tr'))
              var rowIdx=rows.indexOf(tr),nextRow=rows[rowIdx+1]
              if(nextRow){
                var field=inp2.dataset.field
                var tgt=nextRow.querySelector('[data-field="'+field+'"]')
                if(tgt){tgt.focus();if(tgt.tagName==='INPUT')tgt.select()}
              }
            }
          }
        }
      } else if(isOpen){
        // User pressed Enter with dropdown open but no highlight - accept typed text
        hideAC()
      }
    }
    if(e.key==='Escape'){hideAC();return}
  },true)
  // Close on click outside
  document.addEventListener('mousedown',function(e){
    var d=getDropdown()
    if(!d.contains(e.target)&&(!acState.input||!acState.input.contains(e.target)))hideAC()
    })
    var currencyEl=document.getElementById('pricingCurrency')
    if(currencyEl)currencyEl.addEventListener('change',function(){
      if(currentView==='completed')renderCompletedView()
      else renderPendingView()
    })
  })()
// ===================== END CUSTOM AUTOCOMPLETE =====================
// Keep fuzzyMatchLogistics as-is (already enhanced)
function renderMatchDebug(){
  let el=document.getElementById('matchDebugPanel');
  if(!el)return;
  if(matchDebug.length===0){el.innerHTML='<div style="padding:8px;color:#888;font-size:0.75rem">No match data from last parse.</div>';return}
  let html='<table style="width:100%;border-collapse:collapse;font-size:0.7rem">';
  html+='<tr style="background:var(--th-bg)"><th style="padding:4px 6px;border:1px solid var(--td-border);text-align:left">Field</th><th style="padding:4px 6px;border:1px solid var(--td-border);text-align:left">Original</th><th style="padding:4px 6px;border:1px solid var(--td-border);text-align:left">Matched</th><th style="padding:4px 6px;border:1px solid var(--td-border);text-align:left">Type</th><th style="padding:4px 6px;border:1px solid var(--td-border);text-align:left">Confidence</th></tr>';
  for(let d of matchDebug){
    let color=d.matched?'':'color:#ff3b30;font-weight:600';
    let matchedDisplay=d.matched||'<span style="color:#ff3b30">Review Required</span>';
    let confDisplay=d.type==='No Match'?'—':(d.confidence*100).toFixed(0)+'%';
    let typeColor=d.type==='Exact'?'#30d158':d.type==='Alias'?'#007aff':d.type==='Fuzzy'?'#ff9f0a':'#ff3b30';
    html+=`<tr style="${color}"><td style="padding:3px 6px;border:1px solid var(--td-border)">${d.field}</td><td style="padding:3px 6px;border:1px solid var(--td-border)">${esc(d.original)}</td><td style="padding:3px 6px;border:1px solid var(--td-border)">${matchedDisplay}</td><td style="padding:3px 6px;border:1px solid var(--td-border);color:${typeColor}">${d.type}</td><td style="padding:3px 6px;border:1px solid var(--td-border)">${confDisplay}</td></tr>`
  }
  html+='</table>';
      el.innerHTML=html
      window.refreshCompanyLogos()
    }
function toggleDebug(){
  let panel=document.getElementById('matchDebugPanel');
  let icon=document.getElementById('debugToggleIcon');
  if(!panel||!icon)return;
  let shown=panel.style.display!=='none';
  panel.style.display=shown?'none':'block';
  icon.textContent=shown?'▶':'▼'
}
let FILTER_COLS=['type','customer','marks','item','storage','specs','color','quantity','transaction_status','logistics']
FILTER_COLS.forEach(k=>columnFilters[k]='')

function genId(){return Math.random().toString(36).slice(2)}
function autoStatus(type){return type==='Selling'?'Order In Hand':type==='Buying'?'Buying Received':''}
function emptyRow(){return{id:genId(),date:today(),type:'Selling',vendor:'',marks:'',item:'',storage:'',specs:'',color:'',txnStatus:autoStatus('Selling'),logistics:'',qty:''}}
function emptyBuyingRow(){return{id:genId(),date:today(),type:'Buying',vendor:'',marks:'',item:'',storage:'',specs:'',color:'',txnStatus:autoStatus('Buying'),logistics:'Inside Freezone',qty:''}}
function esc(s){if(!s)return'';return String(s).replace(/[&<>]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m)}
function escAttr(s){if(!s)return'';return String(s).replace(/[&<>"]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m==='"'?'&#34;':m)}
function parseDate(s){if(!s)return null;var p=s.split('-');if(p.length!==3)return null;return new Date(p[2],p[1]-1,p[0])}
function uniqVals(arr,key){
  var set={};arr.forEach(function(t){var v=t[key];if(v!=null&&v!=='')set[v]=true})
  return Object.keys(set).sort()
}
async function aiMatch(text,context){
  if(!text)return''
  try{
    var key=(localStorage.getItem('aiApiKey')||'').trim()
    var provider=(document.getElementById('aiProvider')||{}).value||'groq'
    if(!key)return text
    var prompt='You are a data matching assistant. FIRST check the context for an EXACT match. If exact match found in the list, return that exact value. If no exact match, find the closest match. If nothing relevant, return the original text unchanged. Return ONLY the matched value, no explanation.\n'+context
    if(provider==='groq'){
      var r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'user',content:prompt}],temperature:0.1,max_tokens:50})})
      var d=await r.json()
      return (d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||text).trim()
    }
    if(provider==='deepseek'){
      var r=await fetch('https://api.deepseek.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}],temperature:0.1,max_tokens:50})})
      var d=await r.json()
      return (d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||text).trim()
    }
    if(provider==='gemini'){
      var r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.1,maxOutputTokens:50}})})
      var d=await r.json()
      return (d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0].text||text).trim()
    }
    return text
  }catch(e){return text}
}
async function aiParseText(text,type){
  try{
    var key=(localStorage.getItem('aiApiKey')||'').trim()
    var provider=(document.getElementById('aiProvider')||{}).value||'groq'
    if(!key)return null
    var knownItems=ITEM_LIST.slice(0,60).join(', ')
    var knownVendors=VENDOR_LIST.slice(0,60).join(', ')
    var knownLogistics=LOGISTICS_LIST.slice(0,30).join(', ')
    var prompt='You are a data extraction assistant for a mobile phone inventory system. Parse the message and return ONLY a valid JSON array.\n\nThe message format is typically:\n- A vendor/customer name on its own line (often between * markers like *NAME*)\n- Then product lines with: MODEL STORAGE COUNTRY_CODE COLOR_CODE QTY\n- OR: ITEM_NAME then lines with COLOR $PRICE QTYшт\n- Optional logistics name line (often at end)\n\nExtract ALL fields from the message. A vendor named between *...* on a line by itself is the vendor/customer for ALL products.\n\nRules:\n1. vendor: Find exact match in known vendors list FIRST. If not found, find closest match. If nothing, use text as-is.\n2. logistics: Find exact match in known logistics list FIRST. If not found, find closest match. If nothing, use text as-is.\n3. model: Use exact known item names from known items list. Map abbreviations (e.g. "17PM" -> "17 Pro Max", "17" -> "17", "16PM" -> "16 Pro Max", "17E" -> "17E", "17 Air" -> "17 Air").\n4. storage: Format as e.g. "256GB", "1TB", "128GB". If none found, leave empty.\n5. country: Use these exact codes - "AF/A", "AA/A", "AE/A", "AH/A", "AM/A", "ZA/A", "ZD/A", "ZP/A", "QL/A", "QN/A", "LL/A", "Asia-akasa", "BRAZIL", "AUS", "Canada", "China", "Euro", "HK", "HK/KOREA", "HK - ACT", "HK - NOF", "India", "India - NOF", "indonesia", "Japan", "Korea", "Ksa", "Ksa-tra", "Latin", "MALAYSIAN", "singapore", "singapore - ACT", "Thai", "Tra", "UK", "Usa", "Usa - NOF", "Vietnam", "Vietnam - ACT", "EURO ACTIVE", "Ukraine". Also map: "K" or "KOREA" -> "Korea", "J" or "JAPAN" -> "Japan", "I" or "INDIA" -> "India", "H" or "HK" or "HONG KONG" -> "HK", "U" or "USA" -> "USA", "C" or "CHN" or "CHINA" -> "China"\n6. color: One word. Map common abbreviations (e.g. "Blk" -> "Black", "Wht" -> "White", "Gld" -> "Gold", "Slv" -> "Silver", "Or" -> "Orange").\n7. qty: Number (integer)\n8. marks: Lot/mark number if any in the text.\n\nKnown items: '+knownItems+'\nKnown vendors: '+knownVendors+'\nKnown logistics: '+knownLogistics+'\n\nMessage:\n'+text+'\n\nReturn ONLY a JSON array: [{"model":"...","storage":"...","country":"...","color":"...","qty":N,"vendor":"...","marks":"...","logistics":"..."}]'
    var body={model:'llama-3.3-70b-versatile',messages:[{role:'user',content:prompt}],temperature:0.1,max_tokens:2048}
    var url='https://api.groq.com/openai/v1/chat/completions',headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'}
    if(provider==='deepseek'){url='https://api.deepseek.com/v1/chat/completions';body.model='deepseek-chat';body.max_tokens=2048}
    if(provider==='gemini'){url='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+key;body={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.1,maxOutputTokens:2048}};headers={'Content-Type':'application/json'}}
    var r=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify(body)})
    var d=await r.json()
    var content=''
    if(provider==='gemini'){content=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0].text||'').trim()}
    else{content=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||'').trim()}
    if(!content)return null
    content=content.replace(/```json\s*/gi,'').replace(/```\s*$/,'').trim()
    var parsed=JSON.parse(content)
    if(!Array.isArray(parsed)||!parsed.length)return null
    var rows=parsed.map(function(r){return{model:String(r.model||'').trim(),storage:String(r.storage||'').trim().replace(/\s/g,'').toUpperCase(),country:String(r.country||'').trim(),color:String(r.color||'').trim(),qty:parseInt(r.qty)||1,vendor:String(r.vendor||'').trim(),marks:String(r.marks||'').trim(),logistics:String(r.logistics||'').trim()}}).filter(function(r){return r.model})
    if(!rows.length)return null
    return{rows:rows}
  }catch(e){return null}
}

async function aiFixTypos(text){
  if(!text)return text
  try{
    var toggle=document.getElementById('autoFixTyposToggle')
    if(toggle&&!toggle.checked)return text
    var key=(localStorage.getItem('aiApiKey')||'').trim()
    if(!key)return text
    var provider=(document.getElementById('aiProvider')||{}).value||'groq'
    var items=(typeof ITEM_LIST!=='undefined'?ITEM_LIST:[]).slice(0,80).join(', ')
    var prompt='You are a typo fixer for an inventory message. The user pastes WhatsApp/email messages about phone inventory. Fix common typos:\n- "iphne" → "iPhone", "samsng" → "Samsung", "appel" → "Apple"\n- "kor" or "korea" → "Korea", "japn" → "Japan", "emirates" → "AE"\n- "pro max" formatting → "Pro Max", model numbers like "17pm" → "17 Pro Max"\n- Storage typos: "256gb" → "256GB", "1tb" → "1TB"\n- Color typos: "sivr" → "Silver", "blck" → "Black"\n- DO NOT change the meaning or remove information. ONLY fix spelling/formatting.\n\nKnown items list (correct spellings): '+items+'\n\nReturn ONLY the corrected message text, nothing else. If no typos, return the original text unchanged.\n\nMessage:\n'+text
    var url,headers,body
    if(provider==='groq'){
      url='https://api.groq.com/openai/v1/chat/completions'
      headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'}
      body={model:'llama-3.3-70b-versatile',messages:[{role:'user',content:prompt}],temperature:0.1,max_tokens:500}
    }else if(provider==='deepseek'){
      url='https://api.deepseek.com/v1/chat/completions'
      headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'}
      body={model:'deepseek-chat',messages:[{role:'user',content:prompt}],temperature:0.1,max_tokens:500}
    }else{
      url='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+key
      headers={'Content-Type':'application/json'}
      body={contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.1,maxOutputTokens:500}}
    }
    var r=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify(body)})
    var d=await r.json()
    var fixed=''
    if(provider==='gemini'){fixed=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0].text||'').trim()}
    else{fixed=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||'').trim()}
    if(!fixed)return text
    fixed=fixed.replace(/```[a-z]*\s*/gi,'').replace(/```\s*$/,'').trim()
    if(fixed.length<2||fixed.length>text.length*3)return text
    return fixed
  }catch(e){return text}
}
let aiCache={}
async function aiPostProcess(rows){
  let toggle=document.getElementById('aiToggle')
  if(!toggle||!toggle.checked)return
  if(!rows||!rows.length)return
  let apiKey=(localStorage.getItem('aiApiKey')||'').trim()
  let vendorVals=new Set(),marksVals=new Set(),logiVals=new Set(),specsVals=new Set()
  let specsList=window.SPECS_LIST||[]
  for(let r of rows){
    if(r.vendor&&!VENDOR_LIST.some(v=>v.toUpperCase()===r.vendor.toUpperCase())&&!Object.values(VENDOR_ALIASES||{}).some(v=>v.toUpperCase()===r.vendor.toUpperCase()))
      vendorVals.add(r.vendor)
    if(r.marks&&!MARKS_LIST.some(m=>m.toUpperCase()===r.marks.toUpperCase())&&!/^NO\s*MARK$/i.test(r.marks))
      marksVals.add(r.marks)
    if(r.logistics&&!LOGISTICS_LIST.some(l=>l.toUpperCase()===r.logistics.toUpperCase())&&!Object.values(LOGISTICS_ALIASES||{}).some(v=>v.toUpperCase()===r.logistics.toUpperCase()))
      logiVals.add(r.logistics)
    if(r.country&&!specsList.some(s=>s.toUpperCase()===r.country.toUpperCase()))
      specsVals.add(r.country)
  }
  if(!vendorVals.size&&!marksVals.size&&!logiVals.size&&!specsVals.size)return
  let aiMatched=0
  let tasks=[],taskMap=[]
  if(apiKey){
    for(let v of vendorVals){if(!aiCache['vendor::'+v]){tasks.push(aiMatch(v,'FIRST check if this name EXACTLY matches any vendor in the list. If exact match found, return that. Otherwise find closest match. If nothing relevant, return original. Vendors: '+VENDOR_LIST.join(', ')+'\nName to match: '+v));taskMap.push({type:'vendor',val:v})}}
    for(let v of marksVals){if(!aiCache['marks::'+v]){tasks.push(aiMatch(v,'FIRST check if this marks/lot EXACTLY matches any in the list. If exact match found, return that. Otherwise find closest match. If nothing relevant, return original. Marks list: '+MARKS_LIST.join(', ')+'\nMark to match: '+v));taskMap.push({type:'marks',val:v})}}
    for(let v of logiVals){if(!aiCache['logistics::'+v]){tasks.push(aiMatch(v,'FIRST check if this logistics name EXACTLY matches any in the list. If exact match found, return that. Otherwise find closest match. If nothing relevant, return original. Logistics: '+LOGISTICS_LIST.join(', ')+'\nName to match: '+v));taskMap.push({type:'logistics',val:v})}}
    for(let v of specsVals){if(!aiCache['specs::'+v]){tasks.push(aiMatch(v,'FIRST check if this specs/country EXACTLY matches any in the list. If exact match found, return that. Otherwise find closest match. If nothing relevant, return original. Specs list: '+specsList.join(', ')+'\nSpecs to match: '+v));taskMap.push({type:'specs',val:v})}}
    if(tasks.length){
      showMsg('AI matching '+tasks.length+' field(s)...')
      let results=await Promise.allSettled(tasks)
      for(let i=0;i<results.length;i++){
        if(results[i].status==='fulfilled'&&results[i].value&&results[i].value!==taskMap[i].val){
          aiCache[taskMap[i].type+'::'+taskMap[i].val]=results[i].value
          aiMatched++
        }
      }
    }
  }
  let learned=0
  for(let r of rows){
    let kv='vendor::'+r.vendor
    if(aiCache[kv]){r.vendor=aiCache[kv]}else if(r.vendor&&!VENDOR_LIST.some(v=>v.toUpperCase()===r.vendor.toUpperCase())&&!Object.values(VENDOR_ALIASES||{}).some(v=>v.toUpperCase()===r.vendor.toUpperCase())){
      let m=fuzzyMatchVendor(r.vendor)
      if(m&&m!==r.vendor){r.vendor=m;learned++}
      else{VENDOR_LIST.push(r.vendor);addLearnedItem(r.vendor,'Vendor');learned++}
    }
    let km='marks::'+r.marks
    if(aiCache[km]){r.marks=aiCache[km]}else if(r.marks&&!/^NO\s*MARK$/i.test(r.marks)&&!MARKS_LIST.some(m=>m.toUpperCase()===r.marks.toUpperCase())){
      let m=fuzzyMatchMarks(r.marks)
      if(m&&m!==r.marks){r.marks=m;learned++}
      else{MARKS_LIST.push(r.marks);addLearnedItem(r.marks,'Marks');learned++}
    }
    let kl='logistics::'+r.logistics
    if(aiCache[kl]){r.logistics=aiCache[kl]}else if(r.logistics&&!LOGISTICS_LIST.some(l=>l.toUpperCase()===r.logistics.toUpperCase())&&!Object.values(LOGISTICS_ALIASES||{}).some(v=>v.toUpperCase()===r.logistics.toUpperCase())){
      let m=fuzzyMatchLogistics(r.logistics)
      if(m&&m!==r.logistics){r.logistics=m;learned++}
      else{LOGISTICS_LIST.push(r.logistics);addLearnedItem(r.logistics,'Logistics');learned++}
    }
    let ks='specs::'+r.country
    let specsList=window.SPECS_LIST||[]
    if(aiCache[ks]){r.country=aiCache[ks]}else if(r.country&&!specsList.some(s=>s.toUpperCase()===r.country.toUpperCase())){
      let m=fuzzyMatchSpecs(r.country)
      if(m&&m!==r.country){r.country=m;learned++}
      else{specsList.push(r.country);window.SPECS_LIST=specsList;addLearnedItem(r.country,'Specs');learned++;try{localStorage.setItem('specsList',JSON.stringify(specsList))}catch(e){}}
    }
  }
  if(learned>0){
    dcSave()
    updateLearnedCount()
  }
  renderEditable()
  let msgs=[]
  if(aiMatched)msgs.push('AI matched '+aiMatched+' field(s)')
  if(learned)msgs.push('Learned '+learned+' new value(s)')
  if(msgs.length)showMsg(msgs.join(', '))
}

// ===================== PARSING =====================
function isBalanceFormat(text){
  let lines=text.split('\n').map(l=>l.trim()).filter(Boolean)
  if(lines.length===0)return false
  let starLines=lines.filter(l=>/^\*[^*]+\*$/.test(l))
  if(starLines.length===0)return false
  // First star line must be a product header (starts with digit) - not a vendor name
  if(starLines.length>0 && !/^\*\d/.test(starLines[0]))return false
  return starLines.some(l=>/\b(17|16|15)\b/.test(l)||/\b(\d+\s*(GB|TB))\b/i.test(l))
}

function parseBalanceHeader(header){
  let result={model:'',storage:'',specs:''}
  let h=header
  let sm=h.match(/\b(\d+\s*GB\s*\/\s*\d+\s*(?:GB|TB))\b/i)
  let s1=h.match(/\b(2\s*TB|1\s*TB|512\s*GB|256\s*GB|128\s*GB|64\s*GB)\b/i)
  let storage=s1||sm
  if(storage){result.storage=storage[1].replace(/\s/g,'').toUpperCase();h=h.replace(storage[0],'').trim()}
  let specsMatch=h.match(/\b(JAPAN|KOREA|HONG\s*KONG|INDIA|HK|JP|KR|IN|KH|USA|CHINA|AE)\b/i)
  if(specsMatch){
    let s=specsMatch[1].toUpperCase()
    if(s==='HK')s='HONG KONG';else if(s==='JP')s='JAPAN';else if(s==='KR'||s==='KH')s='KOREA';else if(s==='IN')s='INDIA'
    result.specs=s;h=h.replace(specsMatch[0],'').trim()
  }
  result.model=h.replace(/[-–].*$/,'').replace(/\s+/g,' ').trim()
  if(/^(17|16|15)/i.test(result.model)){let n=ip(result.model);if(n)result.model=n}
  return result
}

function parseBalanceFormat(text,type){
  let lines=text.split('\n'),rows=[],currentHeader=null
  for(let line of lines){
    let t=line.trim()
    if(!t)continue
    let hm=t.match(/^\*([^*]+)\*/)
    if(hm){currentHeader=parseBalanceHeader(hm[1].trim());continue}
    if(!currentHeader)continue
    // Try dash-separated color-qty: COLOR-20, COLOR -20, COLOR - 20, COLOR\t-20
    let dashM=t.match(/^\s*(\w+(?:\s+\w+)?)\s*[-–]\s*(\d+)\s*$/);
    if(dashM){
      let cl=fp(dashM[1])||dashM[1].charAt(0).toUpperCase()+dashM[1].slice(1).toLowerCase();
      rows.push({model:currentHeader.model||'',storage:currentHeader.storage||'',country:currentHeader.specs||'',color:cl,qty:parseInt(dashM[2]),vendor:'',marks:'',logistics:''});
      continue
    }
    let parts
    if(t.includes('\t'))parts=t.split('\t').map(p=>p.trim()).filter(Boolean)
    else parts=t.split(/\s{2,}/).map(p=>p.trim()).filter(Boolean)
    if(!parts||parts.length<2){let sp=t.split(/\s+/);if(sp.length>=2)parts=[sp.slice(0,-1).join(' '),sp[sp.length-1]]}
    if(!parts||parts.length<2)continue
    let colorOrCode=parts.slice(0,parts.length-1).join(' '),qty=Math.abs(parseInt(parts[parts.length-1]))||0
    let cm=colorOrCode.match(/^([A-Z0-9]+)$/),lk=cm?hp(cm[1]):null,lu=lk?(_p[lk]||gp[lk]):null
    if(lu){
      rows.push({model:lu.model,storage:lu.storage,country:currentHeader.specs||'',color:lu.storage?'':colorOrCode,qty:qty,vendor:'',marks:'',logistics:''})
    }else{
      rows.push({model:currentHeader.model||'',storage:currentHeader.storage||'',country:currentHeader.specs||'',color:colorOrCode,qty:qty,vendor:'',marks:'',logistics:''})
    }
  }
  return{rows}
}

function xq(e){
  // Pre-process: if text has * markers but no newlines, split on * to create lines
  if(e.indexOf('\n')===-1 && e.indexOf('*')!==-1){
    // Split on * markers to create proper lines
    // Pattern: text before first * is vendor, *content* is product header, rest is color/qty data
    let parts=e.split('*').filter(p=>p.trim());
    let lines=[];
    for(let i=0;i<parts.length;i++){
      let p=parts[i].trim();
      if(!p)continue;
      // Check if this part looks like a product header (has model+storage+country)
      if(/^\d[\w\s]*?\s+(?:\d+\s*GB|1TB|2TB|512|256|128)\s+\w/i.test(p)){
        lines.push('*'+p+'*');
      }else{
        lines.push(p);
      }
    }
    e=lines.join('\n');
  }
  
  let t=e.split('\n'),n=[],r=null,h=null,u=false,vendorName='';
  
  for(let i=0;i<t.length;i++){
    let l=t[i].trim();
    if(!l){n.push('');continue}
    
    // Check for vendor name at the beginning (before any product headers)
    if(i===0 && !l.startsWith('*') && !l.match(/\d+\s*\//) && !/^\d+\s*(PRO|MAX|AIR|PLUS|MINI|E)?\s/i.test(l) && /[A-Za-z]/.test(l)){
      vendorName=l.replace(/\s*Order\s*$/i,'').trim()
    }
    
    // Auto-wrap product-like lines without * markers (e.g. "Air 512 euro", "17 PRO 256GB KOREA")
    if(!l.startsWith('*')&&!l.match(/^[\d\-:\/\\]+$/)&&!/^TOTAL\b/i.test(l)){
      let pl=l.match(/^(.+?)\s+(\d{1,4}\s*(?:GB|TB))\s+(.+)$/i)||l.match(/^(.+?)\s+(1TB|2TB|512|256|128)\s+([A-Za-z]\S+)$/i);
      if(pl){
        let ctry=pl[3].replace(/[^A-Za-z\s]/g,'').trim();
        if(ctry&&!/^\d+$/.test(ctry)&&ctry.length>=2){
          l='*'+l.trim()+'*';
        }
      }
    }
    
    // Handle product headers like *17 PRO 1TB KOREA*
    let s=l.match(/^\*([^*]+)\*$/);
    if(s){
      if(r&&!u&&h)n.push(h);
      r=null;h=null;u=false;
      let c=s[1].trim(),d=c.match(/^([A-Za-z][\w\s]*?|\d[\w\s]*?)\s+(\d+\s*GB|1TB|2TB|512|256|128)\s+(\w[\w\s]*)$/i);
      if(d){
        let m=d[1].trim().toUpperCase().replace(/\s+/g,''),p=d[2].replace(/\s/g,'').toUpperCase();
        if(m==='AIR')m='17AIR';
        if(/^\d+$/.test(p))p+='GB';
        let g=op(d[3])||d[3].toUpperCase();
        r={model:m,storage:p,country:g,vendor:vendorName};
        h=l
      }else{
        // Vendor line in asterisks (e.g. *KAKAJI TRADING*)
        vendorName=c;
        n.push(l)
      }
      continue
    }
    
    if(r){
      // Handle complex lines with multiple color-quantity pairs and prices (Russian шт)
      // Pattern: "Blue $1640 5шт" or "Silver $1215 20шт" or "Blue $1310 20штSilver $1300 20шт"
      let complexMatches=[...l.matchAll(/([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(?:\$['']?\d+(?:\.\d+)?)?\s*(\d+)\s*(?:шт|pcs?)\b/gi)];
      if(complexMatches.length>0){
        u=true;
        for(let match of complexMatches){
          let color=match[1].trim();
          color=color.replace(/\d+/g,'').replace(/GB|TB|PRO|MAX|KOREA|HK|JAPAN|INDIA/gi,'').trim();
          if(!color)continue;
          let qty=parseInt(match[2]);
          let cl=fp(color)||color.charAt(0).toUpperCase()+color.slice(1).toLowerCase();
          n.push(r.model+' '+r.storage+' '+cl+' '+qty+' '+r.country+' VENDOR:'+r.vendor);
        }
        continue
      }
      
      // Handle lines with price at end and quantity: "$2070Blue 3шт"
      let priceEndMatch=l.match(/\$['']?\d+(?:\.\d+)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(\d+)\s*(?:шт|pcs?)\b/i);
      if(priceEndMatch){
        u=true;
        let color=priceEndMatch[1].trim();
        color=color.replace(/\d+/g,'').replace(/GB|TB|PRO|MAX|KOREA|HK|JAPAN|INDIA/gi,'').trim();
        let qty=parseInt(priceEndMatch[2]);
        let cl=fp(color)||color.charAt(0).toUpperCase()+color.slice(1).toLowerCase();
        n.push(r.model+' '+r.storage+' '+cl+' '+qty+' '+r.country+' VENDOR:'+r.vendor);
        continue
      }
      
      // Handle color-qty with dash separator: COLOR-20, COLOR -20, COLOR - 20, COLOR\t-20
      let dashC=l.match(/^\s*(\w+(?:\s+\w+)?)\s*[-–]\s*(\d+)\s*$/);
      if(!dashC) dashC=l.match(/^\s*(\w+(?:\s+\w+)?)\s*[-–]\s+(\d+)\s*$/);
      if(dashC){
        u=true;
        let cl=fp(dashC[1])||dashC[1].charAt(0).toUpperCase()+dashC[1].slice(1).toLowerCase();
        n.push(r.model+' '+r.storage+' '+cl+' '+dashC[2]+' '+r.country+' VENDOR:'+r.vendor);
        continue
      }
      
      // Original logic for simple color qty patterns (space separated)
      let c=l.match(/^(\w+(?:\s+\w+)?)\s+(\d+)$/);
      if(c){
        u=true;
        let cl=fp(c[1])||c[1].charAt(0).toUpperCase()+c[1].slice(1).toLowerCase();
        n.push(r.model+' '+r.storage+' '+cl+' '+c[2]+' '+r.country+' VENDOR:'+r.vendor);
        continue
      }
      
      if(!u&&h)n.push(h);
      h=null;r=null;u=false
    }
    
    // Handle iPhone patterns with colors and quantities
    if(/^\d/.test(l)&&/[-,]\s*\d+\s*[-–]?\s*\w+/i.test(l)){
      let a=l,y='',v=a.match(/\b([01]\s*[-–]?\s*sim|e\s*sim|esim)\b/i);
      if(v){
        let w=v[1].toLowerCase().replace(/[\s-]/g,'');
        if(w==='esim')y='JAPAN';
        else if(/^1/.test(w))y='HONGKONG';
        a=a.slice(0,v.index).trim()
      }
      let m=[...a.matchAll(/(?:,\s*|\s*-)\s*(\d+)\s*[-–]?\s*(\w+(?:\s+\w+)?)/gi)];
      if(m.length===0){n.push(l);continue}
      let b=a.slice(0,m[0].index).trim(),_=b.match(/^(\d[\w\s]*?)\s+(\d+)$/);
      if(!_){n.push(l);continue}
      let hh=_[1].toUpperCase().replace(/[-\s]/g,''),p=_[2]+'GB';
      for(let q of m){
        let qty=parseInt(q[1]),cl=fp(q[2])||q[2].charAt(0).toUpperCase()+q[2].slice(1).toLowerCase();
        n.push(hh+' '+p+' '+cl+' '+qty+' '+(y||'')+(vendorName?' VENDOR:'+vendorName:''))
      }
      continue
    }
    n.push(l)
  }
  if(r&&!u&&h)n.push(h);
  return n.join('\n')
}

function parseHanchongFormat(text){
  if(!text)return null;
  if(!/IPHONE\d/i.test(text))return null;
  if(!/^[A-Z]{2,3},/m.test(text) && !/\t\d+\s*$/m.test(text))return null;
  let lines=text.split(/\r?\n/).map(e=>e.trim()).filter(Boolean);
  let rows=[];
  let vendor='',phone='';
  let vm=text.match(/\*([^*\d][^*]*)\*/);
  if(vm)vendor=vm[1].trim();
  let ph=text.match(/\b(\d{10,})\b/);
  if(ph)phone=ph[1];
  let abbrColors={BK:'Black',WH:'White',BU:'Blue',OR:'Orange',GN:'Green',PINK:'Pink',LA:'Lavender',YL:'Yellow',RD:'Red',PR:'Purple',GY:'Gray',SIL:'Silver',GD:'Gold',NT:'Natural',TT:'Titanium',SB:'Space Black',SG:'Space Gray',MG:'Midnight',ST:'Starlight',DB:'Deep Blue',LB:'Light Blue',CB:'Cosmic Blue',TBOR:'Orange',TBBU:'Blue',TBWH:'White'};
  let countryMap={KR:'KOREA',KOREA:'KOREA',HK:'HONG KONG',JP:'JAPAN',CN:'CHINA',US:'USA',USA:'USA',UAE:'UAE',IN:'INDIA',KH:'KOREA'};
  for(let line of lines){
    if(/^\*{2,}/.test(line))continue;
    if(/^TOTAL/i.test(line))continue;
    if(/^[A-Za-z]/.test(line) && !/^[A-Z]{2,3},/.test(line))continue;
    let p=line.split(/\s*[\t,]\s*/);
    if(p.length<2)continue;
    let countryRaw=(p[0]||'').toUpperCase().trim();
    let codePart=(p[1]||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    let qty=parseInt(p[2])||1;
    if(!/^\d+$/.test(qty+''))qty=parseInt(line.match(/\t(\d+)\s*$/)?.[1])||parseInt(line.match(/\s(\d+)\s*$/)?.[1])||1;
    let country=countryMap[countryRaw]||countryRaw;
    let iphMatch=codePart.match(/^IPHONE(\d{2})/);
    if(!iphMatch)continue;
    let num=iphMatch[1];
    let afterNum=codePart.slice(('IPHONE'+num).length);
    let suffix='';
    let knownSuffixes=['E','PROMAX','MAX','PRO','AIR','PLUS'];
    let matchedSuffix=null;
    for(let s of knownSuffixes){
      if(afterNum.startsWith(s)){matchedSuffix=s;suffix=s;break}
    }
    if(!matchedSuffix){
      let eMatch=afterNum.match(/^E(?=\d|[A-Z])/);
      if(eMatch){suffix='E';matchedSuffix='E'}
    }
    let rest=afterNum.slice(suffix.length);
    let storageUnit=rest.match(/^(1TB|2TB|512|256|128|64|32|16|8|4|2|1)(GB|TB)?/i);
    let storage='';
    if(storageUnit){
      let numStr=storageUnit[1].toUpperCase();
      let unit=(storageUnit[2]||'GB').toUpperCase();
      if(numStr==='1TB'||numStr==='2TB'){storage='1TB';}
      else{storage=numStr+unit;}
      rest=rest.slice(storageUnit[0].length);
    }
    let colorAbbr=rest;
    let color=abbrColors[colorAbbr]||colorAbbr;
    let itemName='';
    if(suffix==='E')itemName=num+'e';
    else if(suffix==='PROMAX'||suffix==='MAX')itemName=num+' Pro Max';
    else if(suffix==='PRO')itemName=num+' Pro';
    else if(suffix==='AIR')itemName=num+' Air';
    else if(suffix==='PLUS')itemName=num+' Plus';
    else itemName=num;
    if(itemName==='17e'||itemName==='17E')itemName='17e';
    rows.push({model:itemName,storage:storage,country:country,color:color,qty:qty,vendor:vendor,marks:'',logistics:phone});
  }
  if(rows.length===0)return null;
  return {rows:rows};
}

function parseRussianFormat(text){
  if(!/\d+\s*шт/i.test(text))return null;
  
  let raw=text;
  let sections=[];
  let re=/\*([^*]+)\*/g;
  let match;
  let lastEnd=0;
  let firstIdx=raw.indexOf('*');
  let firstPart=firstIdx>0?raw.substring(0,firstIdx).trim():'';
  if(firstPart)sections.push({type:'vendor',text:firstPart});
  
  while((match=re.exec(raw))!==null){
    let dataBeforeHeader=raw.substring(lastEnd,match.index).trim();
    if(dataBeforeHeader&&lastEnd>0)sections.push({type:'data',text:dataBeforeHeader});
    sections.push({type:'header',text:match[1].trim()});
    lastEnd=match.index+match[0].length;
  }
  let trailing=raw.substring(lastEnd).trim();
  if(trailing)sections.push({type:'data',text:trailing});
  
  let rows=[],vendor='',currentModel=null;
  
  for(let sec of sections){
    if(sec.type==='vendor'){
      vendor=sec.text.replace(/\s*Order\s*$/i,'').trim();
      continue;
    }
    if(sec.type==='header'){
      let hdr=sec.text;
      let colorInHeader=hdr.match(/([A-Za-z]+)\s*(\d+)\s*шт/i);
      if(colorInHeader){
        hdr=hdr.substring(0,hdr.indexOf(colorInHeader[0])).replace(/\$\d+/g,'').trim();
      }
      let m=hdr.match(/^(.+?)\s+(2TB|1TB|\d+\s*GB)\s+(.+)$/i);
      if(m){
        currentModel={model:m[1].trim().toUpperCase(),storage:m[2].replace(/\s/g,'').toUpperCase(),country:op(m[3])||m[3].trim().toUpperCase()};
      }
      if(colorInHeader&&currentModel){
        let cl=fp(colorInHeader[1])||colorInHeader[1].charAt(0).toUpperCase()+colorInHeader[1].slice(1).toLowerCase();
        let qty=parseInt(colorInHeader[2]);
        rows.push({model:currentModel.model,storage:currentModel.storage,country:currentModel.country,color:cl,qty:qty,vendor:vendor,marks:'',logistics:''});
      }
      continue;
    }
    if(sec.type==='data'&&currentModel){
      let line=sec.text;
      if(line.includes('*')){
        let subParts=line.split('*');
        for(let sp of subParts){
          sp=sp.trim();
          if(!sp)continue;
          let hdrTest=sp.match(/^(.+?)\s+(2TB|1TB|\d+\s*GB)\s+([A-Z]+)/i);
          if(hdrTest&&!/\d+\s*шт/i.test(sp)){
            currentModel={model:hdrTest[1].trim().toUpperCase(),storage:hdrTest[2].replace(/\s/g,'').toUpperCase(),country:op(hdrTest[3])||hdrTest[3].trim().toUpperCase()};
            continue;
          }
          let pairs=[...sp.matchAll(/([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(?:\$['']?\d+(?:\.\d+)?)?\s*(\d+)\s*шт/gi)];
          for(let p of pairs){
            let color=p[1].trim().replace(/\b(GB|TB|PRO|MAX|KOREA|HK|JAPAN|INDIA)\b/gi,'').trim();
            if(!color)continue;
            let qty=parseInt(p[2]);
            let cl=fp(color)||color.charAt(0).toUpperCase()+color.slice(1).toLowerCase();
            rows.push({model:currentModel.model,storage:currentModel.storage,country:currentModel.country,color:cl,qty:qty,vendor:vendor,marks:'',logistics:''});
          }
        }
      }else{
        let pairs=[...line.matchAll(/([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(?:\$['']?\d+(?:\.\d+)?)?\s*(\d+)\s*шт/gi)];
        for(let p of pairs){
          let color=p[1].trim().replace(/\b(GB|TB|PRO|MAX|KOREA|HK|JAPAN|INDIA)\b/gi,'').trim();
          if(!color)continue;
          let qty=parseInt(p[2]);
          let cl=fp(color)||color.charAt(0).toUpperCase()+color.slice(1).toLowerCase();
          rows.push({model:currentModel.model,storage:currentModel.storage,country:currentModel.country,color:cl,qty:qty,vendor:vendor,marks:'',logistics:''});
        }
      }
    }
  }
  
  if(rows.length===0)return null;
  return{rows:rows};
}

function parseGenericProduct(text){
  // Skip if text contains Apple model codes - let yp() handle those
  if(/[A-Z0-9]{3,}(?:LL|HN|LW|AM)\/A/i.test(text))return null
  // Skip if text contains iPhone models - let up() handle those
  if(/\bIPHONE\b/i.test(text))return null
  if(/\b(17|16|15|14|13|12|11)\s*(pro\s*max|promax|pro|max|air|e)?\s*(256|512|128|64|1TB|2TB)\b/i.test(text)&&!/\b(SAMSUNG|GALAXY|OPPO|VIVO|HUAWEI|XIAOMI)\b/i.test(text))return null
  
  let lines=text.split('\n').map(l=>l.replace(/\t+/g,' ').trim()).filter(Boolean)
  let allRows=[]
  
  let colorNames=['Black','Blue','Brown','Cream','White','Gold','Silver','Orange','Pink','Purple','Red','Green','Lavender','Sage','Teal','Midnight','Starlight','Space Black','Space Gray','Sky Blue','Rose Gold','Indigo','Citrus','Yellow','Coral','Titanium','Gray','Grey']
  let colorPattern=colorNames.map(c=>c.replace(/\s+/g,'\\s+')).join('|')
  
  // Brand prefixes to detect non-iPhone products
  let brandRe=/^(SAMSUNG|GALAXY|OPPO|VIVO|HUAWEI|XIAOMI|REALME|ONEPLUS|GOOGLE\s*PIXEL|HONOR|MARSHALL|SONY|NOKIA|MOTOROLA|TECNO|INFINIX|ITEL|NOTHING|POCO|REDMI|ZTE|LENOVO|ASUS|LG|HTC|MEIZU)/i
  
  for(let line of lines){
    if(/^(ITEM\s*NAME|STORAGE|COLOR|QTY)/i.test(line))continue
    
    let brandMatch=line.match(brandRe)
    if(brandMatch){
      let storageMatch=line.match(/\b(\d+\s*GB|\d+\s*TB)\b/i)
      let storage=storageMatch?storageMatch[1].replace(/\s/g,'').toUpperCase():''
      
      let re=new RegExp('('+colorPattern+')\\s+(\\d+)','gi')
      let matches=[...line.matchAll(re)]
      
      if(matches.length>0){
        let cutIdx=storageMatch?storageMatch.index:matches[0].index
        let productName=line.substring(0,cutIdx).replace(/\s+/g,' ').trim()
        if(!productName)productName=line.substring(0,matches[0].index).replace(/\s+/g,' ').trim()
        
        for(let m of matches){
          let color=m[1].trim()
          let qty=parseInt(m[2])
          if(qty>0){
            allRows.push({model:productName,storage:storage,country:'',color:color,qty:qty,vendor:'',marks:'',logistics:''})
          }
        }
      }
      continue
    }
    
    // Non-brand line with color+qty pairs
    let re=new RegExp('('+colorPattern+')\\s+(\\d+)','gi')
    let matches=[...line.matchAll(re)]
    
    if(matches.length>=1){
      let firstMatchIdx=matches[0].index
      let productName=line.substring(0,firstMatchIdx).replace(/\s+/g,' ').trim()
      
      if(productName&&productName.length>2){
        if(/iphone\b/i.test(productName))continue
        let storageMatch=productName.match(/\b(\d+\s*GB|\d+\s*TB)\b/i)
        let storage=storageMatch?storageMatch[1].replace(/\s/g,'').toUpperCase():''
        if(storageMatch)productName=productName.substring(0,storageMatch.index).trim()
        
        for(let m of matches){
          let color=m[1].trim()
          let qty=parseInt(m[2])
          if(qty>0){
            allRows.push({model:productName,storage:storage,country:'',color:color,qty:qty,vendor:'',marks:'',logistics:''})
      }
    }
  }
  }
  }
  
  if(allRows.length===0)return null
  return{rows:allRows}
}
function dcSave(){
  try{localStorage.setItem('vendor_custom',JSON.stringify(VENDOR_LIST));localStorage.setItem('marks_custom',JSON.stringify(MARKS_LIST.filter(function(m){return m!=='No Mark'})));localStorage.setItem('logistics_custom',JSON.stringify(LOGISTICS_LIST))}catch(e){}
}
function updateLearnedCount(){
  var el=document.getElementById('learnedCount')
  if(el)el.textContent=window._learnedTotal||0
}
function saveLearnedItems(){
  try{localStorage.setItem('learnedItems',JSON.stringify(window._learnedItems||[]))}catch(e){}
}
function loadLearnedItems(){
  try{
    var d=localStorage.getItem('learnedItems')
    if(d){window._learnedItems=JSON.parse(d);window._learnedTotal=window._learnedItems.length}
    else{window._learnedItems=[];window._learnedTotal=0}
  }catch(e){window._learnedItems=[];window._learnedTotal=0}
  updateLearnedCount()
}
function addLearnedItem(item,type){
  if(!window._learnedItems)window._learnedItems=[]
  if(!window._learnedTotal)window._learnedTotal=0
  window._learnedItems.push({item:item,type:type,date:new Date().toLocaleDateString()})
  window._learnedTotal=window._learnedItems.length
  saveLearnedItems()
  updateLearnedCount()
}
function clearLearned(){
  window._learnedItems=[];window._learnedTotal=0;saveLearnedItems()
  updateLearnedCount()
  var el=document.getElementById('learnedItemsDisplay')
  if(el)el.innerHTML='';showMsg('Learned items cleared')
}
function showLearnedItems(){
  var container=document.getElementById('learnedItemsDisplay')
  if(!container)return
  if(!window._learnedItems||!window._learnedItems.length){
    container.innerHTML='<div style="padding:8px;color:#888;font-size:0.7rem">Click PARSE to learn new vendors, marks &amp; logistics automatically.</div>';return
  }
  container.innerHTML=window._learnedItems.map(function(x){
    return '<div style="padding:2px 0;font-size:0.7rem;border-bottom:1px solid #eee">['+x.type+'] '+esc(x.item)+' <span style="color:#999;font-size:0.65rem">'+x.date+'</span></div>'
  }).join('')
}

function parseText(text,type,overrideLogistics,overrideMarks,overrideVendor){
  if(!text.trim())return
  matchDebug=[]
  let result

  // Auto-fix typos using AI (if enabled and key is set)
  if(typeof aiFixTypos==='function'){
    aiFixTypos(text).then(function(fixed){
      if(fixed&&fixed!==text){
        var pt=document.getElementById('mainParseText')
        if(pt)pt.value=fixed
        text=fixed
        if(typeof showMsg==='function')showMsg('Typos auto-fixed')
      }
      doParse(text,type,overrideLogistics,overrideMarks,overrideVendor)
    }).catch(function(){
      doParse(text,type,overrideLogistics,overrideMarks,overrideVendor)
    })
  }else{
    doParse(text,type,overrideLogistics,overrideMarks,overrideVendor)
  }
}

function doParse(text,type,overrideLogistics,overrideMarks,overrideVendor){
  // Try AI parsing first if toggle is enabled
  let aiToggle=document.getElementById('aiToggle')
  if(aiToggle&&aiToggle.checked){
    showMsg('AI parsing...')
    aiParseText(text,type).then(function(aiResult){
      if(aiResult&&aiResult.rows&&aiResult.rows.length>0){
        finishParse(aiResult,text,type,overrideLogistics,overrideMarks,overrideVendor)
      }else{
        showMsg('AI parse returned nothing, using local parser','error')
        localParseAndFinish(text,type,overrideLogistics,overrideMarks,overrideVendor)
      }
    }).catch(function(){
      localParseAndFinish(text,type,overrideLogistics,overrideMarks,overrideVendor)
    })
    return
  }
  localParseAndFinish(text,type,overrideLogistics,overrideMarks,overrideVendor)
}
function localParseAndFinish(text,type,overrideLogistics,overrideMarks,overrideVendor){
  // Pre-process: if single line with model codes, add newlines
  if(text.indexOf('\n')===-1 && /[A-Z0-9]{4,}\/[A-Z]+/.test(text)){
    text=text.replace(/(MacBook|iPad|Apple\s*Watch|Watch\s+(?:SE|Ultra)\s*\d*\s*\d*\s*\w*|AirPod|AirTag|iMac)/gi,'\n$1')
    text=text.replace(/(\d+(?:MM|mm)?)\s*([A-Z]{1,2}[A-Z0-9]{2,5}(?:LL|HN|LW|AM)\/A)/g,'$1\n$2')
    text=text.replace(/([^A-Z\n])([A-Z]{1,2}[A-Z0-9]{2,5}(?:LL|HN|LW|AM)\/A)/g,'$1\n$2')
  }
  let result=parseHanchongFormat(text)
  if(!result)result=parseRussianFormat(text)
  if(!result)result=parseGenericProduct(text)
  if(!result){
    if(isBalanceFormat(text)){
      result=parseBalanceFormat(text,type)
    }else{
      text=xq(text)
      let lines=text.split('\n')
      let iphoneLines=[],otherLines=[],inOtherSection=false
      for(let l of lines){
        let lt=l.trim()
        if(/^\*(MACBOOK|APPLE\s*WATCH|IPAD|AIRPOD|AIRTAG|IMAC)/i.test(lt)){inOtherSection=true}
        if(inOtherSection||/Memory|^[A-Z0-9]+\/[A-Z]+/i.test(lt)||/\([A-Z0-9]+\/[A-Z]+\)/i.test(lt)){
          otherLines.push(l)
        }else{
          iphoneLines.push(l)
        }
      }
      let allRows=[]
      if(otherLines.length>0){
        let otherText=otherLines.join('\n')
        if(vp(otherText)){
          let rYp=yp(otherText)
          if(rYp&&rYp.rows&&rYp.rows.length>0)allRows=allRows.concat(rYp.rows)
        }
      }
      if(iphoneLines.length>0){
        let iphoneText=iphoneLines.join('\n')
        let rUp=up(iphoneText)
        if(rUp&&rUp.rows&&rUp.rows.length>0)allRows=allRows.concat(rUp.rows)
      }
      if(allRows.length>0){
        result={rows:allRows}
      }else{
        let rYp=vp(text)?yp(text):null
        if(rYp&&rYp.rows&&rYp.rows.length>0){
          result=rYp
        }else{
          let rUp=up(text)
          if(rUp&&rUp.rows&&rUp.rows.length>0)result=rUp
        }
      }
    }
  }
  if(!result||!result.rows||result.rows.length===0){
    showMsg('No rows found in text','error');return
  }
  finishParse(result,text,type,overrideLogistics,overrideMarks,overrideVendor)
}
function finishParse(result,text,type,overrideLogistics,overrideMarks,overrideVendor){
  // Rule: if message contains "eSIM" or "esim", force specs to Japan
  let isEsim=/\besim\b/i.test(text||'')
  let mapped=result.rows.map(r=>{
    let item=formatItemName(r.model)
    let color=formatColor(r.color)
    // Pro/ProMax: White → Silver
    if(/PRO|MAX/i.test(item)&&/^white$/i.test(color))color='Silver'
    let specsVal=r.country?formatSpecs(r.country):''
    if(isEsim)specsVal='Japan'
    return {
      id:genId(),date:today(),type:type,
      vendor:overrideVendor||r.vendor||'',marks:overrideMarks||r.marks||'',item:item,
      storage:r.storage,specs:specsVal,
      color:color,qty:String(r.qty),txnStatus:autoStatus(type),logistics:overrideLogistics||(type==='Buying'?'Inside Freezone':'')||r.logistics||''
    }
  })
  // Validate sells against balance stock
  if(type==='Selling'){
    let warnings=[]
    mapped.forEach(r=>{
      let {stock}=getStockForItem(r.item,r.storage,r.specs,r.color)
      let sellQty=parseInt(r.qty)||0
      if(stock<sellQty)warnings.push(r.item+' '+r.storage+' '+r.color+': selling '+sellQty+' but stock only '+Math.max(0,stock))
    })
    if(warnings.length){
      showMsg(warnings.length+' sell item(s) exceed balance stock!','error')
      warnings.slice(0,5).forEach(w=>showMsg(w,'error'))
    }
  }
  if(transactions.length===1&&!transactions[0].item&&!transactions[0].vendor&&!transactions[0].qty)
    transactions=mapped
  else
    transactions=[...transactions,...mapped]
  renderEditable()
  renderMatchDebug()
  try{refreshAllSections()}catch(e){}
  // AI post-process unmatched vendor/marks/logistics
  aiPostProcess(mapped)
  var pt=document.getElementById('mainParseText');if(pt)pt.value=''
}

function loadLists(){
  let mainText=document.getElementById('mainParseText')?document.getElementById('mainParseText').value:''
  let re=/^(buyer|customer|vendor|seller|saller|list|name|#|\d|\/)/i
  let hasModel=e=>/[/\t]/.test(e)||/\b(17|16|15)\b/.test(e)
  let b=mainText.split(/\n|,/).map(e=>e.trim()).filter(n=>n.length>1&&!re.test(n)&&!hasModel(n))
  buyers=bp(b)
  sellers=[]
  listsLoaded=true
  document.getElementById('listsStatus').textContent=buyers.length+' names loaded'
  renderEditable()
}

function lookupLogisticsByCustomer(customer){
  if(!customer||!customer.trim())return''
  var up=customer.trim().toUpperCase()
  // 1. Check current transactions
  for(var t of transactions){
    if(t.vendor&&t.vendor.toUpperCase()===up&&t.logistics)return t.logistics
  }
  // 2. Check saved transactions
  try{
    var saved=allSavedTx||[]
    for(var s of saved){
      if(s.customer_vendor&&s.customer_vendor.toUpperCase()===up&&s.logistics)return s.logistics
    }
  }catch(e){}
  // 3. Check pricing pending data
  try{
    var pp=JSON.parse(localStorage.getItem('pricingPending')||'[]')
    for(var p of pp){
      if(p.customer&&p.customer.toUpperCase()===up&&p.logistics)return p.logistics
    }
  }catch(e){}
  return''
}
// ===================== RENDER =====================
function renderEditable(){
  const tbody=document.getElementById('editableBody')
  if(transactions.length===0){
    tbody.innerHTML='<tr><td colspan="10" style="text-align:center;padding:20px;color:#888;font-size:0.8rem">No transactions. Paste inventory and click PARSE above.</td></tr>'
    document.getElementById('rowCount').textContent='0'
    renderBalance()
    return
  }
  let html=''
  transactions.forEach((r,i)=>{
    let typeOpts=['Selling','Buying','Opening','Return','Transfer'].map(t=>`<option value="${t}"${r.type===t?' selected':''}>${t}</option>`).join('')
    var storageList=window.STORAGE_LIST||['64GB','128GB','256GB','512GB','1TB','2TB','8GB/256GB','8GB/512GB','16GB/256GB','16GB/512GB','16GB/1TB','24GB/1TB','24GB/2TB']
    let storageOpts='<option value="">--</option>'+storageList.map(function(t){return '<option value="'+t+'"'+(r.storage===t?' selected':'')+'>'+t+'</option>'}).join('')
    let txnStatusOpts=['','Opening','Buying in Transit','Buying Received','Order In Hand','Order Dispatched','Stock Landed'].map(t=>`<option value="${t}"${r.txnStatus===t?' selected':''}>${t||'--'}</option>`).join('')
    html+=`<tr>
<td><input type="date" value="${r.date}" data-idx="${i}" data-field="date"></td>
<td><select data-idx="${i}" data-field="type">${typeOpts}</select></td>
<td><input type="text" value="${esc(r.vendor)}" placeholder="Vendor..." data-idx="${i}" data-field="vendor" class="ac-input" data-aclist="vendor" autocomplete="off"></td>
<td><input type="text" value="${esc(r.marks)}" placeholder="Mark..." data-idx="${i}" data-field="marks" class="ac-input" data-aclist="marks" autocomplete="off"></td>
<td><input type="text" value="${esc(r.item)}" placeholder="17 PRO MAX..." data-idx="${i}" data-field="item" class="ac-input" data-aclist="item" autocomplete="off"></td>
<td><select data-idx="${i}" data-field="storage">${storageOpts}</select></td>
<td><input type="text" value="${esc(r.specs)}" placeholder="KR / JAPAN..." data-idx="${i}" data-field="specs" class="ac-input" data-aclist="specs" autocomplete="off"></td>
<td><input type="text" value="${esc(r.color)}" placeholder="Silver..." data-idx="${i}" data-field="color" class="ac-input" data-aclist="color" autocomplete="off"></td>
<td><input type="number" value="${r.qty}" placeholder="0" style="width:80px" data-idx="${i}" data-field="qty"></td>
<td><select data-idx="${i}" data-field="txnStatus">${txnStatusOpts}</select></td>
<td><input type="text" value="${esc(r.logistics)}" placeholder="Logistics..." data-idx="${i}" data-field="logistics" class="ac-input" data-aclist="logistics" autocomplete="off"></td>
<td style="text-align:center"><button class="delete-btn" data-idx="${i}" title="Delete">✕</button></td>
</tr>`
  })
  tbody.innerHTML=html
  // Update datalists with latest data
  let vdl=document.getElementById('vendorDatalist')
  if(!vdl){vdl=document.createElement('datalist');vdl.id='vendorDatalist';document.body.appendChild(vdl)}
  vdl.innerHTML=VENDOR_LIST.map(v=>`<option value="${esc(v)}">`).join('')
  let mdl=document.getElementById('marksDatalist')
  if(!mdl){mdl=document.createElement('datalist');mdl.id='marksDatalist';document.body.appendChild(mdl)}
  mdl.innerHTML=MARKS_LIST.map(m=>`<option value="${esc(m)}">`).join('')
  let ldl=document.getElementById('logisticsDatalist')
  if(!ldl){ldl=document.createElement('datalist');ldl.id='logisticsDatalist';document.body.appendChild(ldl)}
  ldl.innerHTML=LOGISTICS_LIST.map(l=>`<option value="${esc(l)}">`).join('')
  let idl=document.getElementById('itemDatalist')
  if(!idl){idl=document.createElement('datalist');idl.id='itemDatalist';document.body.appendChild(idl)}
  idl.innerHTML=ITEM_LIST.map(i=>`<option value="${esc(i)}">`).join('')
  let cdl=document.getElementById('colorDatalist')
  if(!cdl){cdl=document.createElement('datalist');cdl.id='colorDatalist';document.body.appendChild(cdl)}
  cdl.innerHTML=(window.COLOR_LIST||['Black','Blue','White','Silver','Gold','Orange','Pink','Lavender','Sage','Brown','Cream','Teal','Midnight','Starlight','Indigo','Rose Gold','Space Black','Space Gray','Sky Blue','Light Blue']).map(c=>`<option value="${esc(c)}">`).join('')
  let stl=document.getElementById('storageDatalist')
  if(!stl){stl=document.createElement('datalist');stl.id='storageDatalist';document.body.appendChild(stl)}
  stl.innerHTML=(window.STORAGE_LIST||['64GB','128GB','256GB','512GB','1TB','2TB','8GB/256GB','8GB/512GB','16GB/256GB','16GB/512GB','16GB/1TB','24GB/1TB','24GB/2TB']).map(s=>`<option value="${s}">`).join('')
  let sdl=document.getElementById('specsDatalist')
  if(!sdl){sdl=document.createElement('datalist');sdl.id='specsDatalist';document.body.appendChild(sdl)}
  sdl.innerHTML=(window.SPECS_LIST||[]).map(s=>`<option value="${esc(s)}">`).join('')
  document.getElementById('rowCount').textContent=transactions.length
  let el=document.getElementById('totalQtyDisplay');if(el)el.textContent=transactions.reduce((s,r)=>s+(parseInt(r.qty)||0),0)
  // attach events
  tbody.querySelectorAll('input,select').forEach(el=>{
    function rowUpdateHandler(){
      let idx=parseInt(this.dataset.idx)
      let field=this.dataset.field
      transactions[idx][field]=this.value
      let autoFill=document.getElementById('autoFillToggle')
      let fillAll=autoFill&&autoFill.checked
      // auto-set txnStatus when type changes
      if(field==='type'){
        let st=autoStatus(this.value)
        transactions[idx].txnStatus=st
        let sel=tbody.querySelector(`select[data-idx="${idx}"][data-field="txnStatus"]`)
        if(sel)sel.value=st
        // Buying → Inside Freezone logistics
        if(this.value==='Buying'&&!transactions[idx].logistics){
          transactions[idx].logistics='Inside Freezone'
          let logiInp=tbody.querySelector(`input[data-idx="${idx}"][data-field="logistics"]`)
          if(logiInp)logiInp.value='Inside Freezone'
        }
      }
      // auto-fill all marks columns
      if(field==='marks'&&this.value&&fillAll){
        tbody.querySelectorAll('input[data-field="marks"]').forEach(inp=>{
          let i=parseInt(inp.dataset.idx)
          inp.value=this.value;transactions[i].marks=this.value
        })
      }
      // auto-fill all vendor columns
      if(field==='vendor'&&this.value&&fillAll){
        tbody.querySelectorAll('input[data-field="vendor"]').forEach(inp=>{
          let i=parseInt(inp.dataset.idx)
          inp.value=this.value;transactions[i].vendor=this.value
        })
      }
      // auto-fill logistics from vendor/customer
      if(field==='vendor'&&this.value){
        var knownLogi=lookupLogisticsByCustomer(this.value)
        if(knownLogi){
          transactions[idx].logistics=knownLogi
          var logiInp=tbody.querySelector('input[data-idx="'+idx+'"][data-field="logistics"]')
          if(logiInp)logiInp.value=knownLogi
        }
      }
      // auto-fill all txnStatus columns
      if(field==='txnStatus'&&this.value){
        tbody.querySelectorAll('select[data-field="txnStatus"]').forEach(inp=>{
          let i=parseInt(inp.dataset.idx)
          if(!transactions[i].txnStatus){inp.value=this.value;transactions[i].txnStatus=this.value}
        })
      }
      // auto-fill all logistics columns
      if(field==='logistics'&&this.value&&fillAll){
        tbody.querySelectorAll('input[data-field="logistics"]').forEach(inp=>{
          let i=parseInt(inp.dataset.idx)
          inp.value=this.value;transactions[i].logistics=this.value
        })
      }
      // fuzzy-match vendor/marks/logistics to canonical name (internal only, input not replaced here)
      if((field==='vendor'||field==='marks'||field==='logistics')&&this.value){
        var matched=null
        if(field==='logistics')matched=fuzzyMatchLogistics(this.value)
        else if(field==='vendor')matched=fuzzyMatchVendor(this.value)
        else if(field==='marks')matched=fuzzyMatchMarks(this.value)
        if(matched&&matched!==this.value){
          transactions[idx][field]=matched
        }
      }
      renderBalance()
      // Update total qty display
      let tqEl=document.getElementById('totalQtyDisplay')
      if(tqEl)tqEl.textContent=transactions.reduce((s,r)=>s+(parseInt(r.qty)||0),0)
    }
    el.addEventListener('change',rowUpdateHandler)
    el.addEventListener('input',rowUpdateHandler)
  })
  // Blur validation & auto-correct: only allow values from dropdown lists
  var _blurFields='input[data-field="vendor"],input[data-field="marks"],input[data-field="logistics"],input[data-field="item"],input[data-field="color"],input[data-field="specs"]'
  tbody.querySelectorAll(_blurFields).forEach(function(el){
    el.addEventListener('blur',function(){
      var idx=parseInt(this.dataset.idx)
      var field=this.dataset.field
      if(!this.value)return
      var q=this.value.trim()
      var list=null
      if(field==='vendor')list=VENDOR_LIST
      else if(field==='marks')list=MARKS_LIST
      else if(field==='logistics')list=LOGISTICS_LIST
      else if(field==='item')list=ITEM_LIST
      else if(field==='color')list=window.COLOR_LIST||['Black','Blue','White','Silver','Gold','Orange','Pink','Lavender','Sage','Brown','Cream','Teal','Midnight','Starlight','Indigo','Rose Gold','Space Black','Space Gray','Sky Blue','Light Blue']
      else if(field==='specs')list=window.SPECS_LIST||['Korea','Japan','India','HK','USA','China']
      if(!list)return
      var qu=q.toUpperCase()
      var ex=list.find(function(v){return v.toUpperCase()===qu})
      if(ex){
        if(ex!==q){transactions[idx][field]=ex;this.value=ex}
        return
      }
      var matched=null
      if(field==='vendor')matched=fuzzyMatchVendor(q)
      else if(field==='marks')matched=fuzzyMatchMarks(q)
      else if(field==='logistics')matched=fuzzyMatchLogistics(q)
      else if(field==='specs')matched=fuzzyMatchSpecs(q)
      if(matched&&matched!==q&&matched!==null){
        transactions[idx][field]=matched;this.value=matched;return
      }
      showMsg('Invalid '+field+': "'+q+'" not in list','error')
      this.value='';transactions[idx][field]=''
    })
  })
  tbody.querySelectorAll('.delete-btn').forEach(btn=>{
    btn.addEventListener('click',function(){
      let idx=parseInt(this.dataset.idx)
      transactions.splice(idx,1)
      if(transactions.length===0)transactions.push(emptyRow())
      renderEditable()
    })
  })
  // Enter key in vendor field → save + next row vendor
  tbody.querySelectorAll('input[data-field="vendor"]').forEach(el=>{
    el.addEventListener('keydown',function(e){
      if(e.key!=='Enter')return
      e.preventDefault()
      let idx=parseInt(this.dataset.idx)
      let field=this.dataset.field
      transactions[idx][field]=this.value
      // auto-fill all empty vendor columns
      tbody.querySelectorAll('input[data-field="vendor"],select[data-field="vendor"]').forEach(inp=>{
        let i=parseInt(inp.dataset.idx)
        if(i!==idx&&!transactions[i].vendor){inp.value=this.value;transactions[i].vendor=this.value}
      })
      renderBalance()
      let nextIdx=idx+1
      if(nextIdx>=transactions.length){transactions.push(emptyRow());renderEditable();return}
      let nextVendor=document.querySelector(`input[data-idx="${nextIdx}"][data-field="vendor"]`)
      if(nextVendor)nextVendor.focus()
    })
  })
  renderBalance()
}

function allBalanceItems(){
  return (allSavedTx || []).map(function(t){
    return {id:t.id, date:t.date, item:String(t.item_name||''), storage:String(t.storage||''), specs:String(t.specs||''), color:String(t.color||''), qty:t.quantity, type:t.transaction_type}
  })
}

function getStockForItem(item,storage,specs,color,excludeId){
  let key=((item||'')+'|'+(storage||'')+'|'+(specs||'')+'|'+(color||'')).toLowerCase()
  let stock=0
  allBalanceItems().forEach(r=>{
    if(r.id===excludeId)return
    let k=((r.item||'')+'|'+(r.storage||'')+'|'+(r.specs||'')+'|'+(r.color||'')).toLowerCase()
    if(k!==key)return
    let q=parseInt(r.qty)||0
    if(r.type==='Opening'||r.type==='Buying')stock+=q
    else if(r.type==='Selling')stock-=q
  })
  return {stock,key}
}

const SPECS_ORDER=['JAPAN','KOREA','HONG KONG','HK','INDIA','EUROPE','EU','CHINA','USA','UAE','OTHER'];
function specsRank(s){
  let k=String(s==null?'':s).toUpperCase().trim();
  if(k==='JAPAN'||k==='JP')return 0;
  if(k==='KOREA'||k==='KR'||k==='KOR')return 1;
  if(k==='HONG KONG'||k==='HK')return 2;
  if(k==='INDIA'||k==='IN')return 3;
  if(k==='EUROPE'||k==='EU')return 4;
  if(k==='CHINA'||k==='CN')return 5;
  if(k==='USA'||k==='US')return 6;
  if(k==='UAE'||k==='AE')return 7;
  return 99;
}
function storageRank(s){
  let k=String(s==null?'':s).toUpperCase().trim();
  let m=k.match(/^(\d+)(GB|TB)$/);
  if(!m)return 9999;
  let num=parseInt(m[1],10);
  let unit=m[2];
  if(unit==='TB')return 1000+num;
  return num;
}
function modelRank(s){
  let k=String(s==null?'':s).toUpperCase().trim();
  if(/PRO\s*MAX/.test(k))return 30;
  if(/PRO/.test(k))return 20;
  if(/MAX/.test(k))return 30;
  if(/AIR/.test(k))return 15;
  if(/PLUS/.test(k))return 10;
  let n=k.match(/^(\d+)/);
  if(n)return parseInt(n[1],10);
  return 9999;
}
function buildBalanceGroups(filterFn){
  let grouped={};
  const normKey=function(s){return String(s==null?'':s).replace(/[\u201C\u201D\u2018\u2019"']/g,'').replace(/\s+/g,' ').trim().toLowerCase()};
  allBalanceItems().forEach(r=>{
    if(!r.item&&!r.qty)return;
    let key=normKey(r.item)+'|'+normKey(r.storage)+'|'+normKey(r.specs)+'|'+normKey(r.color);
    if(!grouped[key])grouped[key]={item:r.item,storage:r.storage,specs:r.specs,color:r.color,qty:0};
    let q=parseInt(r.qty)||0;
    if(r.type==='Opening'||r.type==='Buying')grouped[key].qty+=q;
    else if(r.type==='Selling')grouped[key].qty-=q;
  });
  let filtered=Object.values(grouped).filter(filterFn);
  let bySpecsModel={};
  filtered.forEach(g=>{
    let itemName=String(g.item||'').replace(/^iPhone\s*/i,'');
    let specsKey=String(g.specs||'').toUpperCase().trim()||'OTHER';
    let modelKey=itemName+'|'+String(g.storage||'');
    if(!bySpecsModel[specsKey])bySpecsModel[specsKey]={specs:g.specs,models:{}};
    if(!bySpecsModel[specsKey].models[modelKey])bySpecsModel[specsKey].models[modelKey]={header:itemName+' '+String(g.storage||''),modelName:itemName,storage:g.storage,colors:[]};
    bySpecsModel[specsKey].models[modelKey].colors.push(g);
  });
  Object.values(bySpecsModel).forEach(sg=>{
    Object.values(sg.models).forEach(mg=>{
      mg.colors.sort((a,b)=>String(a.color||'').localeCompare(String(b.color||'')));
    });
  });
  let specsSorted=Object.entries(bySpecsModel).sort((a,b)=>{
    let ra=specsRank(a[1].specs),rb=specsRank(b[1].specs);
    if(ra!==rb)return ra-rb;
    return a[0].localeCompare(b[0]);
  });
  let result=[];
  specsSorted.forEach(([skey,sg])=>{
    let modelsSorted=Object.entries(sg.models).sort((a,b)=>{
      let ra=modelRank(a[1].modelName),rb=modelRank(b[1].modelName);
      if(ra!==rb)return ra-rb;
      let sa=storageRank(a[1].storage),sb=storageRank(b[1].storage);
      if(sa!==sb)return sa-sb;
      return String(a[1].modelName).localeCompare(String(b[1].modelName));
    });
    modelsSorted.forEach(([mkey,mg])=>{
      result.push({specs:sg.specs,header:mg.header,colors:mg.colors});
    });
  });
  return result;
}

function renderBalance(){
  const container=document.getElementById('balanceContent');
  let groups=buildBalanceGroups(g=>g.qty>0);
  let anyItems=true;
  let totalQty=0;
  groups.forEach(g=>g.colors.forEach(c=>totalQty+=c.qty));
  let hasAnyQty=allBalanceItems().length>0;
  if(groups.length===0){
    if(hasAnyQty)container.innerHTML='<p style="color:#888;font-size:0.8rem">All items balanced — net zero for every entry. Parse additional transactions to see changes.</p>';
    else container.innerHTML='<p style="color:#888;font-size:0.8rem">No balance data. Import or enter transactions first.</p>';
    try{renderWTB()}catch(e){}
    return;
  }
  let html='<div style="margin-bottom:6px;font-size:0.7rem;color:#007aff">Items you have in stock — ready to sell</div>';
  groups.forEach(grp=>{
    let displayHeader=grp.header+(grp.specs?(' '+String(grp.specs).toUpperCase()):'');
    html+=`<div class="summary-card"><h3>${esc(displayHeader)}</h3>`;
    grp.colors.forEach(g=>{
      html+=`<div class="summary-row"><span>${esc(g.color)}</span><span class="summary-qty qty-positive">${g.qty}</span></div>`;
    });
    html+='</div>';
  });
  html+=`<div style="text-align:right;font-weight:600;padding:8px 0;font-size:0.9rem">Total WTS: <span style="color:#007aff">${totalQty}</span></div>`;
  container.innerHTML=html;
  try{renderWTB()}catch(e){}
}

function renderWTB(){
  const content=document.getElementById('wtbContent');
  if(!content)return;
  let groups=buildBalanceGroups(g=>g.qty<0);
  if(groups.length===0){content.innerHTML='<p style="color:#888;font-size:0.8rem">No items to buy — all stock is balanced.</p>';return;}
  let html='';
  let totalNeg=0;
  groups.forEach(grp=>{
    let displayHeader=grp.header+(grp.specs?(' '+String(grp.specs).toUpperCase()):'');
    html+=`<div class="summary-card" style="background:rgba(255,59,48,0.06);border:1px solid rgba(255,59,48,0.15)">`;
    html+=`<h3 style="color:#ff3b30">${esc(displayHeader)}</h3>`;
    grp.colors.forEach(g=>{
      let posQty=Math.abs(g.qty);
      totalNeg+=posQty;
      html+=`<div class="summary-row"><span style="color:#ff3b30">${esc(g.color)}</span><span class="summary-qty" style="color:#ff3b30;font-weight:700">-${posQty}</span></div>`;
    });
    html+='</div>';
  });
  html+=`<div style="text-align:right;font-weight:600;padding:8px 0;font-size:0.9rem;color:#ff3b30">Total WTB: ${totalNeg}</div>`;
  content.innerHTML=html;
}

function getBalanceText(){
  let groups=buildBalanceGroups(g=>g.qty>0);
  let lines=[];
  let lastSpecs='';
  groups.forEach(grp=>{
    let specsKey=String(grp.specs||'').toUpperCase();
    if(lastSpecs&&lastSpecs!==specsKey)lines.push('─────────────────────');
    lastSpecs=specsKey;
    let headerWithSpecs=grp.header+(grp.specs?(' '+String(grp.specs).toUpperCase()):'');
    lines.push('*'+headerWithSpecs+'*');
    grp.colors.forEach(g=>lines.push(g.color+'\t'+g.qty));
    lines.push('');
  });
  return lines.join('\n').trim();
}

function getExcelText(){
  return transactions.map(r=>[r.date,r.type,r.vendor,r.marks,r.item,r.storage,r.specs,r.color,r.qty,r.txnStatus,r.logistics].join('\t')).join('\n');
}

function getWtsWhatsAppText(){
  let groups=buildBalanceGroups(g=>g.qty>0);
  let lines=['*WTS — Want To Sell*',''];
  let total=0;
  let lastSpecs='';
  groups.forEach(grp=>{
    let specsKey=String(grp.specs||'').toUpperCase();
    if(lastSpecs&&lastSpecs!==specsKey)lines.push('─────────────');
    lastSpecs=specsKey;
    let headerWithSpecs=grp.header+(grp.specs?(' '+String(grp.specs).toUpperCase()):'');
    lines.push('*'+headerWithSpecs+'*');
    grp.colors.forEach(g=>{total+=g.qty;lines.push(g.color+' '+g.qty)});
    lines.push('');
  });
  lines.push('*Total: '+total+'*');
  return lines.join('\n');
}

function getWtbWhatsAppText(){
  let groups=buildBalanceGroups(g=>g.qty<0);
  let lines=['*WTB — Want To Buy*',''];
  let total=0;
  let lastSpecs='';
  groups.forEach(grp=>{
    let specsKey=String(grp.specs||'').toUpperCase();
    if(lastSpecs&&lastSpecs!==specsKey)lines.push('─────────────');
    lastSpecs=specsKey;
    let headerWithSpecs=grp.header+(grp.specs?(' '+String(grp.specs).toUpperCase()):'');
    lines.push('*'+headerWithSpecs+'*');
    grp.colors.forEach(g=>{let p=Math.abs(g.qty);total+=p;lines.push(g.color+' '+p)});
    lines.push('');
  });
  lines.push('*Total: '+total+'*');
  return lines.join('\n');
}

// ===================== DELIVERY ORDER =====================
let doProducts=[]

function loadDOData(customerName,mark){
  doProducts=[]
  let byModel={}
  let cn=(customerName||'').trim().toUpperCase()
  let mk=(mark||'').trim()
  let dateFilter=window._doDateFilter||''
  let submittedKeys=getSubmittedKeys()
  function addItem(model,storage,specs,color,qty){
    let key=(model||'')+'|'+(storage||'')+'|'+(specs||'')+'|'+(color||'')
    let subKey=cn+'|'+(mk||'')+'|'+key
    let submittedQty=submittedKeys[subKey]||submittedKeys[cn+'|'+key]||0
    let available=qty-submittedQty
    if(available<=0)return
    if(!byModel[key])byModel[key]={model,storage,specs,color,qty:0}
    byModel[key].qty+=available
  }
  let _dbgMatched=0,_dbgTotal=allSavedTx.length
  allSavedTx.forEach(t=>{
    if(t.transaction_type!=='Selling'&&t.transaction_type!=='Opening'&&t.transaction_type!=='Buying')return
    if((t.customer_vendor||'').trim().toUpperCase()!==cn)return
    if(mk&&(t.marks||'').trim().toUpperCase()!==mk.toUpperCase())return
    if(dateFilter&&t.date!==dateFilter)return
    _dbgMatched++
    addItem((t.item_name||'').trim(),(t.storage||'').trim(),(t.specs||'').trim(),(t.color||'').trim(),parseInt(t.quantity)||0)
  })
  transactions.forEach(t=>{
    if(t.type!=='Selling'&&t.type!=='Opening'&&t.type!=='Buying')return
    if((t.vendor||'').trim().toUpperCase()!==cn)return
    if(mk&&(t.marks||'').trim().toUpperCase()!==mk.toUpperCase())return
    if(dateFilter&&t.date!==dateFilter)return
    addItem((t.item||'').trim(),(t.storage||'').trim(),(t.specs||'').trim(),(t.color||'').trim(),parseInt(t.qty)||0)
  })
  console.log('[DO DEBUG] customer='+cn+' mark='+mk+' dateFilter='+dateFilter+' allSavedTx.total='+_dbgTotal+' matched='+_dbgMatched+' submittedKeys='+Object.keys(submittedKeys).length+' doProducts='+doProducts.length)
  let grouped={}
  Object.values(byModel).forEach(g=>{
    let hdr=(g.model+' '+g.storage+' '+g.specs).trim().replace(/^iPhone\s*/i,'')
    if(!grouped[hdr])grouped[hdr]={name:hdr,colors:[]}
    grouped[hdr].colors.push({color:g.color,qty:g.qty})
  })
  doProducts=Object.values(grouped).sort((a,b)=>a.name.localeCompare(b.name))
}

function renderDOTable(){
  const tbody=document.getElementById('do-body')
  if(!tbody)return
  tbody.innerHTML=''
  let grandTotal=0
  var curMark=(document.getElementById('do-th-marks')?.textContent||'').trim()
  var markLabel=curMark&&curMark!=='MARKS'?curMark:''
  doProducts.forEach(function(prod,pi){
    if(pi===0){
      var r=document.createElement('tr');r.className='row-category'
      var catCell=markLabel?'<div style="display:flex;flex-direction:column;align-items:center;line-height:1.2"><span style="font-size:7pt;font-weight:400">Mark</span><span style="font-size:9pt;font-weight:700">'+esc(markLabel)+'</span></div>':''
      r.innerHTML='<td colspan="3">Product Description</td><td class="col-qty" style="text-align:center">'+catCell+'</td>';tbody.appendChild(r)
    }
    var pr=document.createElement('tr');pr.className='row-product'
    pr.innerHTML='<td colspan="3">'+prod.name+'</td><td class="col-qty"></td>'
    tbody.appendChild(pr)
    let subtotal=0
    prod.colors.forEach(function(item,ci){
      subtotal+=Number(item.qty)||0
      var r=document.createElement('tr');r.className='row-color'
      r.innerHTML='<td class="col-cat"></td><td class="col-desc"></td><td class="col-color">'+item.color+'</td><td class="col-qty">'+item.qty+'</td>'
      tbody.appendChild(r)
    })
    var dot=document.createElement('tr');dot.className='row-subtotal'
    dot.innerHTML='<td colspan="3" style="text-align:right;font-weight:700">TOTAL</td><td class="sub-qty">'+subtotal+'</td>'
    tbody.appendChild(dot)
    grandTotal+=subtotal
  })
  var gt=document.getElementById('do-grand')
  if(gt)gt.textContent=grandTotal
}

function doAddColor(pi){
  let c=prompt('Color:','Black');if(!c)return
  let q=parseInt(prompt('Quantity:','1'))||1
  doProducts[pi].colors.push({color:c,qty:q})
  renderDOTable()
}

function getSubmittedKeys(){
  try{return JSON.parse(localStorage.getItem('pricingSubmittedKeys'))||{}}catch(e){return {}}
}
function saveSubmittedKeys(obj){
  try{localStorage.setItem('pricingSubmittedKeys',JSON.stringify(obj))}catch(e){}
}

function submitForPricing(){
  let customer=document.getElementById('do-customer').value.trim()
  if(!customer){alert('Please select a customer first');return}
  if(!doProducts.length){alert('No items in Delivery Order');return}
  let cn=customer.toUpperCase()
  let mk=document.getElementById('do-marks').value.trim()
  let isAllView=window.doAllMarksView
  let logi=document.getElementById('do-logistics').value||''
  let stat=document.getElementById('do-status').value||''
  let dt=document.getElementById('do-date').value||''
  let wk=document.getElementById('do-week').value||''
  let marksToSubmit=[]
  if(isAllView&&window.doCurrentMarks&&window.doCurrentMarks.length){
    marksToSubmit=window.doCurrentMarks.slice()
  }else{
    marksToSubmit=[mk||'']
  }
  var savedAllKeys={}
  var submittedCount=0
  marksToSubmit.forEach(function(markVal){
    if(isAllView&&markVal){loadDOData(customer,markVal)}
    if(!doProducts.length)return
    let items=[]
    doProducts.forEach(function(prod){
      prod.colors.forEach(function(c){
        items.push({name:'IPHONE '+prod.name,color:c.color,qty:c.qty,unitPrice:''})
      })
    })
    if(!items.length)return
    let existingP=[]
    try{existingP=JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){}
    let itemSig=items.map(function(i){return i.name+'|'+i.color+'|'+i.qty}).sort().join(';;')
    let dup=existingP.some(function(e){
      if(e.customer!==customer||e.marks!==markVal)return false
      if(!e.items)return false
      let eSig=e.items.map(function(i){return i.name+'|'+i.color+'|'+i.qty}).sort().join(';;')
      return eSig===itemSig
    })
    if(dup){alert('ALREADY SUBMITTED!\n\nCustomer: '+customer+'\nMark: '+markVal+'\n\nThis order was already submitted. Cannot submit duplicate.');return}
    let newKeys={}
    allSavedTx.forEach(function(t){
      if(t.transaction_type!=='Selling'&&t.transaction_type!=='Opening'&&t.transaction_type!=='Buying')return
      if((t.customer_vendor||'').trim().toUpperCase()!==cn)return
      if(markVal&&(t.marks||'').trim().toUpperCase()!==markVal.toUpperCase())return
      var rawHdr=(t.item_name+' '+t.storage+' '+t.specs).trim().replace(/^iPhone\s*/i,'')
      var rawKey=cn+'|'+(markVal||'')+'|'+(t.item_name||'').trim()+'|'+(t.storage||'').trim()+'|'+(t.specs||'').trim()+'|'+(t.color||'').trim()
      doProducts.forEach(function(prod){
        if(prod.name===rawHdr){
          prod.colors.forEach(function(pc){
            if(pc.color===t.color){newKeys[rawKey]=(newKeys[rawKey]||0)+(parseInt(t.quantity)||0)}
          })
        }
      })
    })
    transactions.forEach(function(t){
      if(t.type!=='Selling'&&t.type!=='Opening'&&t.type!=='Buying')return
      if((t.vendor||'').trim().toUpperCase()!==cn)return
      if(markVal&&(t.marks||'').trim().toUpperCase()!==markVal.toUpperCase())return
      var rawHdr=(t.item+' '+t.storage+' '+t.specs).trim().replace(/^iPhone\s*/i,'')
      var rawKey=cn+'|'+(markVal||'')+'|'+(t.item||'').trim()+'|'+(t.storage||'').trim()+'|'+(t.specs||'').trim()+'|'+(t.color||'').trim()
      doProducts.forEach(function(prod){
        if(prod.name===rawHdr){
          prod.colors.forEach(function(pc){
            if(pc.color===t.color){newKeys[rawKey]=(newKeys[rawKey]||0)+(parseInt(t.qty)||0)}
          })
        }
      })
    })
    Object.keys(newKeys).forEach(function(k){savedAllKeys[k]=(savedAllKeys[k]||0)+newKeys[k]})
    let baseId='pricing_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)
    let entryPricing={
      id:baseId,
      customer:customer,marks:markVal,logistics:logi,status:stat,date:dt,week:wk,
      items:items,submittedAt:Date.now(),completed:false,submittedKeys:newKeys
    }
    let pending=[];try{pending=JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){}
    pending.push(entryPricing)
    try{localStorage.setItem('pricingPending',JSON.stringify(pending))}catch(e){}
    submittedCount++
  })
  if(!submittedCount){showMsg('Order already submitted! No new orders added.','error');return}
  var existing=getSubmittedKeys()
  Object.keys(savedAllKeys).forEach(function(k){existing[k]=(existing[k]||0)+savedAllKeys[k]})
   saveSubmittedKeys(existing)
  showMsg('Submitted '+submittedCount+' order(s) to Pricing & DO Approval!')
  autoBackup()
  doProducts=[];window.doAllMarksView=false;window.doCurrentMarks=[];renderDOTable()
  document.getElementById('do-customer').value=''
  document.getElementById('do-logistics').value=''
  document.getElementById('do-marks').innerHTML='<option value="">-- Select Mark --</option>'
  document.getElementById('do-status').value='Order In Hand'
  document.getElementById('do-date').value=''
  document.getElementById('do-week').value=''
  document.getElementById('do-f-customer').value=''
  document.getElementById('do-f-status').value='Order In Hand'
  document.getElementById('do-f-date').value=''
  document.getElementById('do-f-logistics').value=''
  document.getElementById('do-f-week').value=''
  document.getElementById('do-top-name').textContent=''
  document.getElementById('do-top-date').textContent=''
  document.getElementById('do-th-marks').textContent='MARKS'
  document.getElementById('do-f-marks').value=''
  refreshAllSections()
  updateTabNotifs()
}

// One-time migration: dedupe any pre-existing _p/_a duplicate entries from the old bug
;(function dedupeOldPendingEntries(){
  try{
    var pending=JSON.parse(localStorage.getItem('pricingPending'))||[]
    if(!pending.length)return
    var seen={}
    var cleaned=[]
    var removed=0
    pending.forEach(function(e){
      // Match on customer + marks + items signature (same as dup check in submit)
      var itemSig=(e.items||[]).map(function(i){return (i.name||'')+'|'+(i.color||'')+'|'+(i.qty||0)}).sort().join(';;')
      var key=(e.customer||'')+'|'+(e.marks||'')+'|'+(e.date||'')+'|'+(e.logistics||'')+'|'+itemSig
      if(seen[key]){
        removed++
        return
      }
      seen[key]=true
      // Normalize id: strip _p/_a suffixes from old bug
      if(e.id && /_p$|_a$/.test(e.id))e.id=e.id.replace(/_[pa]$/,'')
      cleaned.push(e)
    })
    if(removed>0){
      localStorage.setItem('pricingPending',JSON.stringify(cleaned))
      console.log('[DEDUPE] Removed '+removed+' duplicate pricingPending entries from old bug')
    }
  }catch(e){console.warn('[DEDUPE] error:',e)}
})()

function updateTabNotifs(){
  try{
    var pending=JSON.parse(localStorage.getItem('pricingPending'))||[]
    var pricingPending=pending.filter(function(e){return !e.completed})
    var approvalPending=pending.filter(function(e){return e.completed && e.approved!==true && e.approved!==false})
    var warehousePending=pending.filter(function(e){return e.approved===true && e.warehousePacked!==true})
    var invoicePending=pending.filter(function(e){return e.approved===true && e.warehousePacked===true && !e.invoiced})
    var pricingNotif=document.getElementById('pricingNotif')
    var approvalNotif=document.getElementById('approvalNotif')
    var warehouseNotif=document.getElementById('warehouseNotif')
    var invoiceNotif=document.getElementById('invoiceNotif')
    var prevPricingDone=window._prevPricingDone
    var prevApprovalDone=window._prevApprovalDone
    var prevWarehouseDone=window._prevWarehouseDone
    var prevInvoiceDone=window._prevInvoiceDone
    var pricingAllDone=pricingPending.length===0&&pending.some(function(e){return e.completed})
    var approvalAllDone=approvalPending.length===0&&pending.length>0&&pending.every(function(e){return e.approved===true||e.approved===false||e.cashReleased===true})
    var warehouseAllDone=warehousePending.length===0&&pending.some(function(e){return e.approved===true})
    var invoiceAllDone=invoicePending.length===0&&pending.some(function(e){return e.warehousePacked===true})
    if(pricingNotif){
      if(pricingPending.length>0){pricingNotif.classList.remove('hide','done');pricingNotif.title=pricingPending.length+' pending pricing'}
      else if(pending.some(function(e){return e.completed&&e._pricingDone})){pricingNotif.classList.remove('hide');pricingNotif.classList.add('done');pricingNotif.title='All pricing done'}
      else{pricingNotif.classList.add('hide')}
    }
    if(approvalNotif){
      if(approvalPending.length>0){approvalNotif.classList.remove('hide','done');approvalNotif.title=approvalPending.length+' pending approval'}
      else if(pending.some(function(e){return (e.approved===true||e.approved===false||e.cashReleased===true)})){approvalNotif.classList.remove('hide');approvalNotif.classList.add('done');approvalNotif.title='All approvals done'}
      else{approvalNotif.classList.add('hide')}
    }
    if(warehouseNotif){
      if(warehousePending.length>0){warehouseNotif.classList.remove('hide','done');warehouseNotif.title=warehousePending.length+' pending warehouse packing'}
      else if(pending.some(function(e){return e.warehousePacked===true})){warehouseNotif.classList.remove('hide');warehouseNotif.classList.add('done');warehouseNotif.title='All warehouse packing done'}
      else{warehouseNotif.classList.add('hide')}
    }
    if(invoiceNotif){
      if(invoicePending.length>0){invoiceNotif.classList.remove('hide','done');invoiceNotif.title=invoicePending.length+' pending invoice'}
      else if(pending.some(function(e){return e.invoiced===true})){invoiceNotif.classList.remove('hide');invoiceNotif.classList.add('done');invoiceNotif.title='All invoiced'}
      else{invoiceNotif.classList.add('hide')}
    }
    // Trigger confetti when transitioning to all-done state
    if(pricingAllDone&&!prevPricingDone&&pending.length>0){try{fireConfetti()}catch(e){}}
    if(approvalAllDone&&!prevApprovalDone&&pending.length>0){try{fireConfetti()}catch(e){}}
    if(warehouseAllDone&&!prevWarehouseDone&&pending.length>0){try{fireConfetti()}catch(e){}}
    if(invoiceAllDone&&!prevInvoiceDone&&pending.length>0){try{fireConfetti()}catch(e){}}
    window._prevPricingDone=pricingAllDone
    window._prevApprovalDone=approvalAllDone
    window._prevWarehouseDone=warehouseAllDone
    window._prevInvoiceDone=invoiceAllDone
  }catch(e){}
}

// Animation helper functions
function fireConfetti(){
  var colors=['#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899']
  for(var i=0;i<60;i++){
    var c=document.createElement('div')
    c.className='confetti'
    c.style.left=Math.random()*100+'%'
    c.style.background=colors[Math.floor(Math.random()*colors.length)]
    c.style.animationDelay=Math.random()*0.5+'s'
    c.style.animationDuration=(2+Math.random()*2)+'s'
    if(Math.random()>0.5)c.style.borderRadius='50%'
    document.body.appendChild(c)
    setTimeout(function(){c.remove()},4000)
  }
}

function shakeElement(el){
  if(!el)return
  el.classList.remove('shake-it')
  void el.offsetWidth
  el.classList.add('shake-it')
  setTimeout(function(){el.classList.remove('shake-it')},600)
}

function bumpNumber(el){
  if(!el)return
  el.classList.remove('number-pop')
  void el.offsetWidth
  el.classList.add('number-pop')
  setTimeout(function(){el.classList.remove('number-pop')},500)
}

function showProgressBar(container,ms){
  var c=typeof container==='string'?document.getElementById(container):container
  if(!c)return
  var bar=document.createElement('div')
  bar.className='progress-bar'
  var wrap=document.createElement('div')
  wrap.className='progress-container'
  wrap.appendChild(bar)
  c.appendChild(wrap)
  setTimeout(function(){wrap.remove()},ms||2200)
}

function spinnerHTML(){return '<span class="spinner"></span>'}

function showSubmitPopup(count,from){
  var overlay=document.createElement('div')
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center'
  var box=document.createElement('div')
  box.style.cssText='background:#1e1e2e;color:#cdd6f4;padding:30px;border-radius:12px;text-align:center;max-width:380px;box-shadow:0 8px 32px rgba(0,0,0,0.4)'
  var btns=''
  if(from!=='pricing')btns+='<button class="btn" style="background:#89b4fa;color:#1e1e2e;font-size:12px" onclick="switchTab(\'pricing\');this.closest(\'div\').parentElement.parentElement.remove()">📊 Go to Pricing</button>'
  if(from!=='approval')btns+='<button class="btn" style="background:#4ade80;color:#1e1e2e;font-size:12px" onclick="switchTab(\'approval\');this.closest(\'div\').parentElement.parentElement.remove()">✅ Go to Approval</button>'
  btns+='<button class="btn" style="background:#45475a;color:#cdd6f4;font-size:12px" onclick="this.closest(\'div\').parentElement.parentElement.remove()">Close</button>'
  box.innerHTML='<div style="font-size:40px;margin-bottom:10px">✅</div><div style="font-size:16px;font-weight:700;margin-bottom:6px">'+(from?'New Submissions!':'Submitted Successfully!')+'</div><div style="font-size:13px;color:#a6adc8;margin-bottom:18px">'+count+' order(s) pending in '+(from||'Pricing & Approval')+'</div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+btns+'</div>'
  overlay.appendChild(box)
  document.body.appendChild(overlay)
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove()})
}

function updateDOField(field,val){
  if(field==='customer'){document.getElementById('do-f-customer').value=val;document.getElementById('do-top-name').textContent=val}
  if(field==='marks'){document.getElementById('do-th-marks').textContent=val;document.getElementById('do-f-marks').value=val}
  if(field==='status')document.getElementById('do-f-status').value=val
  if(field==='date'){document.getElementById('do-f-date').value=val;document.getElementById('do-top-date').textContent=val}
  if(field==='logistics'){document.getElementById('do-f-logistics').value=val;var bn=document.getElementById('do-banner');if(bn)bn.textContent=val||'APL LOGISTIC FOR SALES EXPERT'}
  if(field==='week')document.getElementById('do-f-week').value=val
}

function populateDOMarks(customerName,autoSelect){
  let ms=document.getElementById('do-marks')
  if(!ms)return''
  let cn=(customerName||'').trim().toUpperCase()
  let dateFilter=window._doDateFilter||''
  let marks=new Set()
  allSavedTx.forEach(t=>{if((t.transaction_type==='Selling'||t.transaction_type==='Opening'||t.transaction_type==='Buying')&&(t.customer_vendor||'').trim().toUpperCase()===cn&&t.marks&&(!dateFilter||t.date===dateFilter))marks.add(t.marks.trim())})
  try{JSON.parse(localStorage.getItem('pricingPending')||'[]').forEach(function(e){if((e.customer||'').trim().toUpperCase()===cn&&e.marks)marks.add(e.marks.trim());if((e.customer||'').trim().toUpperCase()===cn&&e.items)e.items.forEach(function(it){if(it.marks)marks.add(it.marks.trim())})})}catch(e){}
  let list=[...marks].sort((a,b)=>a.localeCompare(b))
  window.doCurrentMarks=list
  if(list.length===1){
    ms.innerHTML='<option value="'+esc(list[0])+'">'+esc(list[0])+'</option>'
    ms.value=list[0]
    if(autoSelect){onDOMarkChange(list[0]);return list[0]}
  }else if(list.length>1){
    let opts=['<option value="">-- Select Mark --</option>','<option value="__ALL__">-- All Marks --</option>']
    list.forEach(function(m){opts.push('<option value="'+esc(m)+'">'+esc(m)+'</option>')})
    ms.innerHTML=opts.join('')
    ms.value=''
  }else{
    ms.innerHTML='<option value="">-- Select Mark --</option>'
    ms.value=''
  }
  return ms.value
}
function onDOMarkChange(val){
  let v=document.getElementById('do-customer').value
  if(val==='__ALL__'){
    window.doAllMarksView=true
    updateDOField('marks','All Marks')
    loadDOAllMarks(v);renderDOTable()
  }else{
    window.doAllMarksView=false
    updateDOField('marks',val||'--')
    if(val){loadDOData(v,val);renderDOTable()}
    else if(v){loadDOData(v);renderDOTable()}
    else{doProducts=[];renderDOTable()}
  }
}
function loadDOAllMarks(customerName){
  doProducts=[]
  let cn=(customerName||'').trim().toUpperCase()
  let byModel={}
  let dateFilter=window._doDateFilter||''
  let submittedKeys=getSubmittedKeys()
  function addItem(model,storage,specs,color,qty){
    let key=(model||'')+'|'+(storage||'')+'|'+(specs||'')+'|'+(color||'')
    let subKey=cn+'|'+key
    let submittedQty=submittedKeys[subKey]||0
    // Also sum per-mark submitted keys
    if(window.doCurrentMarks&&window.doCurrentMarks.length){
      var sumExtra=0
      for(var mi=0;mi<window.doCurrentMarks.length;mi++){sumExtra+=submittedKeys[cn+'|'+window.doCurrentMarks[mi]+'|'+key]||0}
      submittedQty+=sumExtra
    }
    let available=qty-submittedQty
    if(available<=0)return
    if(!byModel[key])byModel[key]={model,storage,specs,color,qty:0}
    byModel[key].qty+=available
  }
  allSavedTx.forEach(function(t){
    if(t.transaction_type!=='Selling'&&t.transaction_type!=='Opening'&&t.transaction_type!=='Buying')return
    if((t.customer_vendor||'').trim().toUpperCase()!==cn)return
    if(dateFilter&&t.date!==dateFilter)return
    addItem((t.item_name||'').trim(),(t.storage||'').trim(),(t.specs||'').trim(),(t.color||'').trim(),parseInt(t.quantity)||0)
  })
  transactions.forEach(function(t){
    if(t.type!=='Selling'&&t.type!=='Opening'&&t.type!=='Buying')return
    if((t.vendor||'').trim().toUpperCase()!==cn)return
    addItem((t.item||'').trim(),(t.storage||'').trim(),(t.specs||'').trim(),(t.color||'').trim(),parseInt(t.qty)||0)
  })
  let grouped={}
  Object.values(byModel).forEach(function(g){
    let hdr=(g.model+' '+g.storage+' '+g.specs).trim().replace(/^iPhone\s*/i,'')
    if(!grouped[hdr])grouped[hdr]={name:hdr,colors:[]}
    grouped[hdr].colors.push({color:g.color,qty:g.qty})
  })
  doProducts=Object.values(grouped).sort(function(a,b){return a.name.localeCompare(b.name)})
}
function refreshDOCustomers(){
  var dateFilter=window._doDateFilter||''
  var sel=document.getElementById('do-customer')
  if(!sel)return
  let names=new Set()
  allSavedTx.forEach(t=>{
    if(t.transaction_type==='Selling'&&t.customer_vendor){
      if(!dateFilter||t.date===dateFilter)names.add(t.customer_vendor)
    }
  })
  try{JSON.parse(localStorage.getItem('pricingPending')||'[]').forEach(function(e){if(e.customer)names.add(e.customer)})}catch(e){}
  var dl=document.getElementById('do-customer-datalist')
  if(!dl){dl=document.createElement('datalist');dl.id='do-customer-datalist';document.body.appendChild(dl)}
  dl.innerHTML=[...names].sort().map(n=>`<option value="${esc(n)}">`).join('')
  sel.setAttribute('list','do-customer-datalist')
  if(!names.has(sel.value)){sel.value='';updateDOField('customer','')}
}

function onDODateFilterChange(val){
  window._doDateFilter=val
  refreshDOCustomers()
  refreshDOCustomerList()
  if(typeof window._onDOCustomerChange==='function')window._onDOCustomerChange(false)
}

function refreshDOCustomerList(){
  var list=document.getElementById('do-customer-list')
  if(!list)return
  if(typeof window._getDOCustomerNames!=='function'){
    window._getDOCustomerNames=function(){
      var dateFilter=window._doDateFilter||''
      let ns=new Set()
      try{allSavedTx.forEach(function(t){
        if(t.transaction_type==='Selling'&&t.customer_vendor){
          if(!dateFilter||t.date===dateFilter)ns.add(t.customer_vendor)
        }
      })}catch(e){}
      return ns
    }
  }
  var names=window._getDOCustomerNames()
  if(!names||!names.size){list.innerHTML='<div style="padding:20px;text-align:center;color:var(--badge-color);font-size:0.75rem">No customers for selected date.</div>';return}
  var sorted=[...names].sort()
  var sel=document.getElementById('do-customer')
  var cur=(sel?sel.value:'').trim()
  var submittedMap={}
  try{
    JSON.parse(localStorage.getItem('pricingPending')||'[]').forEach(function(e){
      if(e.customer)submittedMap[e.customer.toUpperCase()]=true
    })
  }catch(e){}
  var html=''
  sorted.forEach(function(n){
    var qty=0
    var dateFilter=window._doDateFilter||''
    allSavedTx.forEach(function(t){
      if((t.customer_vendor||'').trim().toUpperCase()===n.toUpperCase()&&(!dateFilter||t.date===dateFilter))qty+=parseInt(t.quantity)||0
    })
    try{JSON.parse(localStorage.getItem('pricingPending')||'[]').forEach(function(e){if(e.customer&&e.customer.toUpperCase()===n.toUpperCase())qty+=e.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)})}catch(e){}
    var active=cur.toUpperCase()===n.toUpperCase()
    var pendingStatus=!submittedMap[n.toUpperCase()]
    var dotClass=pendingStatus?'do-status-dot pending':'do-status-dot done'
    var dotTitle=pendingStatus?'Pending: Submit for Pricing':'Submitted for Pricing'
    html+='<div class="do-list-item'+(active?' active':'')+'" onclick="doSelectCustomer(\''+escAttr(n)+'\')">'
    html+='<div style="display:flex;align-items:center;gap:8px"><span class="'+dotClass+'" title="'+dotTitle+'"></span><div class="do-cust-name" style="flex:1">'+esc(n)+'</div></div>'
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px"><span class="do-cust-meta">'+qty+' qty</span><span style="font-size:0.6rem;color:var(--badge-color)">'+(pendingStatus?'Pending':'Submitted')+'</span></div>'
    html+='</div>'
  })
  list.innerHTML=html
}

function doSelectCustomer(name){
  var sel=document.getElementById('do-customer')
  if(!sel)return
  var existing=sel.value.trim()
  if(existing.toUpperCase()===name.toUpperCase())return
  sel.value=name
  if(typeof window._onDOCustomerChange==='function')window._onDOCustomerChange(false)
  refreshDOCustomerList()
}

function initDO(){
  if(window._doInitialized)return
  window._doInitialized=true
  const d=new Date()
  const dd=String(d.getDate()).padStart(2,'0'),mm=String(d.getMonth()+1).padStart(2,'0'),yy=d.getFullYear()
  const ds=dd+'-'+mm+'-'+yy
  const day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1)
  const mon=new Date(d.setDate(diff)),sun=new Date(mon);sun.setDate(sun.getDate()+6)
  const fmt=dt=>dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}).replace(/ /g,' ')
  const ws='Week '+fmt(mon)+' - '+fmt(sun)
  // Set date filter to today
  var todayStr=new Date().toISOString().split('T')[0]
  var df=document.getElementById('do-date-filter')
  if(df){df.value=todayStr;window._doDateFilter=todayStr}
  const sel=document.getElementById('do-customer')
  if(sel){
    refreshDOCustomers()
    refreshDOCustomerList()
    window._getDOCustomerNames=function(){
      var dateFilter=window._doDateFilter||''
      let ns=new Set()
      allSavedTx.forEach(t=>{
        if(t.transaction_type==='Selling'&&t.customer_vendor){
          if(!dateFilter||t.date===dateFilter)ns.add(t.customer_vendor)
        }
      })
      // Remove customers who have already been submitted for pricing
      try{
        var submitted=new Set()
        var pending=JSON.parse(localStorage.getItem('pricingPending'))||[]
        pending.forEach(function(e){if(e.customer)submitted.add(e.customer.toUpperCase())})
        ns.forEach(function(name){if(submitted.has(name.toUpperCase()))ns.delete(name)})
      }catch(e){}
      return ns
    }
    window._getDOLogisticsForCustomer=function(cn){
      let up=cn.toUpperCase()
      var dateFilter=window._doDateFilter||''
      let all=allSavedTx.filter(t=>(t.customer_vendor||'').trim().toUpperCase()===up&&(!dateFilter||t.date===dateFilter)).sort(function(a,b){return parseDate(b.date)-parseDate(a.date)})
      for(let t of all){if(t.logistics)return t.logistics}
      try{let pp=JSON.parse(localStorage.getItem('pricingPending')||'[]');for(let e of pp){if(e.customer&&e.customer.toUpperCase()===up&&e.logistics)return e.logistics}}catch(e){}
      return''
    }
    window._onDOCustomerChange=function(isBlur){
      let v=sel.value.trim()
      if(v&&isBlur){
        var names=window._getDOCustomerNames()
        var match=false
        names.forEach(function(n){if(n.toUpperCase()===v.toUpperCase()){v=n;match=true}})
        if(!match){sel.value='';v=''}
      }
      window.doAllMarksView=false
      if(v){
        var dateFilter=window._doDateFilter||''
        let txAll=allSavedTx.filter(t=>(t.customer_vendor||'').trim().toUpperCase()===v.toUpperCase()&&(!dateFilter||t.date===dateFilter)).sort(function(a,b){return parseDate(b.date)-parseDate(a.date)})
        let tx=txAll[0]
        let d=tx&&tx.date||document.getElementById('do-date').value
        document.getElementById('do-date').value=d
        document.getElementById('do-f-date').value=d
        document.getElementById('do-top-date').textContent=d
        populateDOMarks(v,false)
        let lg=window._getDOLogisticsForCustomer(v)
        document.getElementById('do-logistics').value=lg
        updateDOField('logistics',lg)
        updateDOField('customer',v)
        var banner=document.getElementById('do-banner')
        if(banner)banner.textContent=lg||'APL LOGISTIC FOR SALES EXPERT'
        var ms=document.getElementById('do-marks')
        if(ms&&ms.value){updateDOField('marks',ms.value);loadDOData(v,ms.value);renderDOTable()}
        else if(v){loadDOData(v);renderDOTable()}
        else{doProducts=[];renderDOTable()}
      }else{doProducts=[];renderDOTable()}
    }
    sel.addEventListener('change',function(){window._onDOCustomerChange(false)})
    sel.addEventListener('blur',function(){window._onDOCustomerChange(true)})
    // Auto-fill logistics on load if customer already set
    var curV=sel.value.trim()
    if(curV){
      var curLg=window._getDOLogisticsForCustomer(curV)
      if(curLg){document.getElementById('do-logistics').value=curLg;updateDOField('logistics',curLg)}
    }
  }
  var logEl=document.getElementById('do-logistics')
  if(logEl){
    var ldl=document.getElementById('do-logistics-datalist')
    if(!ldl){ldl=document.createElement('datalist');ldl.id='do-logistics-datalist';document.body.appendChild(ldl)}
    ldl.innerHTML=LOGISTICS_LIST.map(function(l){return '<option value="'+esc(l)+'">'}).join('')
    logEl.setAttribute('list','do-logistics-datalist')
    logEl.addEventListener('blur',function(){
      var v=this.value.trim()
      if(v){
        var found=false,matchVal=''
        LOGISTICS_LIST.forEach(function(l){if(l.toUpperCase()===v.toUpperCase()){matchVal=l;found=true}})
        if(!found){Object.values(LOGISTICS_ALIASES||{}).forEach(function(a){if(a.toUpperCase()===v.toUpperCase()){matchVal=a;found=true}})}
        if(!found){Object.keys(LOGISTICS_ALIASES||{}).forEach(function(k){if(k.toUpperCase()===v.toUpperCase()){matchVal=LOGISTICS_ALIASES[k];found=true}})}
        if(!found){
          var fuzzy=fuzzyMatchLogistics(v)
          if(fuzzy&&fuzzy!==v){matchVal=fuzzy;found=true}
        }
        if(found)this.value=matchVal
        else this.value=''
      }
    })
  }
  if(!document.getElementById('do-date').value){document.getElementById('do-date').value=ds;document.getElementById('do-f-date').value=ds;document.getElementById('do-top-date').textContent=ds}
  if(!document.getElementById('do-week').value){document.getElementById('do-week').value=ws;document.getElementById('do-f-week').value=ws}
  document.getElementById('do-th-marks').textContent='MARKS'
  document.getElementById('do-f-marks').value=''
  window.doAllMarksView=false
  window.doCurrentMarks=[]
  document.getElementById('do-marks').innerHTML='<option value="">-- Select Mark --</option>'
  document.getElementById('do-status').value='Order In Hand'
  var cv=document.getElementById('do-customer').value.trim()
  if(cv){
    var selMs=populateDOMarks(cv,true)
    if(!document.getElementById('do-marks')||!document.getElementById('do-marks').value){
      loadDOData(cv);renderDOTable()
    }
  }
}
let pdfDirHandle=null
function selectPDFFolder(){
  if(!window.showDirectoryPicker){showMsg('Folder picker not supported','error');return}
  window.showDirectoryPicker().then(function(dir){pdfDirHandle=dir;let inp=document.getElementById('pdfFolderInput');if(inp)inp.value=dir.name;try{localStorage.setItem('pdfFolderName',dir.name)}catch(e){};showMsg('PDF folder: '+dir.name)}).catch(function(e){if(e.name!='AbortError')showMsg('Folder selection failed','error')})
}
;(function(){let s='';try{s=localStorage.getItem('pdfFolderName')||''}catch(e){};let inp=document.getElementById('pdfFolderInput');if(inp&&s)inp.value=s})()
function printDO(){
  const page=document.getElementById('do-page')
  if(!page)return
  page.querySelectorAll('input').forEach(function(el){el.setAttribute('value',el.value)})
  if(window.refreshCompanyLogos)window.refreshCompanyLogos()
  const w=window.open('','_blank','width=800,height=600')
  if(!w){showMsg('Popup blocked! Allow popups and try again.','error');return}
  w.document.write('<!DOCTYPE html><html><head><title>Delivery Order</title><style>')
  w.document.write('@page{size:A4 portrait;margin:12mm 14mm}')
  w.document.write('*{margin:0;padding:0;box-sizing:border-box}')
  w.document.write('body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;background:#fff;color:#111;min-height:267mm;display:flex;flex-direction:column}')
  w.document.write('.top-bar{display:flex;justify-content:space-between;align-items:center;font-size:9pt;color:#111;margin-bottom:7px;border-bottom:1px solid #aaa;padding-bottom:6px}')
  w.document.write('.logo-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px}')
  w.document.write('.logo-text{font-size:22pt;font-weight:900;letter-spacing:1px;color:#111;font-family:Arial Black,Arial,sans-serif;line-height:1}')
  w.document.write('.logo-star{color:#c0392b;font-size:22pt}')
  w.document.write('.logo-sub{font-size:7pt;letter-spacing:2px;color:#555;text-transform:uppercase;margin-top:1px;display:block}')
  w.document.write('.doc-type-label{margin-top:5px;font-size:10pt;font-weight:bold;color:#cc3300;border-bottom:2px solid #cc3300;display:inline-block;padding-bottom:1px}')
  w.document.write('.banner{border:1px solid #888;text-align:center;padding:5px 0;margin:8px 0 10px;font-size:11pt;font-weight:bold;font-style:italic;letter-spacing:1px;color:#111}')
  w.document.write('.info-table{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:10px}')
  w.document.write('.info-table td{padding:2px 4px;vertical-align:top}')
  w.document.write('.info-table td.lbl{width:220px;color:#222}')
  w.document.write('.info-table td.val{width:auto}')
  w.document.write('.info-table td.val{border-bottom:1px solid #bbb;color:#111}')
  w.document.write('.info-table td.val input{border:none;background:transparent;width:100%;font-size:9pt;font-family:Arial;color:#111;padding:0}')
  w.document.write('.main-table{width:100%;border-collapse:collapse;font-size:9pt;border:1px solid #777}')
  w.document.write('.main-table th,.main-table td{border:1px solid #888;padding:4px 6px;vertical-align:middle}')
  w.document.write('.col-cat{width:90px}')
  w.document.write('.col-color{width:70px;text-align:left}')
  w.document.write('.col-qty{width:60px;text-align:right}')
  w.document.write('.th-dispatch{font-weight:bold;font-size:9pt;text-align:left;background:#fff}')
  w.document.write('.th-marks-val{font-weight:bold;font-size:9pt;text-align:center;background:#fff;width:60px}')
  w.document.write('.th-sub{font-weight:bold;font-size:9pt;text-align:left;background:#fff}')
  w.document.write('.th-sub-right{font-weight:bold;font-size:9pt;text-align:center;background:#fff;width:60px}')
  w.document.write('.row-category td{background:#c8c8c8;font-weight:bold;font-size:9pt;text-align:center;padding:3px 6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}')
  w.document.write('.row-product td{background:#efefef;font-weight:bold;font-size:9pt;text-align:center;padding:4px 6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}')
  w.document.write('.row-color td{background:#fff;font-size:9pt;padding:3px 6px;height:18px}')
  w.document.write('.row-subtotal td{background:#fff;font-size:9pt;padding:3px 6px;font-weight:700}')
  w.document.write('.sub-qty{text-align:right;width:60px;font-weight:700}')
  w.document.write('.row-grand td{background:#fff;font-weight:bold;font-size:10pt;padding:5px 6px;border-top:2px solid #444}')
  w.document.write('.grand-qty{text-align:right;width:60px}')
  w.document.write('.signatures{display:flex;justify-content:space-between;margin-top:40px}')
  w.document.write('.sig-block{display:flex;flex-direction:column}')
  w.document.write('.sig-line{width:160px;border-bottom:1px solid #333;margin-bottom:4px}')
  w.document.write('.sig-label{font-size:8pt;color:#333}')
  w.document.write('</style></head><body>'+page.innerHTML+'</body></html>')
  w.document.close()
  setTimeout(function(){w.focus();w.print()},300)
}
async function saveDOasPDF(){
  var ps=document.getElementById('pdfStatus');if(ps)ps.textContent=''
  var page=document.getElementById('do-page')
  if(!page){showMsg('DO page not found','error');return}
  if(window.refreshCompanyLogos)window.refreshCompanyLogos()
  showMsg('Generating PDF...')
  if(ps)ps.textContent='Generating PDF...'
  try{
    var fname='Delivery_Order_'+(document.getElementById('do-f-customer')?.value||'Draft')+'.pdf'
    var origStyle=page.getAttribute('style')||''
    page.style.cssText='width:210mm;padding:12mm 14mm;margin:0 auto;background:#fff;font-size:9pt;color:#000;font-family:Arial,Helvetica,sans-serif;box-shadow:none;flex:none;min-width:0'
    var savedInputs=[]
    page.querySelectorAll('input').forEach(function(el){
      savedInputs.push({el:el,parent:el.parentNode})
      var span=document.createElement('span')
      span.textContent=el.value||el.getAttribute('value')||''
      span.className='pdf-input-replace'
      span.style.cssText='border-bottom:1px solid #bbb;display:block;width:100%;font-size:9pt;font-family:Arial;color:#111;padding:1px 2px;min-height:1.2em'
      el.parentNode.replaceChild(span,el)
    })
    await new Promise(function(r){setTimeout(r,500)})
    var canvas=await html2canvas(page,{scale:2,useCORS:true,logging:false,width:Math.ceil(210*3.78),height:Math.ceil(297*3.78),backgroundColor:'#fff'})
    page.setAttribute('style',origStyle)
    savedInputs.forEach(function(s){s.parent.replaceChild(s.el,s.parent.querySelector('.pdf-input-replace'))})
    var imgData=canvas.toDataURL('image/jpeg',0.95)
    var {jsPDF}=window.jspdf
    var pdf=new jsPDF('p','mm','a4')
    var imgW=190,margin=10
    var imgH=canvas.height*imgW/canvas.width
    var pageH=297
    var totalPages=Math.ceil(imgH/pageH)
    for(var i=0;i<totalPages;i++){
      if(i>0)pdf.addPage()
      var srcY=i*pageH*canvas.width/imgW
      pdf.addImage(imgData,'JPEG',margin,-srcY*imgW/canvas.width,imgW,imgH)
    }
    var pdfBlob=pdf.output('blob')
    if(window.pdfDirHandle){
      try{
        var fileHandle=await window.pdfDirHandle.getFileHandle(fname,{create:true})
        var writable=await fileHandle.createWritable()
        await writable.write(pdfBlob)
        await writable.close()
        showMsg('PDF saved to '+window.pdfDirHandle.name+'!')
        if(ps)ps.textContent='PDF saved'
      }catch(e){
        showMsg('Folder save: '+e.message+'. Downloading instead.','error')
        downloadPdf(pdfBlob,fname)
      }
    }else{
      showMsg('No folder selected. Downloading.','error')
      downloadPdf(pdfBlob,fname)
    }
  }catch(e){
    page.querySelectorAll('.pdf-input-replace').forEach(function(sp,i){
      if(savedInputs&&savedInputs[i])savedInputs[i].parent.replaceChild(savedInputs[i].el,sp)
    })
    showMsg('PDF error: '+e.message,'error')
  }
  function downloadPdf(blob,name){
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name
    document.body.appendChild(a);a.click();document.body.removeChild(a)
    setTimeout(function(){URL.revokeObjectURL(a.href)},10000)
    showMsg('PDF downloaded!')
    if(ps)ps.textContent='PDF downloaded'
  }
}
function showMsg(msg,isError){
  let t=document.createElement('div')
  t.className='toast'
  t.innerHTML='<i class="fas '+(isError?'fa-exclamation-triangle':'fa-check-circle')+'"></i> '+msg
  document.body.appendChild(t)
  setTimeout(function(){t.remove()},2500)
}
function erpToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function erpFmt(n){if(isNaN(n))return'0.00';return Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function erpGetLegalNameByGivenName(name){if(!name)return'';try{var tx=window.allSavedTx||[];for(var i=0;i<tx.length;i++){if(tx[i].customer_vendor&&tx[i].customer_vendor.toUpperCase()===name.toUpperCase())return tx[i].customer_vendor}return name}catch(e){return name}}
function erpGetPrices(){var m={};try{var data=window.allSavedTx||[];for(var i=0;i<data.length;i++){var it=(data[i].item_name||'').trim();if(it&&data[i].transaction_type==='Buying'){if(!m[it])m[it]={buying:0}}}return m}catch(e){return m}}
function erpPostJv(date,narration,lines,type,journalName){try{var jvs=[];try{jvs=JSON.parse(localStorage.getItem('acctJournalEntries'))||[]}catch(e){}var jid='JV-'+String(jvs.length+1).padStart(4,'0');jvs.push({id:jid,date:date,narration:narration,lines:lines,type:type||'sale',journal:journalName||'Sales Journal',postedAt:Date.now()});localStorage.setItem('acctJournalEntries',JSON.stringify(jvs));return jid}catch(e){showMsg('Journal post error','error');return''}}
function erpGo(page){try{switchTab(page)}catch(e){}}
window.erpToday=erpToday;window.erpFmt=erpFmt;window.erpGetPrices=erpGetPrices;window.erpPostJv=erpPostJv;window.erpGo=erpGo;window.erpGetLegalNameByGivenName=erpGetLegalNameByGivenName;
var editingHistoryId=null
async function saveToBackend(){
  let data=transactions.filter(function(r){return r.item||r.vendor||r.qty})
  if(data.length===0){showMsg('No transactions to save','error');return}
  let sellWarnings=[]
  data.forEach(function(r){
    if(r.type!=='Selling')return
    let sellQty=parseInt(r.qty)||0
    if(!sellQty)return
    let st=getStockForItem(r.item,r.storage,r.specs,r.color,r.id||'')
    if(st.stock<sellQty)sellWarnings.push(r.item+' '+r.storage+' '+r.color+': selling '+sellQty+' but stock only '+Math.max(0,st.stock))
  })
  if(sellWarnings.length){if(!confirm(sellWarnings.slice(0,5).join('\n')+'\n\nSave anyway?'))return}
  if(editingHistoryId){DB.deleteById(editingHistoryId);editingHistoryId=null}
  // Note: editingHistoryId is for legacy single-row delete-then-add flow.
  // New flow uses updateById when row.id is present, so no delete needed.
  let saved=0,errors=0
  for(let r of data){
    try{
      let row={item_name:r.item||'',storage:r.storage||'',specs:r.specs||'',color:r.color||'',customer_vendor:r.vendor||'',quantity:parseInt(r.qty)||0,transaction_type:r.type||'',date:r.date||'',marks:r.marks||'',logistics:r.logistics||'',transaction_status:r.txnStatus||''}
      if(r.id&&DB.updateById(r.id,row)){saved++}
      else{let res=await DB.addTransaction(row);if(res)saved++}
    }catch(e){errors++}
  }
  showMsg('Saved: '+saved+' rows'+(errors?', Errors: '+errors:''))
  if(errors)return
  // Sync qty changes to pricingPending entries
  try{
    var pp=JSON.parse(localStorage.getItem('pricingPending'))||[]
    var ppChanged=false
    console.warn('[SYNC] Starting pricingPending qty sync. Rows:',data.length,'PP entries:',pp.length)
    data.forEach(function(r){
      var cn=(r.vendor||'').trim().toUpperCase()
      var mk=(r.marks||'').trim().toUpperCase()
      if(!cn){console.warn('[SYNC] Skipping row - no vendor');return}
      var hdr=(r.item+' '+r.storage+' '+r.specs).trim().replace(/^iPhone\s*/i,'')
      var ppName='IPHONE '+hdr
      var col=(r.color||'').trim()
      var qty=parseInt(r.qty)||0
      console.warn('[SYNC] Row: vendor="'+cn+'" marks="'+mk+'" ppName="'+ppName+'" color="'+col+'" qty='+qty)
      var matched=false
      pp.forEach(function(entry){
        var eCust=(entry.customer||'').trim().toUpperCase()
        var eMark=(entry.marks||'').trim().toUpperCase()
        if(eCust!==cn){console.warn('[SYNC]  Skip entry customer:"'+eCust+'" ≠ "'+cn+'"');return}
        if(eMark!==mk){console.warn('[SYNC]  Skip entry marks:"'+eMark+'" ≠ "'+mk+'"');return}
        console.warn('[SYNC]  Checking entry:'+entry.id+' items:'+(entry.items||[]).length)
        if(!entry.items)return
        entry.items.forEach(function(item){
          var matchName=item.name===ppName
          var matchColor=(item.color||'').trim()===col
          if(matchName&&matchColor){
            if(item.qty!==qty){console.warn('[SYNC]  >>> MATCH! Updating qty from '+item.qty+' to '+qty);item.qty=qty;ppChanged=true;matched=true}
            else{console.warn('[SYNC]  >>> MATCH! Same qty='+qty+', no change');matched=true}
          }
        })
      })
      if(!matched)console.warn('[SYNC] No matching pricingPending entry found for this row')
    })
    if(ppChanged){localStorage.setItem('pricingPending',JSON.stringify(pp));console.warn('[SYNC] Saved updated pricingPending to localStorage')}
    else console.warn('[SYNC] No changes to pricingPending')
  }catch(e){console.error('[SYNC] Error:',e)}
  var scrollToId=window._editingScrollToId||null
  transactions=[];transactions.push(emptyRow())
  renderEditable()
  autoBackup()
  try{fetchHistory()}catch(e){}
  refreshAllSections()
  document.getElementById('mainParseText').value=''
  if(scrollToId){
    setTimeout(function(){
      var cb=document.querySelector('#historyBody input[value="'+esc(scrollToId)+'"]')
      if(cb){cb.scrollIntoView({block:'center',behavior:'smooth'});cb.closest('tr')&&cb.closest('tr').style.setProperty('background','rgba(255,255,0,0.15)','important')}
      window._editingScrollToId=null
    },100)
  }
  }
  ;(function(){
    var venSel=document.getElementById('parseVendorSelect')
    var logSel=document.getElementById('parseLogisticsSelect')
    var markSel=document.getElementById('parseMarksSelect')
    if(venSel){VENDOR_LIST.forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v;venSel.appendChild(o)})}
    if(logSel){LOGISTICS_LIST.forEach(function(l){var o=document.createElement('option');o.value=l;o.textContent=l;logSel.appendChild(o)})}
    if(markSel){MARKS_LIST.forEach(function(m){var o=document.createElement('option');o.value=m;o.textContent=m;markSel.appendChild(o)})}
  })()
  var byId=function(id){return document.getElementById(id)}
  // Specs list for Data Control
  window.SPECS_LIST=['AA/A','Ukraine','AE/A','AH/A','AM/A','Asia-akasa','BRAZIL','AUS','Canada','China','Euro','HK','HK/KOREA','HK - ACT','HK - NOF','India','India - NOF','indonesia','AF/A','Japan','Korea','Ksa','Ksa-tra','Latin','LL/A','MALAYSIAN','singapore','singapore - ACT','Thai','Tra','UK','Usa','Usa - NOF','Vietnam','Vietnam - ACT','ZA/A','ZD/A','ZP/A','QL/A','QN/A','EURO ACTIVE']
  try{var sc=localStorage.getItem('specsList');if(sc){var p=JSON.parse(sc);if(p&&p.length)window.SPECS_LIST=p}}catch(e){}
  if(typeof refreshZs==='function')refreshZs()
  // Missing list definitions for Data Control
  if(typeof window.COLOR_LIST==='undefined'){
    window.COLOR_LIST=['Cosmic','Alpine - Blue','Alpine - Indigo','Alpine - Olive','Alpine Green','Black','BLACK TRAIL','Blue','Brown','Cream','CYAN','DARK GREEN','Deep Purple','Denim Silver','Z1FD000LQ','Z1FP000CF','MHFE4','MHFA4','MHFJ4','SKY BLUE','MHFF4','MHFC4','MDHA4','MDHE4','MDHH4','MDHD4','MDHG4','MDVH4','MDVE4','MDE14','MGE44','MGPG4','Desert','Gold','Graphite','MDHC4','Gray','Green','Jet Black','Lavender','M7L83','MDVD4','MC2L4 - Black Gold','MC2P4 - White','MC654','Z1CU1','MC6A4','MHFG4','MC6C4','MC6J4','MDV94','MMFJ3','MDH84','MDHF4','MDHJ4','MDVQ4','MDVF4','MDVN4','MMFK3','MDE34','MC6K4','Black Ocean','MC6L4','MC6T4','MC6U4','MC6V4','MC7A4','Z1H81','MXG23 MIDNIGHT','MC7C4','MGDN4','MC7D4','MC7U4','MC7V4','MGDR4','MC7W4','MC7X4','MC8G4','MC8H4','MC8J4','MC8K4','MC8Q4','MC9D4','MC9E4','MC9F4','MWUE3','MC9G4','MC9J4','MCX04','MCX14','MCX44','MCXU3','MCYT4','MD3H4','MEH34 - Starlight S/M','MEH54 - Starlight M/L','MEH94 - Midnight S/M','MEHC4 - Midnight M/L','MEHG4 - Starlight S/M','MEHJ4 - Starlight M/L','MEHN4 - Midnight S/M','MEHQ4 - Midnight M/L','MEP64 - Starlight S/M','MEP74 - Starlight M/L','MEP94 - Midnight S/M','MEPC4 - Midnight M/L','MEPE4 - Starlight S/M','MEPF4 - Starlight M/L','MEPH4 - Midnight S/M','MEPJ4 - Midnight M/L','MEQT4 - Jet Black S/M','MEQU4 - Jet Black M/L','MEQW4 - Space Grey S/M','MEQX4 - Space Grey M/L','MEU04 - Rose Gold S/M','MEU44 - Rose Gold M/L','MEU64 - Silver S/M','MEU74 - Silver M/L','MEUW4 - Jet Black S/M','MEUX4 - Jet Black M/L','MEV04 - Space Grey S/M','MEV44 - Space Grey M/L','MEV64 - Rose Gold S/M','MEV74 - Rose Gold M/L','MEV94 - Silver S/M','MEVA4 - Silver M/L','MEWC4-SILVER','MEWH4 - Natural Blue Ocean (2025)','MEWK4 - Natural Light Blue Small (2025)','MEWM4 - Natural Light Blue Medium (2025)','MEWP4 - Natural Light Blue Large (2025)','MEWR4 - Natural Blue Trail S/M (2025)','MEWU4 - Natural Blue Trail M/L (2025)','MEWW4 - Natural Milanese Small (2025)','MEWY4 - Natural Milanese Medium (2025)','MF0E4 - Natural Milanese Large (2025)','MF0J4 - Black Ocean (2025)','MF0Q4 - Black Alpine Small (2025)','MF0V4 - Black Alpine Medium (2025)','MF0X4 - Black Alpine Large (2025)','MF1D4 - Black Trail S/M (2025)','MF1H4 - Black Trail M/L (2025)','MF1N4 - Black Milanese Small (2025)','MF1Q4 - Black Milanese Medium (2025)','MF1T4 - Black Milanese Large (2025)','MF834 - Jet Black S/M','MF854 - Jet Black M/L','MF8A4 - Space Grey S/M','MF8C4 - Space Grey M/L','MF8E4 - Rose Gold S/M','MF8F4 - Rose Gold M/L','MF8H4 - Silver S/M','MF8J4 - Silver M/L','MF8M4 - Natural S/M','MF8N4 - Natural M/L','MF8P4 - Natural Milanese','MF8R4 - Slate S/M','MF8T4 - Slate M/L','MF8U4 - Slate Milanese','MF8W4 - Gold S/M','MF8X4 - Gold M/L','MF8Y4 - Gold Milanese','OBSIDIAN','MFC24 - Jet Black S/M','MFC44 - Jet Black M/L','MFC94 - Space Grey S/M','MFCA4 - Space Grey M/L','MFCG4 - Rose Gold S/M','MFCJ4 - Rose Gold M/L','MFCP4 - Silver S/M','MFCR4 - Silver M/L','MFCW4 - Natural S/M','MFCX4 - Natural M/L','MFCY4 - Natural Milanese S/M','MFD04 - Natural Milanese M/L','MFD14 - Slate S/M','MFD24 - Slate M/L','MFD34 - Slate Milanese S/M','MFD44 - Slate Milanese M/L','MFD54 - Gold S/M','MFD64 - Gold M/L','MFD74 - Gold Milanese S/M','MFD84 - Gold Milanese M/L','MGN63','MGN93','MGND3','MGPC3','Midnight','Milanese Gold','MINT','MKGT3','MKRR3 - BLACK','MLXW3','MLXX3','MLXY3','MLY03','MLY13','MLY23','MLY33','MLY43','MM9D3 - PINK','MM9F3 - STARLIGHT','MM9L3 - GREY','MM9M3 - PINK','MM9N3 - BLUE','MME63 - PURPLE','MME73','MNEH3','MNEJ3','MNEQ3','MNH93 - YELLOW OCEAN','MNHA3 - ORANGE AIPINE','MNT33 - STARLIGHT','MNT63 - BLACK','MNT83 - BLACK','MNTC3 - SILVER','MNTE3 - STARLIGHT','MNTG3 - BLACK','MNTJ3 - SILVER','MNWA3','MPHE3','MPHF3','MPHJ3','MPNY3','MQEU3 - ORANGE ALPINE','MQEV3 - ORANGE','MQF433 - Black/Grey','MQH73','MQLY3','MQRD3','MQTP3 - Black','MQTQ3 - Navy Blue','MQTR3 - Standtone','MQTT3 - Brown','MR03 - WHITE','MR7J3','MR7K3','MR8T3 - Starlight','MR8U3 - Starlight','MR8V3 - STARLIGHT','MR8W3 - Midnight','MR8X3 - Midnight','MR8Y3 - MIDNIGHT','MR903 - Blue','MR913 - Blue','MR923 - Blue','MR933 - Pink','MR943 - Pink','MR953 - Pink','MR963 - Starlight','MR973 - Starlight','MR983 - Starlight','MR993 - Midnight','MR9A3 - Midnight','MR9C3 - Midnight','MR9E3 - Silver','MR9H3 - Pink','MR9J3 - Pink','MR9U3 - Starlight','MR9V3 - Starlight','MR9W3 - Starlight','MR9X3 - MIDNIGHT','MR9Y3 - MIDNIGHT','MRE03 - MIDNIGHT','MRE13 - SILVER','MRE23 - SILVER','MRE33 - SILVER','MRE43 - STARLIGHT','MRE53 - STARLIGHT','MRE63 - STARLIGHT','MRE73 - MIDNIGHT','MRE93 - MIDNIGHT','MREA3 - MIDNIGHT','MREC3 - SILVER','MREE3 - SILVER','MREF3 - SILVER','MREG3 - Blue','MREH3 - Orange','MREJ3 - White','MREK3 - BLUE','MREP3 - BLUE','MREQ3 -Blue','MRER3 - INDIGO','MRET3 - Indigo','MREW3 - INDIGO','MREX3-OLIVE','MREY3 - OLIVE','MRF13 - ORANGE','MRF23 - ORANGE','MRF33 - GREEN GRAY','MRF43 - Green Gray','MRF63 - Blue Black','MRF83 - Orange','MRF93 - White','MRFA3 - Blue','MRFC3 - Blue','MRFD3 - Blue','MRFF3 - Indigo','MRFG3 - Indigo','MRFJ3 - Olive','MRFK3 - Olive','MRFM3 - Orange/Beige','MHFA4LL/A Silver','MC6U4LL/A Sky Blue','MW103LL/A Starlight','MXG23LL/A Midnight','MRFO3 - OLIVE','MRFP3 - Green/Gray','MRFR3 - Blue/Black','MRJ73','MRMD3 - MIDNIGHT','MRMQ3','MRMU3 - Gold','MRQH3 - Midnight','MRVT3 - Silver','MRW13','MRW23','MRW33','MRW43','MRW63','MRW73','MRX33','MRX43','MRX53','MRX63','MRX73','MRX83','MRXD3','MRXN3','MRXP3','MRXQ3','MRXR3','MRXT3','MRXU3','MRXV3','MRXW3','MRYM3','MRYN3','MRYP3','MX2T3','MRYQ3','MRYR3','MRYT3','MRYU3','MRYV3','MDH74/HN/A','MDH74','MTJV3','MTL73','MJLW4','MTL83','MU8F2','MU8F3','MU9D3','MU9D4','MU9E3','MU9E4','MUW23 - Black','MUW33 - Pink','MUW43 - Blue','MUW63','MUWA3','MV7N2','MW0W3','MDE04','MDE64','MDE44','MDE14','MQRC3','MW0X3','MW0Y3','MW103','MW123','MW133','MW1G3','MW1H3','MW1J3','MW1K3','MW1K4','MW1L3','MW1M3','MW2U3','MW2V3','MW2W3','MW2X3','MWR43 - White','MWW','MWWA3 - SILVER','MWWC3 - SILVER','MWWD3 - SILVER','MWWE3 - JET BLACK','MWWF3 - JET BLACK','MWWG3 - JET BLACK','MWWH3 - ROSE GOLD','MWWJ3 - ROSE GOLD','MWWM3 - SILVER','MWWP3 - JET BLACK','MWWQ3 - JET BLACK','MWWT3 - ROSE GOLD','MWWU3 - ROSE GOLD','MWWv3 - ROSE GOLD','MWWW3 - SILVER','MWWX3 - JET BLACK','MWWY3 - ROSE GOLD','MWWYD3 - JETBLACK','MWX03 - SILVER','MWX23 - ROSE GOLD','MWYD3 - Jet Black','MX243','MX2D3','MX2E3','MX2F3','MX2G3','MX2H3','MX2J3','MX2K3','MX2U3','MX2V3','MX2W3','MX2X3','MX2Y3','MX303','MX313','MX4D3 - NATURAL OCEAN','MX4L3 - NATURAL','MX4P3 - Black Ocean','MX4Q3 - BLACK DARK GREEN ALPINE','MX4R3 - Green alpine','MX4R3 BLACK WITH DARK GREEN','MX4T3 - BLACK','mx4u3 black trail loop','MX4V3 - BLACK','MX4V3 BLACK WITH BLACK TRAIL','MX542','MXCE3 - SILVER','MXCR3','MXCT3','MXCU3','MXCV3','MXD13','MXD23','MXD33','MXD43','MXE03','MXE73 - MIDNIGHT','MXE93-MIDNIGHT','MXEA3-MIDNIGHT','MXEC3 - SILVER','MXED3 - SILVER','MXEE3 - STARLIGHT','MXEF3 - STARLIGHT','MXEG3 - STARLIGHT','MXEH3-STARLIGHT','MXEJ3 - MIDNIGHT','MXEK3 - MIDNIGHT','MXEP3 - MIDNIGHT','MXER3 - SILVER','MXET3-SILVER','MXEV3 - STARLIGHT','MXEW3-STARLIGHT','MXF53 - STARLIGHT','MXFY3 - STARLIGHT','MXP63','MHFD4','MXP93','MYN3','MYRV3','MYT03 - Natural','MYTC3 - NAVY Black Ocean','MYTC3 BKACK OCEN BAND','MYTF3 - BLACK','MYU3','Natural','NICKEL/COPPER','Obsidian','Ocean - Blue','Ocean - Olive','Ocean - Orange','Ocean - White','Orange','Pink','Purple','Red','Rose gold','Sage','Sierra Blue','Silver','Silver/Winter Blue','slate milanese','Space Black','Space Gray','Starlight','STRAWBERRY BRONZE','Teal','Trial - Blue/Black','Trial - Green','Trial - Green/Gray','Trial - Orange','Ultramarine','White','YELLOW','Yellow','Z15T000JQ','Z1JV000118']
    try{var c=localStorage.getItem('colorList');if(c){var p=JSON.parse(c);if(p&&p.length)window.COLOR_LIST=p}}catch(e){}
  }
  if(typeof window.STORAGE_LIST==='undefined'){
    window.STORAGE_LIST=['12/1TB','12/256GB','12/512GB','128GB','16/1TB','16/256GB','16/512GB','18/1TB','18/512GB','1TB','2 TB','24/1TB','24/256GB','24/512GB','256GB','2TB','36/1TB','36/512GB','4/128GB','40MM - M/L','40MM - S/M','41MM','41MM - L','41MM - M','41MM - M/L','41MM - S','41MM - S/M','42MM','42MM - M/L','42MM - S/M','44MM','44MM - M/L','44MM - S/M','45MM','45MM - L','45MM - M','45MM - M/L','45MM - S','45MM - S/M','46MM','46MM - M/L','46MM - S/M','48/1TB','48/512GB','49MM','49MM - L','49MM - M','49MM - M/L','49MM - S','49MM - S/M','512GB','6/128GB','6/256GB','64GB','12/128GB','8/1TB','8/256GB','8/512GB']
    try{var s=localStorage.getItem('storageList');if(s){var p=JSON.parse(s);if(p&&p.length)window.STORAGE_LIST=p}}catch(e){}
  }
  try{var vc=localStorage.getItem('vendor_custom');if(vc){var p=JSON.parse(vc);if(p&&p.length)p.forEach(function(x){if(!VENDOR_LIST.some(function(v){return v.toUpperCase()===x.toUpperCase()}))VENDOR_LIST.push(x)})}}catch(e){}
  try{var mc=localStorage.getItem('marks_custom');if(mc){var p=JSON.parse(mc);if(p&&p.length)p.forEach(function(x){if(!MARKS_LIST.some(function(m){return m.toUpperCase()===x.toUpperCase()}))MARKS_LIST.push(x)})}}catch(e){}
  try{var lc=localStorage.getItem('logistics_custom');if(lc){var p=JSON.parse(lc);if(p&&p.length)p.forEach(function(x){if(!LOGISTICS_LIST.some(function(l){return l.toUpperCase()===x.toUpperCase()}))LOGISTICS_LIST.push(x)})}}catch(e){}
  // Safe list accessor for Data Control
  function getDCList(type){
    if(type==='item')return ITEM_LIST
    if(type==='mark')return MARKS_LIST
    if(type==='logistics')return LOGISTICS_LIST
    if(type==='vendor')return VENDOR_LIST
    if(type==='color'){if(typeof window.COLOR_LIST==='undefined')window.COLOR_LIST=[];return window.COLOR_LIST}
    if(type==='storage'){if(typeof window.STORAGE_LIST==='undefined')window.STORAGE_LIST=[];return window.STORAGE_LIST}
    if(type==='specs'){if(typeof window.SPECS_LIST==='undefined')window.SPECS_LIST=[];return window.SPECS_LIST}
    return []
  }
  // Data Control: refresh list displays
  function dcRenderLists(){
    var ids={item:'dcItemList',mark:'dcMarkList',color:'dcColorList',storage:'dcStorageList',logistics:'dcLogisticsList',vendor:'dcVendorList',specs:'dcSpecsList'}
    Object.keys(ids).forEach(function(k){
      var el=byId(ids[k]);if(!el)return
      var arr=getDCList(k)
      el.innerHTML=arr.map(function(v,i){return '<div style="padding:2px 0;font-size:0.7rem;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><span>'+esc(v)+'</span><span style="cursor:pointer;color:#ff3b30" onclick="dcRemove(\''+k+'\','+i+')">&times;</span></div>'}).join('')
    })
  }
  // Data Control: add item
  window.dcAdd=function(type){
    var inputMap={item:'dcNewItem',mark:'dcNewMark',color:'dcNewColor',storage:'dcNewStorage',logistics:'dcNewLogistics',vendor:'dcNewVendor',specs:'dcNewSpecs'}
    var storeMap={item:'itemList',mark:'marks_custom',color:'colorList',storage:'storageList',logistics:'logistics_custom',vendor:'vendor_custom',specs:'specsList'}
    var inp=byId(inputMap[type]);if(!inp)return
    var v=inp.value.trim();if(!v)return
    var list=getDCList(type)
    if(!list||list.includes(v)){showMsg('Already exists','error');return}
    list.push(v);inp.value=''
    try{localStorage.setItem(storeMap[type],JSON.stringify(list))}catch(e){}
    if(type==='specs'&&typeof refreshZs==='function')refreshZs()
    dcRenderLists();refreshEntryDatalists();showMsg(type.charAt(0).toUpperCase()+type.slice(1)+' added')
  }
  // Data Control: remove item
  window.dcRemove=function(type,idx){
    var storeMap={item:'itemList',mark:'marks_custom',color:'colorList',storage:'storageList',logistics:'logistics_custom',vendor:'vendor_custom',specs:'specsList'}
    var list=getDCList(type);if(!list||idx<0||idx>=list.length)return
    list.splice(idx,1)
    try{localStorage.setItem(storeMap[type],JSON.stringify(list))}catch(e){}
    if(type==='specs'&&typeof refreshZs==='function')refreshZs()
    dcRenderLists();refreshEntryDatalists()
  }
  // Refresh entry form datalists and storage dropdowns from Data Control lists
  window.refreshEntryDatalists=function(){
    var dlMap={vendorDatalist:VENDOR_LIST,marksDatalist:MARKS_LIST,logisticsDatalist:LOGISTICS_LIST,itemDatalist:ITEM_LIST,colorDatalist:window.COLOR_LIST||[],storageDatalist:window.STORAGE_LIST||[],specsDatalist:window.SPECS_LIST||[]}
    Object.keys(dlMap).forEach(function(id){
      var el=document.getElementById(id)
      if(!el){el=document.createElement('datalist');el.id=id;document.body.appendChild(el)}
      el.innerHTML=dlMap[id].map(function(v){return '<option value="'+esc(v)+'">'}).join('')
    })
  }
  // History: fetch all data and render
  window.fetchHistory=function(){
    allSavedTx=DB.getTransactions()
    renderHistory()
  }
  // History: render table with inline column filters
  window._hfState={}
  window._selectedHistoryIds={}
  window._hfTimers={}
  window.onFilterSelect=function(sel){
    window._hfState[sel.id]=sel.value
    renderHistory()
  }
  window.clearHistoryFilters=function(){
    window._hfState={}
    renderHistory()
  }
  window.toggleSDrop=function(id){
    var menu=document.getElementById(id+'_menu')
    if(!menu)return
    var isOpen=menu.classList.contains('show')
    // Close all other dropdowns
    document.querySelectorAll('.sdrop-menu.show').forEach(function(m){m.classList.remove('show')})
    if(!isOpen){
      var wrap=document.getElementById(id+'_wrap')
      if(wrap){
        var btn=wrap.querySelector('.sdrop-btn')
        if(btn){
          var r=btn.getBoundingClientRect()
          menu.style.left=r.left+'px'
          menu.style.top=r.bottom+'px'
          menu.style.width=r.width+'px'
        }
      }
      menu.classList.add('show')
      var search=menu.querySelector('.sdrop-search')
      if(search){search.value='';search.focus();filterSDrop(search,id)}
    }
  }
  window.filterSDrop=function(input,id){
    var q=input.value.toLowerCase()
    var list=document.getElementById(id+'_menu_list')
    if(!list)return
    list.querySelectorAll('.sdrop-opt').forEach(function(opt){
      if(opt.textContent.toLowerCase().indexOf(q)>=0||opt.textContent==='All')opt.style.display=''
      else opt.style.display='none'
    })
  }
  window.selectSDrop=function(id,val){
    var hidden=document.getElementById(id)
    if(!hidden)return
    hidden.value=val
    // Update button text
    var wrap=document.getElementById(id+'_wrap')
    if(wrap){
      var btn=wrap.querySelector('.sdrop-btn')
      if(btn)btn.textContent=val||'All'
    }
    // Close menu
    var menu=document.getElementById(id+'_menu')
    if(menu)menu.classList.remove('show')
    onFilterSelect(hidden)
  }
  // Close dropdowns when clicking outside
  document.addEventListener('click',function(e){
    if(!e.target.closest('.sdrop')){
      document.querySelectorAll('.sdrop-menu.show').forEach(function(m){m.classList.remove('show')})
    }
  })
  window.renderHistory=function(){
    var hdr=byId('historyHeader'),bd=byId('historyBody'),cnt=byId('historyCount')
    if(!hdr||!bd)return
    var cols=['✓','Date','Type','Customer/Vendor','Marks','Item','Storage','Specs','Color','QTY','Status','Logistics','Actions']
    var fields=['','date','transaction_type','customer_vendor','marks','item_name','storage','specs','color','quantity','transaction_status','logistics','']
    var fids=['','hf_date','hf_transaction_type','hf_customer_vendor','hf_marks','hf_item_name','hf_storage','hf_specs','hf_color','hf_quantity','hf_transaction_status','hf_logistics','']
    window._hfSort=window._hfSort||'newest'
    function uvals(field){
      var vals={},order=[]
      ;(allSavedTx||[]).forEach(function(r){
        var v=String(r[field]||'').trim()
        if(v&&!vals[v]){vals[v]=true;order.push(v)}
      })
      return order.sort()
    }
    function selOpts(id,field,selected){
      var vals=uvals(field)
      var sv=window._hfState[id]||''
      var did=id+'_menu'
      var h='<div class="sdrop" id="'+id+'_wrap">'
      h+='<input type="hidden" class="hfc" id="'+id+'" value="'+esc(sv)+'" onchange="onFilterSelect(this)">'
      h+='<div class="sdrop-btn" onclick="toggleSDrop(\''+id+'\')">'+(sv?esc(sv):'All')+'</div>'
      h+='<div class="sdrop-menu" id="'+did+'">'
      h+='<input class="sdrop-search" placeholder="Search..." oninput="filterSDrop(this,\''+id+'\')">'
      h+='<div class="sdrop-list" id="'+did+'_list">'
      h+='<div class="sdrop-opt'+(!sv?' active':'')+'" onclick="selectSDrop(\''+id+'\',\'\')">All</div>'
      vals.forEach(function(v){
        h+='<div class="sdrop-opt'+(sv===v?' active':'')+'" onclick="selectSDrop(\''+id+'\',\''+escAttr(v)+'\')">'+esc(v)+'</div>'
      })
      h+='</div></div></div>'
      return h
    }
    // Always rebuild filter row to keep dropdown options fresh
    var ftr='<tr class="filter-row" id="historyFilterRow"><th></th>'
    for(var fi=1;fi<cols.length-1;fi++){
      var f=fields[fi],id=fids[fi]
      if(f==='date'){
        var dv=window._hfState[id]||''
        ftr+='<th><input class="hfc" type="date" id="'+id+'" value="'+dv+'" onchange="onFilterSelect(this)"></th>'
      }else if(f==='quantity'){
        ftr+='<th></th>'
      }else if(f){
        ftr+='<th>'+selOpts(id,f)+'</th>'
      }else{
        ftr+='<th></th>'
      }
    }
    ftr+='<th></th></tr>'
    hdr.innerHTML=ftr+'<tr>'+cols.map(function(c,i){return i===0?'<th style="width:30px"><input type="checkbox" id="selectAllHistory" onchange="toggleSelectAllHistory(this)"></th>':'<th'+(i===cols.length-1?' style="width:50px"':'')+'>'+c+'</th>'}).join('')+'</tr>'
    // Apply filters (AND logic, exact match for dropdowns)
    var rows=(allSavedTx||[]).filter(function(r){
      var f=window._hfState
      function t(v){return String(v||'').trim().toLowerCase()}
      if(f.hf_date&&r.date!==f.hf_date)return false
      if(f.hf_transaction_type&&t(r.transaction_type)!==t(f.hf_transaction_type))return false
      if(f.hf_customer_vendor&&t(r.customer_vendor)!==t(f.hf_customer_vendor))return false
      if(f.hf_item_name&&t(r.item_name)!==t(f.hf_item_name))return false
      if(f.hf_color&&t(r.color)!==t(f.hf_color))return false
      if(f.hf_marks&&t(r.marks)!==t(f.hf_marks))return false
      if(f.hf_logistics&&t(r.logistics)!==t(f.hf_logistics))return false
      if(f.hf_storage&&t(r.storage)!==t(f.hf_storage))return false
      if(f.hf_specs&&t(r.specs)!==t(f.hf_specs))return false
      if(f.hf_transaction_status&&t(r.transaction_status)!==t(f.hf_transaction_status))return false
      return true
    })
    if(cnt)cnt.textContent=rows.length
    var fc=byId('historyFilterCount')
    if(fc)fc.textContent=rows.length<(allSavedTx||[]).length?'Showing '+rows.length+' of '+(allSavedTx||[]).length:''
    // Sort rows
    var sortType=window._hfSort||'newest'
    if(sortType==='az'){
      rows=rows.slice().sort(function(a,b){return (a.transaction_type||'').localeCompare(b.transaction_type||'')})
    }else if(sortType==='za'){
      rows=rows.slice().sort(function(a,b){return (b.transaction_type||'').localeCompare(a.transaction_type||'')})
    }else if(sortType==='oldest'){
      rows=rows.slice().sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))})
    }else{
      rows=rows.slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))})
    }
    bd.innerHTML=rows.map(function(r){
      var eid=esc(r.id||'')
      var chk=window._selectedHistoryIds&&window._selectedHistoryIds[eid]?' checked':''
      function fmtDate(d){if(!d)return'';if(/^\d{4}-\d{2}-\d{2}$/.test(d)){var p=d.split('-'),dt=new Date(p[0],p[1]-1,p[2]);if(!isNaN(dt)){var mos=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return p[2]+'-'+mos[parseInt(p[1])-1]+'-'+p[0]}}return d}
      return '<tr>'+'<td style="width:30px;text-align:center"><input type="checkbox" class="hrow-cb" value="'+eid+'"'+chk+' onchange="onHistoryCheckChange()"></td>'+fields.map(function(f,i){return i===0?'':f==='date'?'<td>'+(fmtDate(r[f])||'')+'</td>':f?'<td>'+(r[f]||'')+'</td>':''}).join('')
        +'<td style="white-space:nowrap"><button class="btn" style="font-size:0.6rem;padding:2px 6px" onclick="editHistoryRow(\''+eid+'\')" title="Edit"><i class="fas fa-edit"></i></button>'
        +'<button class="btn" style="font-size:0.6rem;padding:2px 6px;color:#ff3b30;margin-left:3px" onclick="deleteHistoryRow(\''+eid+'\')" title="Delete"><i class="fas fa-trash"></i></button></td>'
        +'</tr>'
    }).join('')
    // Grand total
    var gt=byId('historyGrandTotal')
    if(gt){
      var totalQty=rows.reduce(function(s,r){return s+(parseInt(r.quantity)||0)},0)
      gt.innerHTML='<span>Total Transactions: <strong>'+rows.length+'</strong></span><span>Total QTY: <strong style="color:#1e3c72">'+totalQty+'</strong></span>'
    }
  }
  // Apply filters for balance view
  window.applyFilters=function(){renderBalance()}
  // Refresh all sections (stub - called from many places)
  window.refreshAllSections=function(){
    try{fetchHistory()}catch(e){}
    renderBalance()
    dcRenderLists()
    try{window.refreshApprovalView()}catch(e){}
    try{window.refreshPricingView()}catch(e){}
    try{window.refreshWarehouseView()}catch(e){}
    // Refresh DO customer datalist
    try{refreshDOCustomers()}catch(e){}
    try{refreshDOCustomerList()}catch(e){}
    if(typeof updateTabNotifs==='function')try{updateTabNotifs()}catch(e){}
  }
  // Copy history for Excel (stub)
  window.copyHistoryExcel=function(){
    var rows=allSavedTx||[],lines=['Date\tType\tCustomer/Vendor\tMarks\tItem\tStorage\tSpecs\tColor\tQTY\tStatus\tLogistics']
    rows.forEach(function(r){lines.push([r.date,r.transaction_type,r.customer_vendor,r.marks,r.item_name,r.storage,r.specs,r.color,r.quantity,r.transaction_status,r.logistics].join('\t'))})
    var ta=document.createElement('textarea');ta.value=lines.join('\n');document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)
    showMsg('Copied '+rows.length+' rows for Excel')
  }
  // Export CSV (stub)
  window.importHistoryExcel=function(){
    var inp=document.getElementById('importHistoryFileInput')
    if(!inp||!inp.files||!inp.files[0]){showMsg('Select an Excel file first','error');return}
    var file=inp.files[0]
    var reader=new FileReader()
    reader.onload=function(e){
      try{
        var data=new Uint8Array(e.target.result)
        var wb=XLSX.read(data,{type:'array'})
        var ws=wb.Sheets[wb.SheetNames[0]]
        var json=XLSX.utils.sheet_to_json(ws,{defval:''})
        if(!json||!json.length){showMsg('No data found in file','error');return}
        var colMap={}
        var headers=Object.keys(json[0])
        var unmatchedHeaders=[]
        var fieldFromHeader={'date':['date','datum','date time','timestamp','created','created at'],'transaction_type':['type','transaction_type','transaction type','txn type','txn_type','side'],'customer_vendor':['customer','vendor','customer_vendor','customer/vendor','customer name','vendor name','party','client','supplier'],'marks':['marks','mark','lot','batch','ref'],'item_name':['item','item_name','product','model','description','item name','name','product name','device'],'storage':['storage','size','storages','capacity','ssd','hdd','space','disk','rom','memory','ram'],'specs':['specs','spec','country','origin','variation'],'color':['color','colour','colors','colours'],'quantity':['qty','quantity','q','count','pcs','pieces','units','amount','qty.','nos'],'transaction_status':['status','transaction_status','transaction status','txn_status','order status','delivery status'],'logistics':['logistics','logistic','shipping','courier','delivery','logistics company','transporter']}
        Object.keys(fieldFromHeader).forEach(function(field){
          var aliases=fieldFromHeader[field]
          for(var h of headers){
            var hc=h.toString().toLowerCase().trim()
            for(var a of aliases){
              if(hc===a||hc.replace(/[\s_-]/g,'')===a.replace(/[\s_-]/g,'')){
                colMap[field]=h;break
              }
            }
            if(colMap[field])break
          }
        })
        // Report unmatched columns
        var mappedFields=Object.keys(colMap)
        headers.forEach(function(h){
          if(!mappedFields.some(function(f){return colMap[f]===h})){
            unmatchedHeaders.push(h)
          }
        })
        if(unmatchedHeaders.length){
          showMsg('Unmatched columns: '+unmatchedHeaders.join(', '),'error')
        }
        function parseImportDate(v){
          if(!v||v==='')return ''
          if(typeof v==='number'){
            var d=new Date((v-25569)*86400*1000)
            if(!isNaN(d))return d.toISOString().split('T')[0]
            return String(v)
          }
          var s=String(v).trim()
          // Already YYYY-MM-DD
          if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s
          // DD/MM/YY or DD/MM/YYYY or D/M/YY
          var m=s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/)
          if(m){
            var dd=m[1],mm=m[2],yy=m[3]
            if(yy.length===2)yy='20'+yy
            return yy+'-'+mm.padStart(2,'0')+'-'+dd.padStart(2,'0')
          }
          // DD-MMM-YY or DD-MMM-YYYY (e.g. 14-Jun-24)
          var m2=s.match(/^(\d{1,2})[\/\.-](\w{3,})[\/\.-](\d{2,4})$/i)
          if(m2){
            var months={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'}
            var mn=months[m2[2].toLowerCase().slice(0,3)]
            if(mn){
              var y=m2[3];if(y.length===2)y='20'+y
              return y+'-'+mn+'-'+m2[1].padStart(2,'0')
            }
          }
          // DDMYY or DDMYYYY or DDMMYY (no separators) e.g. 140624
          var m3=s.match(/^(\d{2})(\d{2})(\d{2,4})$/)
          if(m3){
            var y3=m3[3];if(y3.length===2)y3='20'+y3
            return y3+'-'+m3[2].padStart(2,'0')+'-'+m3[1].padStart(2,'0')
          }
          // MMDDYY (US format)
          var m4=s.match(/^(\d{2})(\d{2})(\d{2})$/)
          if(m4){
            var d4=parseInt(m4[2]),m4v=parseInt(m4[1])
            if(d4>12)return '20'+m4[3]+'-'+m4[1]+'-'+m4[2] // DDMMYY
            if(m4v>12)return '20'+m4[3]+'-'+m4[2]+'-'+m4[1] // MMDDYY
            return '20'+m4[3]+'-'+m4[1]+'-'+m4[2]
          }
          return s
        }
        var typeMap={'buying':'Buying','selling':'Selling','opening':'Opening','return':'Return','transfer':'Transfer','buy':'Buying','sell':'Selling','open':'Opening'}
        function parseQty(v){
          if(v===null||v===undefined||v==='')return 0
          if(typeof v==='number')return Math.round(v)
          var s=String(v).replace(/[\s,]/g,'').replace(/[^\d.\-]/g,'')
          if(!s||s==='-'||s==='.')return 0
          var n=parseFloat(s)
          if(isNaN(n))return 0
          return Math.round(n)
        }
        var txns=[],errors=0
        json.forEach(function(row,idx){
          var rawType=String(row[colMap.transaction_type]||'Selling').trim()
          var normType=typeMap[rawType.toLowerCase()]||rawType
          var t={date:parseImportDate(row[colMap.date]),
            transaction_type:normType,
            customer_vendor:String(row[colMap.customer_vendor]||''),
            marks:String(row[colMap.marks]||''),
            item_name:String(row[colMap.item_name]||''),
            storage:String(row[colMap.storage]||''),
            specs:String(row[colMap.specs]||''),
            color:String(row[colMap.color]||''),
            quantity:parseQty(row[colMap.quantity]),
            transaction_status:String(row[colMap.transaction_status]||''),
            logistics:String(row[colMap.logistics]||'')}
          if(t.item_name||t.color||t.quantity)txns.push(t)
          else errors++
        })
        if(!txns.length){showMsg('No valid rows found','error');return}
        var count=DB.insertTransactions(txns)
        allSavedTx=DB.getTransactions()
        renderHistory()
        refreshAllSections()
        showMsg('Imported '+count+' rows'+(errors?' ('+errors+' skipped)':''))
        inp.value=''
      }catch(err){showMsg('Error: '+err.message,'error')}
    }
    reader.readAsArrayBuffer(file)
  }
  window.exportCSV=function(){
    var rows=allSavedTx||[],lines=['Date,Type,Customer/Vendor,Marks,Item,Storage,Specs,Color,QTY,Status,Logistics']
    rows.forEach(function(r){lines.push(['"'+r.date+'"','"'+r.transaction_type+'"','"'+r.customer_vendor+'"','"'+r.marks+'"','"'+r.item_name+'"','"'+r.storage+'"','"'+r.specs+'"','"'+r.color+'"',r.quantity,'"'+r.transaction_status+'"','"'+r.logistics+'"'].join(','))})
    var blob=new Blob([lines.join('\n')],{type:'text/csv'}),a=document.createElement('a')
    a.href=URL.createObjectURL(blob);a.download='transactions_'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a)
    showMsg('Downloaded '+rows.length+' rows as CSV')
  }
  window.toggleSelectAllHistory=function(el){
    var cbs=document.querySelectorAll('.hrow-cb')
    cbs.forEach(function(cb){cb.checked=el.checked})
    window._selectedHistoryIds={}
    if(el.checked){
      cbs.forEach(function(cb){window._selectedHistoryIds[cb.value]=true})
    }
    updateHistorySelectionUI()
  }
  window.onHistoryCheckChange=function(){
    var allCb=document.getElementById('selectAllHistory')
    var cbs=document.querySelectorAll('.hrow-cb')
    var checked=0
    window._selectedHistoryIds={}
    cbs.forEach(function(cb){
      if(cb.checked){checked++;window._selectedHistoryIds[cb.value]=true}
    })
    if(allCb)allCb.checked=checked===cbs.length&&cbs.length>0
    updateHistorySelectionUI()
  }
  function updateHistorySelectionUI(){
    var ids=Object.keys(window._selectedHistoryIds)
    var countEl=document.getElementById('historySelectedCount')
    var delBtn=document.getElementById('deleteSelectedBtn')
    var editBtn=document.getElementById('editSelectedBtn')
    if(countEl){countEl.textContent=ids.length+' selected';countEl.style.display=ids.length?'inline':'none'}
    if(delBtn)delBtn.style.display=ids.length?'inline-flex':'none'
    if(editBtn)editBtn.style.display=ids.length>=1?'inline-flex':'none'
  }
  window.editHistoryRow=function(id){
    if(!id)return
    var row=null
    for(var i=0;i<allSavedTx.length;i++){if(String(allSavedTx[i].id)===String(id)){row=allSavedTx[i];break}}
    if(!row){showMsg('Row not found','error');return}
    window._editingScrollToId=String(row.id)
    editingHistoryId=null // updateById will handle this via row.id
    transactions=[{
      id:row.id,item:row.item_name||'',storage:row.storage||'',specs:row.specs||'',color:row.color||'',
      vendor:row.customer_vendor||'',qty:parseInt(row.quantity)||0,type:row.transaction_type||'',
      date:row.date||'',marks:row.marks||'',logistics:row.logistics||'',txnStatus:row.transaction_status||''
    }]
    renderEditable()
    try{switchTab('entry')}catch(e){}
    showMsg('Row loaded for editing. Edit then click SAVE TO DATABASE.')
  }
  window.deleteHistoryRow=function(id){
    if(!id)return
    if(!confirm('Delete this transaction permanently?'))return
    DB.deleteById(id)
    fetchHistory()
    refreshAllSections()
    showMsg('Transaction deleted')
  }
  if(el=byId('themeToggle'))el.addEventListener('click',function(){
    document.body.classList.toggle('dark-mode')
    var icon=this.querySelector('i'),label=document.getElementById('themeLabel')
    if(document.body.classList.contains('dark-mode')){if(icon)icon.className='fas fa-moon';if(label)label.textContent='Dark'}else{if(icon)icon.className='fas fa-sun';if(label)label.textContent='Light'}
    try{localStorage.setItem('darkMode',document.body.classList.contains('dark-mode')?'1':'0')}catch(e){}
  })
  ;(function(){try{if(localStorage.getItem('darkMode')==='1')document.body.classList.add('dark-mode')}catch(e){}})()
  if(el=byId('aiSaveKeyBtn'))el.addEventListener('click',function(){
    var key=document.getElementById('aiApiKey').value.trim()
    if(key){try{localStorage.setItem('aiApiKey',key)}catch(e){};document.getElementById('aiStatus').textContent='✓ Key saved'}
    else{document.getElementById('aiStatus').textContent='Enter API key'}
  })
  ;(function(){try{var saved=localStorage.getItem('aiApiKey');if(saved){document.getElementById('aiApiKey').value=saved;document.getElementById('aiStatus').textContent='✓ Key saved'}}catch(e){}})()
  ;(function(){try{var afSaved=localStorage.getItem('autoFixTypos');if(afSaved==='1'){var af=document.getElementById('autoFixTyposToggle');if(af)af.checked=true}}catch(e){}})()
  if(el=byId('autoFixTyposToggle'))el.addEventListener('change',function(){
    try{localStorage.setItem('autoFixTypos',this.checked?'1':'0')}catch(e){}
  })
  var el
  if(el=byId('clearLearnedBtn'))el.addEventListener('click',clearLearned)
  if(el=byId('showLearnedBtn'))el.addEventListener('click',function(){
    var d=byId('learnedItemsDisplay');if(!d)return
    if(d.style.display==='none'||!d.style.display){d.style.display='block';showLearnedItems()}
    else d.style.display='none'
  })
  if(el=byId('loadListsBtn'))el.addEventListener('click',loadLists)
  if(el=byId('addMarkBtn'))el.addEventListener('click',function(){
    var v=document.getElementById('newMarkInput').value.trim()
    if(!v||MARKS_LIST.includes(v))return
    MARKS_LIST.push(v)
    try{localStorage.setItem('marks_custom',JSON.stringify(MARKS_LIST.filter(function(m){return m!=='No Mark'})))}catch(e){}
    addLearnedItem(v,'Marks')
    var dl=document.getElementById('marksDatalist')
    if(dl)dl.innerHTML=MARKS_LIST.map(function(m){return '<option value="'+esc(m)+'">'}).join('')
    document.getElementById('newMarkInput').value=''
    showMsg('Mark added: '+v)
  })
  function addCustomListItem(list,key,inputId,datalistId,label){
    var v=document.getElementById(inputId).value.trim()
    if(!v)return
    if(list.includes(v)){showMsg('Already exists: '+v,'error');return}
    list.push(v)
    try{localStorage.setItem(key,JSON.stringify(list))}catch(e){}
    addLearnedItem(v,label)
    var dl=document.getElementById(datalistId)
    if(dl)dl.innerHTML=list.map(function(x){return '<option value="'+esc(x)+'">'}).join('')
    document.getElementById(inputId).value=''
    showMsg(label+' added: '+v)
  }
  if(el=byId('addVendorBtn'))el.addEventListener('click',function(){addCustomListItem(VENDOR_LIST,'vendor_custom','newVendorInput','vendorDatalist','Vendor')})
  if(el=byId('addLogisticsBtn'))el.addEventListener('click',function(){addCustomListItem(LOGISTICS_LIST,'logistics_custom','newLogisticsInput','logisticsDatalist','Logistics')})
  if(el=byId('addRowBtn'))el.addEventListener('click',function(){transactions.push(emptyRow());renderEditable()})
  if(el=byId('addRowBtnTop'))el.addEventListener('click',function(){transactions.push(emptyRow());renderEditable()})
  if(el=byId('copyEntryExcelBtnTop'))el.addEventListener('click',function(){var eb=byId('copyEntryExcelBtn');if(eb)eb.click()})
  if(el=byId('clearAllBtn'))el.addEventListener('click',function(){if(confirm('Clear all rows?')){transactions=[emptyRow()];renderEditable()}})
  if(el=byId('mainParseBtn'))el.addEventListener('click',function(){
    var txt=byId('mainParseText');if(!txt||!txt.value.trim()){showMsg('Paste text first','error');return}
    var type=(byId('parseTypeSelect')||{}).value||'Buying'
    var vendor=(byId('parseVendorSelect')||{}).value||''
    var logistics=(byId('parseLogisticsSelect')||{}).value||''
    var marks=(byId('parseMarksSelect')||{}).value||''
    parseText(txt.value,type,logistics,marks,vendor)
  })
  if(el=byId('saveToBackendBtn'))el.addEventListener("click",async function(){await saveToBackend();triggerCloudSync()})
  ;(function(){
    var wrap=document.getElementById('editableTableWrap')
    if(!wrap)return
    var leftBtn=document.getElementById('editableScrollLeft')
    var rightBtn=document.getElementById('editableScrollRight')
    if(!leftBtn||!rightBtn)return
    function updateArrows(){
      leftBtn.disabled=wrap.scrollLeft<=2
      rightBtn.disabled=wrap.scrollLeft>=wrap.scrollWidth-wrap.clientWidth-2
    }
    leftBtn.addEventListener('click',function(){wrap.scrollBy({left:-300,behavior:'smooth'});setTimeout(updateArrows,300)})
    rightBtn.addEventListener('click',function(){wrap.scrollBy({left:300,behavior:'smooth'});setTimeout(updateArrows,300)})
    wrap.addEventListener('scroll',updateArrows)
    var origRender=renderEditable
    renderEditable=function(){origRender();setTimeout(updateArrows,50)}
    setTimeout(updateArrows,200)
  })()
  ;(function(){
    var tbody=document.getElementById('editableBody')
    if(!tbody)return
    tbody.addEventListener('keydown',function(e){
      var el=e.target
      if(!el.matches('input,select'))return
      if(e.ctrlKey||e.altKey||e.metaKey)return
      if(e.key==='Tab')return
      var map={ArrowRight:{dr:0,dc:1},ArrowLeft:{dr:0,dc:-1},ArrowDown:{dr:1,dc:0},ArrowUp:{dr:-1,dc:0},Enter:{dr:1,dc:0}}
      var mv=map[e.key]
      if(!mv)return
      e.preventDefault()
      var td=el.closest('td'),tr=td.closest('tr')
      var rows=Array.from(tbody.querySelectorAll(':scope > tr'))
      var rowIdx=rows.indexOf(tr)
      if(mv.dc){
        var cells=Array.from(tr.children).filter(function(c){var inp=c.querySelector('input,select');return inp&&!inp.disabled})
        var ci=cells.indexOf(td),ti=ci+mv.dc
        if(ti<0||ti>=cells.length)return
        var tgt=cells[ti].querySelector('input,select')
        if(!tgt||tgt.disabled)return
        tgt.focus();if(tgt.tagName==='INPUT')tgt.select()
      }else{
        var field=el.dataset.field
        var tgtRow=rows[rowIdx+mv.dr]
        if(!tgtRow)return
        var tgt=tgtRow.querySelector('[data-field="'+field+'"]')
        if(!tgt||tgt.disabled)return
        tgt.focus();if(tgt.tagName==='INPUT')tgt.select()
      }
    })
    // Ctrl+D: copy ITEM, STORAGE, SPECS, COLOR from current row to next row
    tbody.addEventListener('keydown',function(e){
      if(!(e.ctrlKey||e.metaKey)||e.key!=='d'&&e.key!=='D')return
      var el=e.target
      if(!el.matches('input,select'))return
      e.preventDefault()
      var tr=el.closest('tr')
      if(!tr)return
      var rows=Array.from(tbody.querySelectorAll(':scope > tr'))
      var rowIdx=rows.indexOf(tr)
      var nextRow=rows[rowIdx+1]
      if(!nextRow)return
      var fields=['item','storage','specs','color']
      fields.forEach(function(f){
        var src=tr.querySelector('[data-field="'+f+'"]')
        var dst=nextRow.querySelector('[data-field="'+f+'"]')
        if(!src||!dst||dst.disabled)return
        if(dst.tagName==='SELECT'){
          dst.value=src.value
        }else{
          dst.value=src.value
        }
        dst.dispatchEvent(new Event('input',{bubbles:true}))
        dst.dispatchEvent(new Event('change',{bubbles:true}))
      })
      var srcItem=tr.querySelector('[data-field="item"]')
      if(srcItem){srcItem.focus();if(srcItem.tagName==='INPUT')srcItem.select()}
    })
  })()
  // Header backup/restore/folder buttons
  window._backupFileHandle=null
  if(el=byId('headerBrowseFolderBtn'))el.addEventListener('click',async function(){
    if(!window.showDirectoryPicker){showMsg('Folder picker not supported','error');return}
    try{
      var handle=await window.showDirectoryPicker()
      window._backupDirHandle=handle
      try{
        window._backupFileHandle=await handle.getFileHandle('backup.json',{create:true})
        localStorage.setItem('backupFolderName',handle.name)
      }catch(e){}
      var fn=byId('headerFolderName');if(fn)fn.textContent='📁 '+handle.name
      showMsg('Backup folder: '+handle.name)
    }catch(e){if(e.name!='AbortError')showMsg('Folder selection failed','error')}
  })
  ;(function(){
    try{
      var saved=localStorage.getItem('backupFolderName')||''
      if(saved){
        var fn=byId('headerFolderName');if(fn)fn.textContent='📁 '+saved
      }
    }catch(e){}
  })()
  if(el=byId('headerBackupBtn'))el.addEventListener('click',function(){
    try{
      var data=window.createFullBackup()
      var msgs=['Saved in browser']
      // Write to folder file if handle exists
      ;(async function(){
        try{
          if(window._backupFileHandle){
            var w=await window._backupFileHandle.createWritable()
            await w.write(JSON.stringify({
              version:2,backedUpAt:data.backedUpAt,
              database:data.database,pricingPending:data.pricingPending,
              pricingSubmittedKeys:data.pricingSubmittedKeys,
              users:data.users,
              localStorage:data.localStorage
            },null,2))
            await w.close()
            showMsg('Full backup saved to folder!')
          }else{
            showMsg('Full backup saved in browser. Select a folder for file backup.')
          }
        }catch(e){showMsg('Backup write failed: '+e.message,'error')}
      })()
    }catch(e){showMsg('Backup failed: '+e.message,'error')}
  })
  if(el=byId('headerRestoreBtn'))el.addEventListener('click',function(){
    var localData=localStorage.getItem(window.FULL_BACKUP_KEY)
    if(localData){
      var p=confirm('Restore from browser backup?\n\nOK = Restore from browser\nCancel = Choose .json file')
      if(p){
        if(!confirm('Restore will REPLACE all current data. Continue?'))return
        try{
          var data=JSON.parse(localData)
          var msg=window.restoreFullBackup(data)
          refreshAllSections()
          // Set DO date filter to today
          var todayStr=new Date().toISOString().split('T')[0]
          var df=document.getElementById('do-date-filter')
          if(df){df.value=todayStr};window._doDateFilter=todayStr
          refreshDOCustomers();refreshDOCustomerList()
          window._supabaseDisabled=true
          showMsg('Restored: '+msg+' (Cloud sync disabled)')
        }catch(e){showMsg('Restore failed: '+e.message,'error')}
        return
      }
    }else if(!confirm('Restore will REPLACE all current data. Continue?'))return
    var input=document.createElement('input');input.type='file';input.accept='.json'
    input.onchange=function(ev){
      var reader=new FileReader()
      reader.onload=function(e){
        try{
          var data=JSON.parse(e.target.result)
          if(!data.version)throw new Error('Invalid backup file')
          var msg=window.restoreFullBackup(data)
          refreshAllSections()
          // Set DO date filter to today
          var todayStr=new Date().toISOString().split('T')[0]
          var df=document.getElementById('do-date-filter')
          if(df){df.value=todayStr};window._doDateFilter=todayStr
          refreshDOCustomers();refreshDOCustomerList()
          window._supabaseDisabled=true
          showMsg('Restored: '+msg+' (Cloud sync disabled)')
        }catch(err){showMsg('Restore failed: '+err.message,'error')}
      }
      reader.readAsText(ev.target.files[0])
    };input.click()
  })
  if(el=byId('browsePDFFolderBtn'))el.addEventListener('click',function(){
    if(!window.showDirectoryPicker){showMsg('Folder picker not supported','error');return}
    window.showDirectoryPicker().then(function(dir){
      pdfDirHandle=dir;var inp=byId('pdfFolderInput');if(inp)inp.value=dir.name
      try{localStorage.setItem('pdfFolderName',dir.name)}catch(e){};showMsg('PDF folder: '+dir.name)
    }).catch(function(e){if(e.name!='AbortError')showMsg('Folder selection failed','error')})
  })
  if(el=byId('clearPDFFolderBtn'))el.addEventListener('click',function(){
    pdfDirHandle=null;var inp=byId('pdfFolderInput');if(inp)inp.value=''
    try{localStorage.removeItem('pdfFolderName')}catch(e){};showMsg('PDF folder reset')
  })
  ;(function(){
    var saved='';try{saved=localStorage.getItem('pdfFolderName')||''}catch(e){}
    var inp=byId('pdfFolderInput');if(inp&&saved)inp.value=saved
  })()
  if(el=byId('mainTotalBtn'))el.addEventListener('click',function(){
    var total=transactions.reduce(function(s,r){return s+(parseInt(r.qty)||0)},0)
    var d=byId('totalQtyDisplay');if(d)d.textContent=total;showMsg('Main Total QTY: '+total)
  })
  if(el=byId('copyEntryExcelBtn'))el.addEventListener('click',async function(){
    var data=transactions.filter(function(r){return r.item||r.vendor||r.qty})
    if(!data.length){showMsg('No data to copy','error');return}
    var r=data.map(function(e){return[e.date,e.type,e.vendor,e.marks,e.item,e.storage,e.specs,e.color,e.qty,e.txnStatus||'',e.logistics||'']})
    var t=r.map(function(row){return row.join('\t')}).join('\n')
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    showMsg('Copied '+data.length+' rows for Excel')
  })
  if(el=byId('copyBalanceBtn'))el.addEventListener('click',async function(){
    var t=getBalanceText()
    if(!t){showMsg('No balance data','error');return}
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    this.textContent='✓ COPIED';this.style.background='#30d158';setTimeout(function(){this.textContent='BALANCE STOCK';this.style.background='#25D366'}.bind(this),2000)
  })
  if(el=byId('copyWtsBtn'))el.addEventListener('click',async function(){
    var t=getWtsWhatsAppText()
    if(!t||!t.includes('Total')){showMsg('No WTS data','error');return}
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    this.innerHTML='<i class="fas fa-check"></i> WTS COPIED';this.style.background='#1da851';setTimeout(function(){this.innerHTML='<i class="fab fa-whatsapp"></i> COPY WTS (WhatsApp)';this.style.background='#25D366'}.bind(this),2000)
  })
  if(el=byId('copyWtbBtn'))el.addEventListener('click',async function(){
    var t=getWtbWhatsAppText()
    if(!t||!t.includes('Total')){showMsg('No WTB data — all items are balanced','error');return}
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    this.innerHTML='<i class="fas fa-check"></i> WTB COPIED';this.style.background='#1da851';setTimeout(function(){this.innerHTML='<i class="fab fa-whatsapp"></i> COPY WTB (WhatsApp)';this.style.background='#ff3b30'}.bind(this),2000)
  })
  if(el=byId('copyExcelBtn'))el.addEventListener('click',async function(){
    var t=getExcelText()
    if(!t){showMsg('No data','error');return}
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    this.textContent='✓ COPIED';this.style.background='#30d158';setTimeout(function(){this.textContent='COPY FOR EXCEL';this.style.background='#e8e8e8'}.bind(this),2000)
  })
  if(el=byId('downloadExcelBtn'))el.addEventListener('click',function(){
    var data=transactions.filter(function(r){return r.item||r.vendor||r.qty})
    if(!data.length){showMsg('No data to export','error');return}
    var h=['Date','Transaction Type','Customer / Vendor','MARKS','Item Name','Storage','Specs','Color','Trans Status','Logistics','QTY']
    var r=data.map(function(e){return[e.date,e.type,e.vendor,e.marks,e.item,e.storage,e.specs,e.color,e.txnStatus||'',e.logistics||'',e.qty]})
    var wb=XLSX.utils.book_new()
    var ws=XLSX.utils.aoa_to_sheet([h,...r])
    ws['!cols']=[12,16,26,12,14,10,8,12,10,12,8].map(function(w){return{wch:w}})
    XLSX.utils.book_append_sheet(wb,ws,'Ledger')
    XLSX.writeFile(wb,'SUPERNOVA_Stock_Ledger.xlsx')
    showMsg('Downloaded Excel')
  })
  try{if(el=byId('copyHistoryExcelBtn'))el.addEventListener('click',copyHistoryExcel)}catch(e){}
  try{if(el=byId('exportCsvBtn'))el.addEventListener('click',exportCSV)}catch(e){}
  if(el=byId('refreshHistoryBtn'))el.addEventListener('click',function(){fetchHistory();showMsg('Refreshed')})
  if(el=byId('importHistoryBtn'))el.addEventListener('click',function(){document.getElementById('importHistoryFileInput').click()})
  if(el=byId('importHistoryFileInput'))el.addEventListener('change',function(){if(this.files&&this.files[0])importHistoryExcel()})
  if(el=byId('editSelectedBtn'))el.addEventListener('click',function(){
    var ids=Object.keys(window._selectedHistoryIds)
    if(!ids.length)return
    var rows=[]
    ids.forEach(function(id){
      for(var i=0;i<allSavedTx.length;i++){
        if(String(allSavedTx[i].id)===String(id)){
          var r=allSavedTx[i]
          rows.push({id:r.id,item:r.item_name||'',storage:r.storage||'',specs:r.specs||'',color:r.color||'',vendor:r.customer_vendor||'',qty:parseInt(r.quantity)||0,type:r.transaction_type||'',date:r.date||'',marks:r.marks||'',logistics:r.logistics||'',txnStatus:r.transaction_status||''})
          break
        }
      }
    })
    if(rows.length){
      editingHistoryId=null
      transactions=rows.concat([emptyRow()])
      renderEditable()
      try{switchTab('entry')}catch(e){}
      showMsg('Loaded '+rows.length+' row(s) for editing. Edit then click SAVE TO DATABASE.')
      window._selectedHistoryIds={}
      updateHistorySelectionUI()
    }
  })
  if(el=byId('deleteSelectedBtn'))el.addEventListener('click',function(){
    var ids=Object.keys(window._selectedHistoryIds)
    if(!ids.length)return
    if(!confirm('Delete '+ids.length+' selected transaction(s)?'))return
    ids.forEach(function(id){DB.deleteById(id)})
    window._selectedHistoryIds={}
    fetchHistory()
    refreshAllSections()
    showMsg('Deleted '+ids.length+' transaction(s)')
  })
  if(el=byId('clearHistoryBtn'))el.addEventListener('click',async function(){
    if(!confirm('Delete ALL data from all sections? This will clear everything including pricing and approvals.'))return
    allSavedTx=[];balanceHistory=[];transactions=[emptyRow()];window.doAllMarksView=false;doProducts=[]
    renderHistory();renderEditable()
    try{localStorage.removeItem('pricingPending');localStorage.removeItem('pricingSubmittedKeys');DB.deleteAll();showMsg('All data cleared');renderBalance();initDO()}catch(e){showMsg('Error clearing data','error')}
    refreshAllSections()
  })
  if(el=byId('copyAllBtn'))el.addEventListener('click',async function(){
    var wts=getWtsWhatsAppText(),wtb=getWtbWhatsAppText()
    var parts=[]
    if(wts&&wts.includes('Total'))parts.push(wts)
    if(wtb&&wtb.includes('Total'))parts.push(wtb)
    if(!parts.length){showMsg('No balance data','error');return}
    var t=parts.join('\n\n=========================\n\n')
    try{await navigator.clipboard.writeText(t)}catch(e){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta)}
    this.innerHTML='<i class="fas fa-check"></i> ALL COPIED';setTimeout(function(){this.innerHTML='<i class="fab fa-whatsapp"></i> COPY ALL (WhatsApp)'}.bind(this),2000)
  })
  if(el=byId('clearBalanceBtn'))el.addEventListener('click',async function(){
    if(!confirm('Delete ALL balance data from database?'))return
    try{DB.deleteAll();showMsg('All balance data deleted');allSavedTx=[];balanceHistory=[];applyFilters();renderBalance()}catch(e){showMsg('Error deleting balance data','error')}
    refreshAllSections()
  })
  // Load saved data and show initial tab
  // Load from localStorage FIRST (instant), then try Supabase in background
  DB.init()
  try{var cached=JSON.parse(localStorage.getItem('stockLedgerDB')||'[]');if(cached.length){DB.db=cached}}catch(e){}
  try{fetchHistory()}catch(e){}
  try{switchTab('entry')}catch(e){}
  dcRenderLists()
  refreshEntryDatalists()
  try{initDO()}catch(e){}
  try{refreshDOCustomerList()}catch(e){}
  try{loadLearnedItems()}catch(e){}
// Then try to load from Supabase and refresh if newer data found
if(window.location.href.indexOf('nocloud')<0&&!window._supabaseDisabled)loadFromSupabase().then(function(){
  if(window._supabaseDisabled)return
  try{fetchHistory()}catch(e){}
  try{switchTab('entry')}catch(e){}
  dcRenderLists()
  refreshEntryDatalists()
  try{initDO()}catch(e){}
  try{refreshDOCustomerList()}catch(e){}
  try{loadLearnedItems()}catch(e){}
  // Ensure supernova exists in cloud
  try{
    var lu=JSON.parse(localStorage.getItem('loginUsers')||'{}')
    if(lu.supernova&&typeof supabaseReq==='function'&&!window._supabaseDisabled){
      supabaseReq('users','POST','',{username:'supernova',password:lu.supernova.password,role:lu.supernova.role||'admin',name:lu.supernova.name||'Supernova Admin'},"resolution=merge-duplicates")
        .catch(function(){})
    }
  }catch(e){}
  if(typeof window.loginRefreshDropdown==='function')try{window.loginRefreshDropdown()}catch(e){}
  console.log('[Supabase] Data load callback complete')
})
  // Base tab switcher
  if(typeof window.switchTab !== 'function'){
    window.switchTab=function(tab){
      try{refreshAllSections()}catch(e){}
      document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active')})
      var el=document.getElementById('panel-'+tab)
      if(el)el.classList.add('active')
      document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)})
      if(tab==='delivery')try{initDO()}catch(e){}
    }
  }

;(function(){
  var _charts={};
  var _sortField='sold',_sortDir=-1;
  var _modelData=[];

  function _today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function _daysBetween(a,b){var da=new Date(a),db=new Date(b);return Math.floor((db-da)/(1000*60*60*24))}
  function _monthDiff(a,b){var da=new Date(a),db=new Date(b);return Math.max(1,((db.getFullYear()-da.getFullYear())*12)+(db.getMonth()-da.getMonth()))||1}
  function _esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function _todayDate(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

  function _getFilteredTx(){
    var from=document.getElementById('rdDateFrom')?.value||'';
    var to=document.getElementById('rdDateTo')?.value||'';
    return (allSavedTx||[]).filter(function(t){
      if(from&&t.date<from)return false;
      if(to&&t.date>to)return false;
      return true;
    });
  }

  function _computeModelData(){
    var txs=_getFilteredTx();
    var brand=document.getElementById('rdBrand')?.value||'';
    var storage=document.getElementById('rdStorage')?.value||'';
    var search=(document.getElementById('rdSearch')?.value||'').toLowerCase();

    var modelMap={};
    txs.forEach(function(t){
      var model=(t.item_name||'').trim();
      if(!model)return;
      var key=model.toLowerCase();
      if(!modelMap[key])modelMap[key]={model:model,brand:_extractBrand(model),storage:new Set(),specSet:new Set(),
        avail:0,sold:0,buying:0,opening:0,negQty:0,
        oldestDate:null,newestDate:null,
        customers:{},colors:{},dates:[]};
      var m=modelMap[key];
      var q=parseInt(t.quantity)||0;
      if(t.storage)m.storage.add(t.storage);
      if(t.specs)m.specSet.add(t.specs);
      if(t.color)m.colors[t.color]=(m.colors[t.color]||0)+q;
      if(t.transaction_type==='Opening'){m.opening+=q;m.avail+=q}
      else if(t.transaction_type==='Buying'){m.buying+=q;m.avail+=q}
      else if(t.transaction_type==='Selling'){m.sold+=q;m.avail-=q}
      if(t.date){
        if(!m.oldestDate||t.date<m.oldestDate)m.oldestDate=t.date;
        if(!m.newestDate||t.date>m.newestDate)m.newestDate=t.date;
        m.dates.push({date:t.date,type:t.transaction_type,qty:q});
      }
      if(t.customer_vendor&&t.transaction_type==='Selling'){
        m.customers[t.customer_vendor]=(m.customers[t.customer_vendor]||0)+q;
      }
    });

    var result=Object.values(modelMap);
    if(brand)result=result.filter(function(m){return m.brand.toLowerCase()===brand.toLowerCase()});
    if(storage)result=result.filter(function(m){return m.storage.has(storage)});
    if(search)result=result.filter(function(m){return m.model.toLowerCase().indexOf(search)!==-1});
    result.forEach(function(m){
      if(m.avail<0){m.negQty=Math.abs(m.avail);m.avail=0}
      var topCust='';
      var topCustQty=0;
      Object.keys(m.customers).forEach(function(c){
        if(m.customers[c]>topCustQty){topCustQty=m.customers[c];topCust=c}
      });
      m.topCustomer=topCust;
      m.topCustomerQty=topCustQty;
      var age1=m.oldestDate?_daysBetween(m.oldestDate,_todayDate()):0;
      var age2=m.newestDate?_daysBetween(m.newestDate,_todayDate()):0;
      m.oldestAge=age1;
      m.newestAge=age2;
      var months=m.oldestDate?_monthDiff(m.oldestDate,_todayDate()):1;
      m.avgMonthlySales=m.sold>0?Math.round(m.sold/months*10)/10:0;
    });
    return result;
  }

  function _extractBrand(model){
    var m=model.toLowerCase();
    if(m.indexOf('iphone')!==-1||m.indexOf('apple')!==-1)return 'Apple';
    if(m.indexOf('samsung')!==-1||m.indexOf('galaxy')!==-1)return 'Samsung';
    if(m.indexOf('redmi')!==-1||m.indexOf('xiaomi')!==-1||m.indexOf('poco')!==-1||m.indexOf('mi ')!==-1)return 'Xiaomi';
    if(m.indexOf('oppo')!==-1)return 'OPPO';
    if(m.indexOf('vivo')!==-1)return 'Vivo';
    if(m.indexOf('oneplus')!==-1)return 'OnePlus';
    if(m.indexOf('realme')!==-1)return 'Realme';
    if(m.indexOf('huawei')!==-1||m.indexOf('honor')!==-1)return 'Huawei';
    if(m.indexOf('nokia')!==-1)return 'Nokia';
    if(m.indexOf('tecno')!==-1)return 'Tecno';
    if(m.indexOf('infinix')!==-1)return 'Infinix';
    if(m.indexOf('itel')!==-1)return 'Itel';
    if(m.indexOf('motorola')!==-1||m.indexOf('moto')!==-1)return 'Motorola';
    if(m.indexOf('google')!==-1||m.indexOf('pixel')!==-1)return 'Google';
    return 'Other';
  }

  function _populateBrandStorage(){
    var brands=new Set(),storages=new Set();
    (allSavedTx||[]).forEach(function(t){
      if(t.item_name)brands.add(_extractBrand(t.item_name));
      if(t.storage)storages.add(t.storage);
    });
    var bs=document.getElementById('rdBrand');
    if(bs){var bv=bs.value;bs.innerHTML='<option value="">All Brands</option>';[...brands].sort().forEach(function(b){bs.innerHTML+='<option value="'+_esc(b)+'">'+_esc(b)+'</option>'});bs.value=bv;}
    var ss=document.getElementById('rdStorage');
    if(ss){var sv=ss.value;ss.innerHTML='<option value="">All Storage</option>';[...storages].sort().forEach(function(s){ss.innerHTML+='<option value="'+_esc(s)+'">'+_esc(s)+'</option>'});ss.value=sv;}
  }

  function _renderDashboardCards(){
    var totalAvail=0,totalSold=0,modelSet=new Set();
    _modelData.forEach(function(m){
      totalAvail+=m.avail;totalSold+=m.sold;
      modelSet.add(m.model);
    });
    // Negative stock calculated from Balance section logic (per item|storage|specs|color)
    var itemBalances={};
    (allSavedTx||[]).forEach(function(t){
      var q=parseInt(t.quantity)||0;
      var key=((t.item_name||'')+'|'+(t.storage||'')+'|'+(t.specs||'')+'|'+(t.color||'')).toLowerCase();
      if(!itemBalances[key])itemBalances[key]={qty:0};
      if(t.transaction_type==='Opening'||t.transaction_type==='Buying')itemBalances[key].qty+=q;
      else if(t.transaction_type==='Selling')itemBalances[key].qty-=q;
    });
    var totalNeg=0;
    Object.keys(itemBalances).forEach(function(k){
      if(itemBalances[k].qty<0)totalNeg+=Math.abs(itemBalances[k].qty);
    });
    var best=_modelData.slice().sort(function(a,b){return b.sold-a.sold})[0];
    var withSales=_modelData.filter(function(m){return m.sold>0}).sort(function(a,b){return a.sold-b.sold});
    var slow=withSales[0];
    var dead=_modelData.filter(function(m){return m.sold===0&&m.avail<=0}).length;

    document.getElementById('rdAvail').textContent=totalAvail;
    document.getElementById('rdSold').textContent=totalSold;
    document.getElementById('rdNeg').textContent=totalNeg;
    document.getElementById('rdModels').textContent=modelSet.size;
    document.getElementById('rdBest').textContent=best?best.model+' ('+best.sold+')':'-';
    document.getElementById('rdSlow').textContent=slow?slow.model+' ('+slow.sold+')':'-';
    document.getElementById('rdDead').textContent=dead;
  }

  function _ageClass(age){
    if(age>60)return 'rpt-darkred';
    if(age>30)return 'rpt-orange';
    return '';
  }

  function _renderTable(){
    var totalSales=_modelData.reduce(function(s,m){return s+m.sold},0)||1;
    var tbody=document.getElementById('rdModelBody');
    if(!tbody)return;

    var sorted=_modelData.slice().sort(function(a,b){
      var va,vb;
      switch(_sortField){
        case'model':va=a.model.toLowerCase();vb=b.model.toLowerCase();return _sortDir*va.localeCompare(vb);
        case'avail':va=a.avail;vb=b.avail;break;
        case'sold':va=a.sold;vb=b.sold;break;
        case'negative':va=a.negQty;vb=b.negQty;break;
        case'oldest':va=a.oldestAge;vb=b.oldestAge;break;
        case'newest':va=a.newestAge;vb=b.newestAge;break;
        case'avgSales':va=a.avgMonthlySales;vb=b.avgMonthlySales;break;
        case'topCustomer':va=a.topCustomerQty;vb=b.topCustomerQty;break;
        case'salesPct':va=a.sold;vb=b.sold;break;
        default:va=a.sold;vb=b.sold;
      }
      return _sortDir*(va-vb);
    });

    tbody.innerHTML=sorted.map(function(m,idx){
      var pct=Math.round(m.sold/totalSales*1000)/10;
      var cls='';
      if(m.negQty>0)cls='rpt-neg';
      else if(m.sold===0&&m.avail>0)cls='rpt-darkred';
      var ageCls=_ageClass(m.oldestAge);
      var fastest=_modelData.length>0&&m.sold===Math.max.apply(null,_modelData.map(function(x){return x.sold}));
      var fastCls=fastest&&m.sold>0?'rpt-fast':'';
      return '<tr class="'+fastCls+'">'
        +'<td><strong>'+_esc(m.model)+'</strong></td>'
        +'<td>'+m.avail+'</td>'
        +'<td class="rpt-green">'+m.sold+'</td>'
        +'<td class="'+(m.negQty>0?'rpt-neg':'')+'">'+m.negQty+'</td>'
        +'<td class="'+ageCls+'">'+m.oldestAge+'d</td>'
        +'<td class="'+_ageClass(m.newestAge)+'">'+m.newestAge+'d</td>'
        +'<td>'+m.avgMonthlySales+'</td>'
        +'<td>'+_esc(m.topCustomer)+' ('+m.topCustomerQty+')</td>'
        +'<td>'+pct+'%</td>'
        +'<td><button class="btn" style="font-size:0.6rem;padding:2px 6px" onclick="window._rdViewDetail(\''+_esc(m.model)+'\')"><i class="fas fa-eye"></i> View</button></td>'
        +'</tr>';
    }).join('');
    document.getElementById('rdModelCount').textContent='Showing '+sorted.length+' models | Total Sales: '+_modelData.reduce(function(s,m){return s+m.sold},0)+' units';
  }

  function _renderCharts(){
    Object.values(_charts).forEach(function(c){try{c.destroy()}catch(e){}});
    _charts={};
    if(typeof Chart==='undefined')return;

    var top10=_modelData.slice().sort(function(a,b){return b.sold-a.sold}).slice(0,10);
    var custMap={};
    _modelData.forEach(function(m){Object.keys(m.customers).forEach(function(c){custMap[c]=(custMap[c]||0)+m.customers[c]})});
    var topCust=Object.entries(custMap).sort(function(a,b){return b[1]-a[1]}).slice(0,10);

    var chartOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}}};

    if(top10.length>0){
      _charts.best=new Chart(document.getElementById('rdChartBest'),{type:'bar',data:{labels:top10.map(function(m){return m.model.substring(0,15)}),datasets:[{label:'Units Sold',data:top10.map(function(m){return m.sold}),backgroundColor:'rgba(30,60,114,0.7)',borderRadius:4}]},options:{...chartOpts,plugins:{...chartOpts.plugins,title:{display:true,text:'Best Selling Models',font:{size:11}}}}});
    }
    if(topCust.length>0){
      _charts.cust=new Chart(document.getElementById('rdChartCustomer'),{type:'bar',data:{labels:topCust.map(function(c){return c[0].substring(0,12)}),datasets:[{label:'Qty Purchased',data:topCust.map(function(c){return c[1]}),backgroundColor:'rgba(48,209,88,0.7)',borderRadius:4}]},options:{...chartOpts,plugins:{...chartOpts.plugins,title:{display:true,text:'Customer Wise Sales',font:{size:11}}}}});
    }

    var totalAvail=_modelData.reduce(function(s,m){return s+m.avail},0);
    var totalSold=_modelData.reduce(function(s,m){return s+m.sold},0);
    var totalNeg=_modelData.reduce(function(s,m){return s+m.negQty},0);
    _charts.stock=new Chart(document.getElementById('rdChartStock'),{type:'doughnut',data:{labels:['Available','Sold','Negative'],datasets:[{data:[totalAvail,totalSold,totalNeg],backgroundColor:['#007aff','#30d158','#ff3b30'],borderWidth:2}]},options:{...chartOpts,plugins:{...chartOpts.plugins,title:{display:true,text:'Stock Distribution',font:{size:11}}}}});

    var monthMap={};
    _modelData.forEach(function(m){m.dates.forEach(function(d){
      var mk=d.date.substring(0,7);
      if(!monthMap[mk])monthMap[mk]={};
      var mk2=mk;
      if(!monthMap[mk2][m.model])monthMap[mk2][m.model]=0;
      if(d.type==='Selling')monthMap[mk2][m.model]+=d.qty;
    })});
    var months=Object.keys(monthMap).sort();
    var topModels=_modelData.slice().sort(function(a,b){return b.sold-a.sold}).slice(0,5);
    var colors=['#1e3c72','#30d158','#ff3b30','#ff9f0a','#007aff'];
    if(months.length>0&&topModels.length>0){
      _charts.monthly=new Chart(document.getElementById('rdChartMonthly'),{type:'line',data:{labels:months,datasets:topModels.map(function(m,i){return{label:m.model.substring(0,12),data:months.map(function(mo){return(monthMap[mo]||{})[m.model]||0}),borderColor:colors[i%5],backgroundColor:'transparent',tension:0.3,pointRadius:2}})},options:{...chartOpts,plugins:{...chartOpts.plugins,title:{display:true,text:'Monthly Sales Trend',font:{size:11}}}}});
    }

    var agingBuckets={'0-15d':0,'16-30d':0,'31-60d':0,'61-90d':0,'90d+':0};
    _modelData.forEach(function(m){
      var age=m.oldestAge;
      if(age<=15)agingBuckets['0-15d']+=m.avail;
      else if(age<=30)agingBuckets['16-30d']+=m.avail;
      else if(age<=60)agingBuckets['31-60d']+=m.avail;
      else if(age<=90)agingBuckets['61-90d']+=m.avail;
      else agingBuckets['90d+']+=m.avail;
    });
    _charts.aging=new Chart(document.getElementById('rdChartAging'),{type:'bar',data:{labels:Object.keys(agingBuckets),datasets:[{label:'Stock Qty',data:Object.values(agingBuckets),backgroundColor:['#30d158','#007aff','#ff9f0a','#ff6b35','#ff3b30'],borderRadius:4}]},options:{...chartOpts,plugins:{...chartOpts.plugins,title:{display:true,text:'Stock Aging Distribution',font:{size:11}}}}});
  }

  window._rdSortBy=function(field){
    if(_sortField===field)_sortDir*=-1;
    else{_sortField=field;_sortDir=-1}
    _renderTable();
  };

  window._rdRender=function(){
    _populateBrandStorage();
    _modelData=_computeModelData();
    _renderDashboardCards();
    _renderTable();
    _renderCharts();
  };

  window._rdViewDetail=function(modelName){
    var m=_modelData.find(function(x){return x.model===modelName});
    if(!m)return;
    var totalSales=_modelData.reduce(function(s,x){return s+x.sold},0)||1;
    var pct=Math.round(m.sold/totalSales*1000)/10;
    var custArr=Object.entries(m.customers).sort(function(a,b){return b[1]-a[1]});

    var html='<h3>'+_esc(m.model)+' - Detailed Report</h3>';
    html+='<div class="rv-grid">';
    html+='<div class="rv-item"><div class="rv-l">Available Qty</div><div class="rv-v c-blue">'+m.avail+'</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Sold Qty</div><div class="rv-v c-green">'+m.sold+'</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Negative Qty</div><div class="rv-v" style="color:#ff3b30">'+m.negQty+'</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Sales %</div><div class="rv-v">'+pct+'%</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Avg Monthly Sales</div><div class="rv-v">'+m.avgMonthlySales+'</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Oldest Stock Age</div><div class="rv-v '+_ageClass(m.oldestAge)+'">'+m.oldestAge+' days</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Newest Stock Age</div><div class="rv-v '+_ageClass(m.newestAge)+'">'+m.newestAge+' days</div></div>';
    html+='<div class="rv-item"><div class="rv-l">First Entry</div><div class="rv-v" style="font-size:0.75rem">'+(m.oldestDate||'-')+'</div></div>';
    html+='<div class="rv-item"><div class="rv-l">Last Entry</div><div class="rv-v" style="font-size:0.75rem">'+(m.newestDate||'-')+'</div></div>';
    html+='</div>';

    html+='<div class="rv-section"><h4><i class="fas fa-palette"></i> Color Wise Available Stock</h4><table><thead><tr><th>Color</th><th>Total Qty</th></tr></thead><tbody>';
    var colorEntries=Object.entries(m.colors).sort(function(a,b){return b[1]-a[1]});
    colorEntries.forEach(function(c){html+='<tr><td>'+_esc(c[0])+'</td><td>'+c[1]+'</td></tr>'});
    html+='</tbody></table></div>';

    html+='<div class="rv-section"><h4><i class="fas fa-palette"></i> Color Wise Sold Stock</h4><table><thead><tr><th>Color</th><th>Sold Qty</th></tr></thead><tbody>';
    colorEntries.forEach(function(c){html+='<tr><td>'+_esc(c[0])+'</td><td class="c-green">'+c[1]+'</td></tr>'});
    html+='</tbody></table></div>';

    html+='<div class="rv-section"><h4><i class="fas fa-users"></i> Top 10 Customers</h4><table><thead><tr><th>#</th><th>Customer</th><th>Purchase Qty</th><th>% of Total</th></tr></thead><tbody>';
    custArr.slice(0,10).forEach(function(c,i){html+='<tr><td>'+(i+1)+'</td><td>'+_esc(c[0])+'</td><td class="c-navy" style="font-weight:700">'+c[1]+'</td><td>'+(m.sold>0?Math.round(c[1]/m.sold*1000)/10:0)+'%</td></tr>'});
    html+='</tbody></table></div>';

    html+='<div class="rv-section"><h4><i class="fas fa-calendar"></i> Stock Aging Analysis</h4><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>';
    html+='<tr><td>Oldest Stock Age</td><td class="'+_ageClass(m.oldestAge)+'"><strong>'+m.oldestAge+' days</strong></td></tr>';
    html+='<tr><td>Newest Stock Age</td><td class="'+_ageClass(m.newestAge)+'"><strong>'+m.newestAge+' days</strong></td></tr>';
    html+='<tr><td>First Stock Entry</td><td>'+(m.oldestDate||'-')+'</td></tr>';
    html+='<tr><td>Last Stock Entry</td><td>'+(m.newestDate||'-')+'</td></tr>';
    html+='<tr><td>Total Unique Colors</td><td>'+colorEntries.length+'</td></tr>';
    html+='<tr><td>Total Unique Customers</td><td>'+custArr.length+'</td></tr>';
    html+='</tbody></table></div>';

    html+='<div class="rv-section"><h4><i class="fas fa-chart-line"></i> Sales Trend History</h4><div style="height:180px"><canvas id="rdDetailChart"></canvas></div></div>';

    document.getElementById('rdModalBody').innerHTML=html;
    document.getElementById('rdModalOverlay').classList.add('active');

    setTimeout(function(){
      if(typeof Chart==='undefined')return;
      var monthSales={};
      m.dates.forEach(function(d){
        if(d.type!=='Selling')return;
        var mk=d.date.substring(0,7);
        monthSales[mk]=(monthSales[mk]||0)+d.qty;
      });
      var msKeys=Object.keys(monthSales).sort();
      if(msKeys.length>0){
        new Chart(document.getElementById('rdDetailChart'),{type:'line',data:{labels:msKeys,datasets:[{label:'Units Sold',data:msKeys.map(function(k){return monthSales[k]}),borderColor:'#1e3c72',backgroundColor:'rgba(30,60,114,0.1)',fill:true,tension:0.3,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'Monthly Sales Trend',font:{size:10}}},scales:{x:{ticks:{font:{size:9}}},y:{ticks:{font:{size:9}}}}}});
      }
    },200);
  };

  window._rdCloseModal=function(){
    document.getElementById('rdModalOverlay').classList.remove('active');
  };

  window._rdExportExcel=function(){
    var tbl=document.getElementById('rdModelTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data to export','error');
    if(typeof XLSX==='undefined')return showMsg('XLSX not loaded','error');
    var wb=XLSX.utils.table_to_book(tbl,{sheet:'Model Performance'});
    XLSX.writeFile(wb,'ModelPerformance_'+_today()+'.xlsx');
  };

  window._rdExportPDF=function(){
    var tbl=document.getElementById('rdModelTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data to export','error');
    if(typeof html2canvas==='undefined'||typeof jspdf==='undefined')return showMsg('PDF libs not loaded','error');
    html2canvas(tbl).then(function(canvas){
      var pdf=new jspdf.jsPDF('l','mm','a4');
      var w=pdf.internal.pageSize.getWidth()-20;
      var h=canvas.height*w/canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',10,10,w,h);
      pdf.save('ModelPerformance_'+_today()+'.pdf');
    });
  };

  window._rdPrint=function(){
    var tbl=document.getElementById('rdModelTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data to print','error');
    var w=window.open('','','width=1100,height=700');
    w.document.write('<html><head><title>Model Performance Report</title><style>table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #999;padding:4px 6px}th{background:#1e3c72;color:#fff}tr:nth-child(even){background:#f5f5f5}</style></head><body><h2>Model Performance Report - '+_today()+'</h2>');
    w.document.write(tbl.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(function(){w.print()},300);
  };

  var _searchTimer=null;
  document.getElementById('rdSearch')?.addEventListener('input',function(){
    if(_searchTimer)clearTimeout(_searchTimer);
    _searchTimer=setTimeout(function(){window._rdRender()},300);
  });
  document.getElementById('rdBrand')?.addEventListener('change',function(){window._rdRender()});
  document.getElementById('rdStorage')?.addEventListener('change',function(){window._rdRender()});
  document.getElementById('rdDateFrom')?.addEventListener('change',function(){window._rdRender()});
  document.getElementById('rdDateTo')?.addEventListener('change',function(){window._rdRender()});

  // ===== SUB-TAB SWITCHING =====
  window._rptSwitch=function(type){
    document.querySelectorAll('.rpt-subtab').forEach(function(t){t.classList.remove('active')});
    document.querySelectorAll('.rpt-subpanel').forEach(function(p){p.classList.remove('active')});
    var idx={model:0,customer:1,vendor:2,aging:3}[type]||0;
    document.querySelectorAll('.rpt-subtab')[idx]?.classList.add('active');
    var panels=['rptPanelModel','rptPanelCustomer','rptPanelVendor','rptPanelAging'];
    var el=document.getElementById(panels[idx]);
    if(el)el.classList.add('active');
    if(type==='model')window._rdRender();
    else if(type==='customer')window._rcRender();
    else if(type==='vendor')window._rvRender();
    else if(type==='aging')window._raRender();
  };

  // ===== HELPER: week number =====
  function _weekKey(dateStr){
    var d=new Date(dateStr);
    var jan1=new Date(d.getFullYear(),0,1);
    var wk=Math.ceil(((d-jan1)/864e5+jan1.getDay()+1)/7);
    return d.getFullYear()+'-W'+String(wk).padStart(2,'0');
  }

  // ===== CUSTOMER SALES REPORT =====
  window._rcRender=function(){
    // populate filters
    var custs=new Set(),models=new Set();
    (allSavedTx||[]).filter(function(t){return t.transaction_type==='Selling'}).forEach(function(t){
      if(t.customer_vendor)custs.add(t.customer_vendor);
      if(t.item_name)models.add(t.item_name);
    });
    var cs=document.getElementById('rcCustomer');if(cs){var cv=cs.value;cs.innerHTML='<option value="">All Customers</option>';[...custs].sort().forEach(function(c){cs.innerHTML+='<option value="'+_esc(c)+'">'+_esc(c)+'</option>'});cs.value=cv;}
    var ms=document.getElementById('rcModel');if(ms){var mv=ms.value;ms.innerHTML='<option value="">All Models</option>';[...models].sort().forEach(function(m){ms.innerHTML+='<option value="'+_esc(m)+'">'+_esc(m)+'</option>'});ms.value=mv;}
    window._rcPeriod(window._rcCurrentPeriod||'day');
  };
  window._rcCurrentPeriod='day';
  window._rcPeriod=function(p){
    window._rcCurrentPeriod=p;
    document.querySelectorAll('#rptPanelCustomer .rpt-ptab').forEach(function(t){t.classList.remove('active')});
    document.querySelectorAll('#rptPanelCustomer .rpt-ptab').forEach(function(t){if(t.textContent.toLowerCase().indexOf(p)!==-1)t.classList.add('active')});
    var cust=document.getElementById('rcCustomer')?.value||'';
    var model=document.getElementById('rcModel')?.value||'';
    var from=document.getElementById('rcDateFrom')?.value||'';
    var to=document.getElementById('rcDateTo')?.value||'';
    var txs=(allSavedTx||[]).filter(function(t){
      if(t.transaction_type!=='Selling')return false;
      if(cust&&t.customer_vendor!==cust)return false;
      if(model&&t.item_name!==model)return false;
      if(from&&t.date<from)return false;
      if(to&&t.date>to)return false;
      return true;
    });
    // group by period
    var grouped={};
    txs.forEach(function(t){
      var key;
      if(p==='day')key=t.date||'Unknown';
      else if(p==='week')key=_weekKey(t.date);
      else key=(t.date||'').substring(0,7);
      if(!grouped[key])grouped[key]={period:key,total:0,customers:{}};
      var q=parseInt(t.quantity)||0;
      grouped[key].total+=q;
      var c=t.customer_vendor||'Unknown';
      grouped[key].customers[c]=(grouped[key].customers[c]||0)+q;
    });
    var periods=Object.keys(grouped).sort();
    // summary cards
    var totalSold=txs.reduce(function(s,t){return s+(parseInt(t.quantity)||0)},0);
    var uniqueCust=new Set(txs.map(function(t){return t.customer_vendor})).size;
    var uniqueModels=new Set(txs.map(function(t){return t.item_name})).size;
    var topCustMap={};txs.forEach(function(t){var c=t.customer_vendor||'';topCustMap[c]=(topCustMap[c]||0)+(parseInt(t.quantity)||0)});
    var topCustEntry=Object.entries(topCustMap).sort(function(a,b){return b[1]-a[1]})[0];
    document.getElementById('rcSummary').innerHTML=
      '<div class="rpt-summary-item"><div class="rs-l">Total Sold</div><div class="rs-v c-green">'+totalSold+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Unique Customers</div><div class="rs-v">'+uniqueCust+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Unique Models</div><div class="rs-v">'+uniqueModels+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Top Customer</div><div class="rs-v" style="font-size:0.75rem">'+(topCustEntry?_esc(topCustEntry[0])+' ('+topCustEntry[1]+')':'-')+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Periods</div><div class="rs-v">'+periods.length+'</div></div>';
    // collect all customer names across periods
    var allCustNames=new Set();
    periods.forEach(function(pk){Object.keys(grouped[pk].customers).forEach(function(c){allCustNames.add(c)})});
    var custArr=[...allCustNames].sort();
    // table header
    document.getElementById('rcHead').innerHTML='<tr><th>Period</th>'+custArr.map(function(c){return '<th>'+_esc(c)+'</th>'}).join('')+'<th style="background:#30d158">Total</th></tr>';
    // table body
    document.getElementById('rcBody').innerHTML=periods.map(function(pk){
      var g=grouped[pk];
      return '<tr><td><strong>'+_esc(g.period)+'</strong></td>'+custArr.map(function(c){var v=g.customers[c]||0;return '<td'+(v>0?' style="font-weight:600"':'>0')+'</td>'}).join('')+'<td style="background:rgba(48,209,88,0.1);font-weight:700">'+g.total+'</td></tr>';
    }).join('');
    document.getElementById('rcCount').textContent=periods.length+' periods | '+totalSold+' total units sold | '+custArr.length+' customers';
    // charts
    _renderCustCharts(custArr,periods,grouped);
  };
  function _renderCustCharts(custArr,periods,grouped){
    if(typeof Chart==='undefined')return;
    var ctx1=document.getElementById('rcChartCustomer');
    var ctx2=document.getElementById('rcChartTimeline');
    if(!ctx1||!ctx2)return;
    try{if(window._rcChart1)window._rcChart1.destroy();if(window._rcChart2)window._rcChart2.destroy();}catch(e){}
    // top customers bar
    var custTotals={};periods.forEach(function(pk){Object.keys(grouped[pk].customers).forEach(function(c){custTotals[c]=(custTotals[c]||0)+grouped[pk].customers[c]})});
    var topC=Object.entries(custTotals).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
    window._rcChart1=new Chart(ctx1,{type:'bar',data:{labels:topC.map(function(c){return c[0].substring(0,12)}),datasets:[{label:'Qty Sold',data:topC.map(function(c){return c[1]}),backgroundColor:'rgba(30,60,114,0.7)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'Top Customers by Qty',font:{size:11}}}}});
    // timeline line
    var top3Cust=topC.slice(0,3).map(function(c){return c[0]});
    var colors=['#1e3c72','#30d158','#ff3b30'];
    window._rcChart2=new Chart(ctx2,{type:'line',data:{labels:periods,datasets:top3Cust.map(function(c,i){return{label:c.substring(0,12),data:periods.map(function(pk){return(grouped[pk].customers[c]||0)}),borderColor:colors[i],backgroundColor:'transparent',tension:0.3,pointRadius:2}})},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:'Customer Sales Timeline',font:{size:11}}}}});
  }
  window._rcExportExcel=function(){
    var tbl=document.getElementById('rcTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    if(typeof XLSX==='undefined')return showMsg('XLSX not loaded','error');
    XLSX.writeFile(XLSX.utils.table_to_book(tbl,{sheet:'Customer Sales'}),'CustomerSales_'+_today()+'.xlsx');
  };
  window._rcPrint=function(){
    var tbl=document.getElementById('rcTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    var w=window.open('','','width=1100,height=700');
    w.document.write('<html><head><title>Customer Sales Report</title><style>table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #999;padding:4px 6px}th{background:#1e3c72;color:#fff}</style></head><body><h2>Customer Sales Report - '+_today()+'</h2>'+tbl.outerHTML+'</body></html>');
    w.document.close();setTimeout(function(){w.print()},300);
  };
  document.getElementById('rcCustomer')?.addEventListener('change',function(){window._rcPeriod(window._rcCurrentPeriod)});
  document.getElementById('rcModel')?.addEventListener('change',function(){window._rcPeriod(window._rcCurrentPeriod)});
  document.getElementById('rcDateFrom')?.addEventListener('change',function(){window._rcPeriod(window._rcCurrentPeriod)});
  document.getElementById('rcDateTo')?.addEventListener('change',function(){window._rcPeriod(window._rcCurrentPeriod)});

  // ===== VENDOR BUYING REPORT =====
  window._rvRender=function(){
    var vendors=new Set(),models=new Set();
    (allSavedTx||[]).filter(function(t){return t.transaction_type==='Buying'}).forEach(function(t){
      if(t.customer_vendor)vendors.add(t.customer_vendor);
      if(t.item_name)models.add(t.item_name);
    });
    var vs=document.getElementById('rvVendor');if(vs){var vv=vs.value;vs.innerHTML='<option value="">All Vendors</option>';[...vendors].sort().forEach(function(v){vs.innerHTML+='<option value="'+_esc(v)+'">'+_esc(v)+'</option>'});vs.value=vv;}
    var ms=document.getElementById('rvModel');if(ms){var mv=ms.value;ms.innerHTML='<option value="">All Models</option>';[...models].sort().forEach(function(m){ms.innerHTML+='<option value="'+_esc(m)+'">'+_esc(m)+'</option>'});ms.value=mv;}
    window._rvPeriod(window._rvCurrentPeriod||'day');
  };
  window._rvCurrentPeriod='day';
  window._rvPeriod=function(p){
    window._rvCurrentPeriod=p;
    document.querySelectorAll('#rptPanelVendor .rpt-ptab').forEach(function(t){t.classList.remove('active')});
    document.querySelectorAll('#rptPanelVendor .rpt-ptab').forEach(function(t){if(t.textContent.toLowerCase().indexOf(p)!==-1)t.classList.add('active')});
    var vendor=document.getElementById('rvVendor')?.value||'';
    var model=document.getElementById('rvModel')?.value||'';
    var from=document.getElementById('rvDateFrom')?.value||'';
    var to=document.getElementById('rvDateTo')?.value||'';
    var txs=(allSavedTx||[]).filter(function(t){
      if(t.transaction_type!=='Buying')return false;
      if(vendor&&t.customer_vendor!==vendor)return false;
      if(model&&t.item_name!==model)return false;
      if(from&&t.date<from)return false;
      if(to&&t.date>to)return false;
      return true;
    });
    var grouped={};
    txs.forEach(function(t){
      var key;
      if(p==='day')key=t.date||'Unknown';
      else if(p==='week')key=_weekKey(t.date);
      else key=(t.date||'').substring(0,7);
      if(!grouped[key])grouped[key]={period:key,total:0,vendors:{}};
      var q=parseInt(t.quantity)||0;
      grouped[key].total+=q;
      var v=t.customer_vendor||'Unknown';
      grouped[key].vendors[v]=(grouped[key].vendors[v]||0)+q;
    });
    var periods=Object.keys(grouped).sort();
    var totalBuy=txs.reduce(function(s,t){return s+(parseInt(t.quantity)||0)},0);
    var uniqueVendors=new Set(txs.map(function(t){return t.customer_vendor})).size;
    var uniqueModels=new Set(txs.map(function(t){return t.item_name})).size;
    var topVendMap={};txs.forEach(function(t){var v=t.customer_vendor||'';topVendMap[v]=(topVendMap[v]||0)+(parseInt(t.quantity)||0)});
    var topVendEntry=Object.entries(topVendMap).sort(function(a,b){return b[1]-a[1]})[0];
    document.getElementById('rvSummary').innerHTML=
      '<div class="rpt-summary-item"><div class="rs-l">Total Bought</div><div class="rs-v c-green">'+totalBuy+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Unique Vendors</div><div class="rs-v">'+uniqueVendors+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Unique Models</div><div class="rs-v">'+uniqueModels+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Top Vendor</div><div class="rs-v" style="font-size:0.75rem">'+(topVendEntry?_esc(topVendEntry[0])+' ('+topVendEntry[1]+')':'-')+'</div></div>'+
      '<div class="rpt-summary-item"><div class="rs-l">Periods</div><div class="rs-v">'+periods.length+'</div></div>';
    var allVendNames=new Set();
    periods.forEach(function(pk){Object.keys(grouped[pk].vendors).forEach(function(v){allVendNames.add(v)})});
    var vendArr=[...allVendNames].sort();
    document.getElementById('rvHead').innerHTML='<tr><th>Period</th>'+vendArr.map(function(v){return '<th>'+_esc(v)+'</th>'}).join('')+'<th style="background:#30d158">Total</th></tr>';
    document.getElementById('rvBody').innerHTML=periods.map(function(pk){
      var g=grouped[pk];
      return '<tr><td><strong>'+_esc(g.period)+'</strong></td>'+vendArr.map(function(v){var val=g.vendors[v]||0;return '<td'+(val>0?' style="font-weight:600"':'>0')+'</td>'}).join('')+'<td style="background:rgba(48,209,88,0.1);font-weight:700">'+g.total+'</td></tr>';
    }).join('');
    document.getElementById('rvCount').textContent=periods.length+' periods | '+totalBuy+' total units bought | '+vendArr.length+' vendors';
    _renderVendCharts(vendArr,periods,grouped);
  };
  function _renderVendCharts(vendArr,periods,grouped){
    if(typeof Chart==='undefined')return;
    var ctx1=document.getElementById('rvChartVendor');
    var ctx2=document.getElementById('rvChartTimeline');
    if(!ctx1||!ctx2)return;
    try{if(window._rvChart1)window._rvChart1.destroy();if(window._rvChart2)window._rvChart2.destroy();}catch(e){}
    var vendTotals={};periods.forEach(function(pk){Object.keys(grouped[pk].vendors).forEach(function(v){vendTotals[v]=(vendTotals[v]||0)+grouped[pk].vendors[v]})});
    var topV=Object.entries(vendTotals).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
    window._rvChart1=new Chart(ctx1,{type:'bar',data:{labels:topV.map(function(v){return v[0].substring(0,12)}),datasets:[{label:'Qty Bought',data:topV.map(function(v){return v[1]}),backgroundColor:'rgba(30,60,114,0.7)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'Top Vendors by Qty',font:{size:11}}}}});
    var top3V=topV.slice(0,3).map(function(v){return v[0]});
    var colors=['#1e3c72','#30d158','#ff3b30'];
    window._rvChart2=new Chart(ctx2,{type:'line',data:{labels:periods,datasets:top3V.map(function(v,i){return{label:v.substring(0,12),data:periods.map(function(pk){return(grouped[pk].vendors[v]||0)}),borderColor:colors[i],backgroundColor:'transparent',tension:0.3,pointRadius:2}})},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:'Vendor Buying Timeline',font:{size:11}}}}});
  }
  window._rvExportExcel=function(){
    var tbl=document.getElementById('rvTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    if(typeof XLSX==='undefined')return showMsg('XLSX not loaded','error');
    XLSX.writeFile(XLSX.utils.table_to_book(tbl,{sheet:'Vendor Buying'}),'VendorBuying_'+_today()+'.xlsx');
  };
  window._rvPrint=function(){
    var tbl=document.getElementById('rvTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    var w=window.open('','','width=1100,height=700');
    w.document.write('<html><head><title>Vendor Buying Report</title><style>table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #999;padding:4px 6px}th{background:#1e3c72;color:#fff}</style></head><body><h2>Vendor Buying Report - '+_today()+'</h2>'+tbl.outerHTML+'</body></html>');
    w.document.close();setTimeout(function(){w.print()},300);
  };
  document.getElementById('rvVendor')?.addEventListener('change',function(){window._rvPeriod(window._rvCurrentPeriod)});
  document.getElementById('rvModel')?.addEventListener('change',function(){window._rvPeriod(window._rvCurrentPeriod)});
  document.getElementById('rvDateFrom')?.addEventListener('change',function(){window._rvPeriod(window._rvCurrentPeriod)});
  document.getElementById('rvDateTo')?.addEventListener('change',function(){window._rvPeriod(window._rvCurrentPeriod)});

  // ===== STOCK AGING REPORT (from balance data) =====
  window._raRender=function(){
    // populate filters
    var modelSet=new Set(),storageSet=new Set();
    (allSavedTx||[]).forEach(function(t){
      if(t.item_name)modelSet.add(t.item_name);
      if(t.storage)storageSet.add(t.storage);
    });
    var ms=document.getElementById('raModel');if(ms){var mv=ms.value;ms.innerHTML='<option value="">All Models</option>';[...modelSet].sort().forEach(function(m){ms.innerHTML+='<option value="'+_esc(m)+'">'+_esc(m)+'</option>'});ms.value=mv;}
    var ss=document.getElementById('raStorage');if(ss){var sv=ss.value;ss.innerHTML='<option value="">All Storage</option>';[...storageSet].sort().forEach(function(s){ss.innerHTML+='<option value="'+_esc(s)+'">'+_esc(s)+'</option>'});ss.value=sv;}
    // compute balances from allSavedTx (same logic as balance section)
    var filterModel=document.getElementById('raModel')?.value||'';
    var filterStorage=document.getElementById('raStorage')?.value||'';
    var balMap={};
    (allSavedTx||[]).forEach(function(t){
      var key=((t.item_name||'')+'|'+(t.storage||'')+'|'+(t.specs||'')+'|'+(t.color||'')).toLowerCase();
      if(!balMap[key])balMap[key]={item:t.item_name||'',storage:t.storage||'',specs:t.specs||'',color:t.color||'',qty:0,firstDate:null,lastDate:null};
      var q=parseInt(t.quantity)||0;
      if(t.transaction_type==='Opening'||t.transaction_type==='Buying')balMap[key].qty+=q;
      else if(t.transaction_type==='Selling')balMap[key].qty-=q;
      if(t.date){
        if(!balMap[key].firstDate||t.date<balMap[key].firstDate)balMap[key].firstDate=t.date;
        if(!balMap[key].lastDate||t.date>balMap[key].lastDate)balMap[key].lastDate=t.date;
      }
    });
    // only WTS (positive qty) items
    var items=Object.values(balMap).filter(function(b){return b.qty>0});
    if(filterModel)items=items.filter(function(b){return b.item.toLowerCase()===filterModel.toLowerCase()});
    if(filterStorage)items=items.filter(function(b){return b.storage.toLowerCase()===filterStorage.toLowerCase()});
    var today=_todayDate();
    items.forEach(function(b){
      b.age=b.firstDate?_daysBetween(b.firstDate,today):0;
      if(b.age<=15)b.ageBucket='0-15d';
      else if(b.age<=30)b.ageBucket='16-30d';
      else if(b.age<=60)b.ageBucket='31-60d';
      else if(b.age<=90)b.ageBucket='61-90d';
      else b.ageBucket='90d+';
    });
    items.sort(function(a,b){return b.age-a.age});
    // summary
    var totalWts=items.reduce(function(s,b){return s+b.qty},0);
    var avgAge=items.length>0?Math.round(items.reduce(function(s,b){return s+b.age*b.qty},0)/totalWts):0;
    var buckets={'0-15d':0,'16-30d':0,'31-60d':0,'61-90d':0,'90d+':0};
    items.forEach(function(b){buckets[b.ageBucket]=(buckets[b.ageBucket]||0)+b.qty});
    document.getElementById('raTotalWts').textContent=totalWts;
    document.getElementById('raAvgAge').textContent=avgAge+' days';
    document.getElementById('raAge015').textContent=buckets['0-15d'];
    document.getElementById('raAge1630').textContent=buckets['16-30d'];
    document.getElementById('raAge3160').textContent=buckets['31-60d'];
    document.getElementById('raAge6190').textContent=buckets['61-90d'];
    document.getElementById('raAge90').textContent=buckets['90d+'];
    // table
    document.getElementById('raBody').innerHTML=items.map(function(b){
      var ageCls=_ageClass(b.age);
      var status='Active';
      if(b.age>90)status='<span class="rpt-darkred">Dead Stock</span>';
      else if(b.age>60)status='<span style="color:#ff6b35;font-weight:700">Very Old</span>';
      else if(b.age>30)status='<span class="rpt-orange">Aging</span>';
      else if(b.age<=15)status='<span class="rpt-green">Fresh</span>';
      return '<tr><td>'+_esc(b.item)+'</td><td>'+_esc(b.storage)+'</td><td>'+_esc(b.specs)+'</td><td>'+_esc(b.color)+'</td><td style="font-weight:700;color:#007aff">'+b.qty+'</td><td>'+(b.firstDate||'-')+'</td><td>'+(b.lastDate||'-')+'</td><td class="'+ageCls+'">'+b.age+' days</td><td>'+status+'</td></tr>';
    }).join('');
    document.getElementById('raCount').textContent=items.length+' items | '+totalWts+' total WTS qty | Avg age: '+avgAge+' days';
    // charts
    _renderAgingCharts(buckets,items);
  };
  function _renderAgingCharts(buckets,items){
    if(typeof Chart==='undefined')return;
    var ctx1=document.getElementById('raChartAging');
    var ctx2=document.getElementById('raChartModel');
    if(!ctx1||!ctx2)return;
    try{if(window._raChart1)window._raChart1.destroy();if(window._raChart2)window._raChart2.destroy();}catch(e){}
    window._raChart1=new Chart(ctx1,{type:'doughnut',data:{labels:Object.keys(buckets),datasets:[{data:Object.values(buckets),backgroundColor:['#30d158','#007aff','#ff9f0a','#ff6b35','#ff3b30'],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:'Stock Aging Distribution',font:{size:11}}}}});
    // top models by qty
    var modelQty={};items.forEach(function(b){modelQty[b.item]=(modelQty[b.item]||0)+b.qty});
    var topM=Object.entries(modelQty).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
    window._raChart2=new Chart(ctx2,{type:'bar',data:{labels:topM.map(function(m){return m[0].substring(0,15)}),datasets:[{label:'WTS Qty',data:topM.map(function(m){return m[1]}),backgroundColor:'rgba(30,60,114,0.7)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'WTS Stock by Model',font:{size:11}}}}});
  }
  window._raExportExcel=function(){
    var tbl=document.getElementById('raTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    if(typeof XLSX==='undefined')return showMsg('XLSX not loaded','error');
    XLSX.writeFile(XLSX.utils.table_to_book(tbl,{sheet:'Stock Aging'}),'StockAging_'+_today()+'.xlsx');
  };
  window._raPrint=function(){
    var tbl=document.getElementById('raTable');
    if(!tbl||!tbl.rows.length)return showMsg('No data','error');
    var w=window.open('','','width=1100,height=700');
    w.document.write('<html><head><title>Stock Aging Report</title><style>table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #999;padding:4px 6px}th{background:#1e3c72;color:#fff}</style></head><body><h2>Stock Aging Report - '+_today()+'</h2>'+tbl.outerHTML+'</body></html>');
    w.document.close();setTimeout(function(){w.print()},300);
  };
  document.getElementById('raModel')?.addEventListener('change',function(){window._raRender()});
  document.getElementById('raStorage')?.addEventListener('change',function(){window._raRender()});

  var origSwitchTab=window.switchTab;
  window.switchTab=function(tab){
    if(origSwitchTab)origSwitchTab(tab);
    if(tab==='reports'){
      setTimeout(function(){window._rdRender()},150);
    }
  };
  document.querySelectorAll('.tab-btn[data-tab="reports"]').forEach(function(btn){
    btn.addEventListener('click',function(){
      setTimeout(function(){window._rdRender()},150);
    });
  });
})()
// ===================== END REPORTS MODULE =====================

  // ===================== CUSTOMS / SALES REPORT MODULE =====================
  ;(function(){
    var custVendor=document.getElementById('cust-vendor')
    var custDateFrom=document.getElementById('cust-date-from')
    var custDateClear=document.getElementById('custDateClear')
    var custTxType=document.getElementById('cust-txtype')
    var custShowColor=document.getElementById('cust-showcolor')
    var custGenerate=document.getElementById('custGenerate')
    var custPdf=document.getElementById('custPdf')
    var custPrint=document.getElementById('custPrint')
    if(!custGenerate)return

    if(custDateFrom && !custDateFrom.value){
      custDateFrom.value=new Date().toISOString().slice(0,10)
    }

    function populateCustFilters(){
      var logistics=new Set()
      var today=new Date().toISOString().slice(0,10)
      var dateVal=(custDateFrom&&custDateFrom.value)?custDateFrom.value:today
      allSavedTx.forEach(function(t){
        if(t.logistics && (t.date||'').slice(0,10)===dateVal)logistics.add(t.logistics)
      })
      var vv=custVendor.value
      custVendor.innerHTML='<option value="">-- All --</option>'
      ;[...logistics].sort().forEach(function(v){custVendor.innerHTML+='<option value="'+esc(v)+'">'+esc(v)+'</option>'})
      custVendor.value=vv
    }

    if(custDateClear){
      custDateClear.addEventListener('click',function(){
        if(custDateFrom)custDateFrom.value=''
        generateCustomsReport()
      })
    }

    function generateCustomsReport(){
      var vendor=custVendor.value
      var dateVal=custDateFrom?custDateFrom.value:''
      var txType=custTxType.value
      var showColor=custShowColor.checked

      var dateLabel=dateVal||new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})

      document.getElementById('cust-top-vendor').textContent=vendor||''
      document.getElementById('cust-top-date').textContent=dateLabel
      document.getElementById('cust-f-date').textContent=dateLabel
      document.getElementById('cust-f-logistics').textContent=vendor||''

      var filtered=allSavedTx.filter(function(t){
        if(vendor&&t.logistics!==vendor)return false
        if(dateVal&&t.date!==dateVal)return false
        if(txType&&t.transaction_type!==txType)return false
        return true
      })

      var marksSet=new Set()
      filtered.forEach(function(t){marksSet.add(t.marks||'No Mark')})
      var marksCols=[...marksSet].sort(function(a,b){
        if(a==='No Mark')return -1;if(b==='No Mark')return 1;return a.localeCompare(b)
      })

      var countries={}
      filtered.forEach(function(t){
        var specs=(t.specs||'').trim().toLowerCase()
        var country=(specs==='india'||specs==='in')?'Assembled in India':'Assembled in China'

        if(!countries[country])countries[country]={}
        var itemName=(t.item_name||'').trim()
        itemName=itemName.replace(/\s*(Korea|Japan|India|HK|Hong Kong|USA|China|JP|KR|IN)\s*/gi,'').trim()
        var storage=(t.storage||'').trim()
        var spec=itemName+(storage?' '+storage:'')
        if(!countries[country][spec])countries[country][spec]={}

        var colorKey=showColor?(t.color||'-'):'-'
        if(!countries[country][spec][colorKey])countries[country][spec][colorKey]={}

        var mark=t.marks||'No Mark'
        var qty=parseInt(t.quantity)||0
        countries[country][spec][colorKey][mark]=(countries[country][spec][colorKey][mark]||0)+qty
      })

      var html='<table class="pivot-tbl"><thead><tr><th>Sum of Qty</th><th></th>'
      if(showColor)html+='<th></th>'
      html+='<th>MARKS</th>'
      marksCols.forEach(function(m){html+='<th>'+esc(m)+'</th>'})
      html+='<th>Grand Total</th></tr>'
      html+='<tr><th>Country of Origin</th><th>Specification</th>'
      if(showColor)html+='<th>Item With Color</th>'
      html+='<th></th>'
      marksCols.forEach(function(m){html+='<th></th>'})
      html+='<th></th></tr></thead><tbody>'

      var grandTotals={}
      marksCols.forEach(function(m){grandTotals[m]=0})
      var grandTotal=0

      var countryOrder=['Assembled in China','Assembled in India']
      countryOrder.forEach(function(country){
        if(!countries[country])return
        var countryTotals={};marksCols.forEach(function(m){countryTotals[m]=0})
        var countryTotal=0
        var specs=countries[country]
        var specKeys=Object.keys(specs).sort()

        var firstCountryRow=true
        specKeys.forEach(function(spec){
          var colors=specs[spec]
          var colorKeys=Object.keys(colors).sort()
          
          var specTotals={};marksCols.forEach(function(m){specTotals[m]=0})
          var specTotal=0
          colorKeys.forEach(function(ck){
            var md=colors[ck]
            marksCols.forEach(function(m){specTotals[m]+=(md[m]||0)})
          })
          marksCols.forEach(function(m){specTotal+=specTotals[m]})

          var firstSpecRow=true
          colorKeys.forEach(function(colorKey){
            var marksData=colors[colorKey]
            var rowTotal=0
            html+='<tr>'
            if(firstCountryRow){html+='<td class="col-country">'+esc(country==='Assembled in China'?'China':'India')+'</td>';firstCountryRow=false}
            else html+='<td></td>'
            if(firstSpecRow){html+='<td><strong>'+esc(spec)+'</strong></td>';firstSpecRow=false}
            else html+='<td></td>'
            if(showColor)html+='<td>'+esc(spec)+' '+(colorKey!=='-'?esc(colorKey):'')+'</td>'
            html+='<td></td>'
            marksCols.forEach(function(m){
              var v=marksData[m]||0
              rowTotal+=v;countryTotals[m]+=v;grandTotals[m]+=v
              html+='<td>'+(v?v:'-')+'</td>'
            })
            countryTotal+=rowTotal;grandTotal+=rowTotal
            html+='<td><strong>'+rowTotal+'</strong></td></tr>'
          })

          if(showColor&&colorKeys.length>0){
            html+='<tr style="background:#f5f5f5;font-weight:600"><td></td><td>Sub Total</td>'
            if(showColor)html+='<td></td>'
            html+='<td></td>'
            marksCols.forEach(function(m){html+='<td>'+(specTotals[m]||'-')+'</td>'})
            html+='<td><strong>'+specTotal+'</strong></td></tr>'
          }
        })

        html+='<tr class="row-subtotal"><td colspan="'+(showColor?3:2)+'">'+(country==='Assembled in China'?'China Total':'India Total')+'</td><td></td>'
        marksCols.forEach(function(m){html+='<td>'+(countryTotals[m]||'-')+'</td>'})
        html+='<td><strong>'+countryTotal+'</strong></td></tr>'
      })

      html+='<tr class="row-total"><td colspan="'+(showColor?3:2)+'">Grand Total</td><td></td>'
      marksCols.forEach(function(m){html+='<td><strong>'+(grandTotals[m]||'-')+'</strong></td>'})
      html+='<td><strong>'+grandTotal+'</strong></td></tr>'
      html+='</tbody></table>'

      document.getElementById('cust-pivot-wrap').innerHTML=html
    }

    custGenerate.addEventListener('click',function(){
      populateCustFilters()
      generateCustomsReport()
    })

    function liveCustRefresh(){
      if(document.getElementById('cust-pivot-wrap')&&document.getElementById('cust-pivot-wrap').querySelector('.pivot-tbl')){
        generateCustomsReport()
      }
    }
    if(custDateFrom)custDateFrom.addEventListener('change',liveCustRefresh)
    if(custVendor)custVendor.addEventListener('change',liveCustRefresh)
    if(custTxType)custTxType.addEventListener('change',liveCustRefresh)
    if(custShowColor)custShowColor.addEventListener('change',liveCustRefresh)

    custPdf.addEventListener('click',function(){
      var page=document.getElementById('cust-page')
      if(!page||!page.querySelector('.pivot-tbl'))return showMsg('Generate report first','error')
      if(typeof html2canvas==='undefined')return showMsg('html2canvas not loaded','error')
      html2canvas(page,{scale:2}).then(function(canvas){
        var pdf=new jspdf.jsPDF('l','mm','a4')
        var w=pdf.internal.pageSize.getWidth()-20
        var h=canvas.height*w/canvas.width
        pdf.addImage(canvas.toDataURL('image/png'),'PNG',10,10,w,h)
        pdf.save('Sales_Report_'+new Date().toISOString().slice(0,10)+'.pdf')
        showMsg('PDF saved!')
      })
    })

    custPrint.addEventListener('click',function(){
      var page=document.getElementById('cust-page')
      if(!page)return
      var w=window.open('','','width=1100,height=800')
      w.document.write('<html><head><title>Sales Report</title><style>body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:3px 6px}th{background:#f0f0f0;font-size:9.5px}.row-total td,.row-subtotal td{font-weight:700;background:#e8e8e8}.col-country{font-weight:700}</style></head><body>')
      w.document.write(page.innerHTML)
      w.document.write('</body></html>')
      w.document.close()
      setTimeout(function(){w.print()},300)
    })

    document.querySelectorAll('.tab-btn[data-tab="customs"]').forEach(function(btn){
      btn.addEventListener('click',function(){
        setTimeout(populateCustFilters,100)
      })
    })
  })()
  // ===================== END CUSTOMS MODULE =====================

  // ===================== PRICING MODULE =====================
  ;(function(){
    var currentView='pending'
    var _today=function(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}()
    var _pricingDateFilter=_today

    function getPending(){try{return JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){return []}}
    function savePending(arr){try{localStorage.setItem('pricingPending',JSON.stringify(arr))}catch(e){}}

    window.onPricingDateChange=function(){
      var el=document.getElementById('pricingDateFilter')
      _pricingDateFilter=el?el.value:_today
      switchPricingView(currentView)
    }
    window.onPricingDateAll=function(){
      _pricingDateFilter=''
      var el=document.getElementById('pricingDateFilter')
      if(el)el.value=''
      switchPricingView(currentView)
    }
    function setPricingDateUI(){
      var el=document.getElementById('pricingDateFilter')
      if(el&&el.value!==_pricingDateFilter)el.value=_pricingDateFilter||''
    }

    function getSalesmen(){try{return JSON.parse(localStorage.getItem('salesmen'))||[]}catch(e){return []}}
    function saveSalesmen(arr){try{localStorage.setItem('salesmen',JSON.stringify(arr))}catch(e){}}
    function renderSalesmanSelect(entryId,currentVal){
      var salesmen=getSalesmen();
      var html='<select class="salesman-select" onchange="onSalesmanChange(\''+entryId+'\',this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid #cbd5e1;font-size:12px;font-weight:600;color:#1e3c72;background:#fff;cursor:pointer;min-width:160px">';
      html+='<option value="">-- Select Salesman --</option>';
      salesmen.forEach(function(s){
        html+='<option value="'+esc(s)+'"'+(s===currentVal?' selected':'')+'>'+esc(s)+'</option>';
      });
      html+='<option value="__add_new__" style="font-weight:700;color:#1e3c72;background:#f0f9ff">➕ Add New Salesman...</option>';
      html+='</select>';
      return html;
    }
    window.onSalesmanChange=function(entryId,value){
      if(value==='__add_new__'){
        var name=prompt('Enter new salesman name:');
        if(name && name.trim()){
          var cleanName=name.trim();
          var salesmen=getSalesmen();
          var exists=salesmen.some(function(s){return s.toLowerCase()===cleanName.toLowerCase()});
          if(!exists){salesmen.push(cleanName);salesmen.sort();saveSalesmen(salesmen)}
          var pending=getPending();
          for(var i=0;i<pending.length;i++){
            if(pending[i].id===entryId){pending[i].salesman=cleanName;break}
          }
          savePending(pending);
          renderPendingView();
          showMsg('Salesman "'+cleanName+'" added and assigned');
          try{autoBackup()}catch(e){}
        }else{
          renderPendingView();
        }
        return;
      }
      var pending=getPending();
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){pending[i].salesman=value;break}
      }
      savePending(pending);
      if(value)showMsg('Salesman assigned: '+value);
    }

    window.openSalesmanManager=function(){
      var modal=document.getElementById('salesmanManagerModal');
      if(!modal){
        modal=document.createElement('div');
        modal.id='salesmanManagerModal';
        modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
        modal.onclick=function(e){if(e.target===modal)closeSalesmanManager()};
        document.body.appendChild(modal);
      }
      var salesmen=getSalesmen();
      window._smCurrentList=salesmen.slice();
      var pending=getPending();
      var html='<div style="background:#fff;border-radius:12px;padding:0;max-width:500px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden">';
      html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff">';
      html+='<h3 style="margin:0;font-size:16px">⚙️ Manage Salesmen</h3>';
      html+='<button onclick="closeSalesmanManager()" style="background:rgba(255,255,255,0.2);border:none;font-size:20px;cursor:pointer;color:#fff;width:32px;height:32px;border-radius:50%;line-height:1">&times;</button>';
      html+='</div>';
      html+='<div style="padding:16px 24px;flex:1;overflow-y:auto">';
      if(!salesmen.length){
        html+='<div style="text-align:center;padding:30px 20px;color:#64748b"><div style="font-size:32px;margin-bottom:8px">👤</div><div style="font-weight:600;margin-bottom:4px">No salesmen yet</div><div style="font-size:12px">Use the dropdown or "Add New" button to add salesmen.</div></div>';
      } else {
        html+='<div style="display:flex;flex-direction:column;gap:8px">';
        salesmen.forEach(function(s,i){
          var usageCount=pending.filter(function(e){return e.salesman===s}).length;
          html+='<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">';
          html+='<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">'+esc(s.charAt(0).toUpperCase())+'</div>';
          html+='<div style="flex:1;min-width:0"><div style="font-weight:700;color:#1e3c72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(s)+'</div>';
          html+='<div style="font-size:11px;color:#64748b">'+usageCount+' order'+(usageCount!==1?'s':'')+' assigned</div></div>';
          html+='<button onclick="editSalesmanAt('+i+')" title="Edit" style="padding:7px 10px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="fas fa-pen"></i></button>';
          html+='<button onclick="deleteSalesmanAt('+i+')" title="Delete" style="padding:7px 10px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="fas fa-trash"></i></button>';
          html+='</div>';
        });
        html+='</div>';
      }
      html+='</div>';
      html+='<div style="padding:14px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:space-between;gap:8px">';
      html+='<button onclick="addNewSalesmanFromManager()" style="padding:9px 16px;background:#22c55e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">➕ Add New Salesman</button>';
      html+='<button onclick="closeSalesmanManager()" style="padding:9px 16px;background:#64748b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">Close</button>';
      html+='</div>';
      html+='</div>';
      modal.innerHTML=html;
      modal.style.display='flex';
    }

    window.closeSalesmanManager=function(){
      var modal=document.getElementById('salesmanManagerModal');
      if(modal)modal.style.display='none';
    }

    window.editSalesmanAt=function(idx){
      var name=window._smCurrentList&&window._smCurrentList[idx];
      if(!name)return;
      var newName=prompt('Edit salesman name:',name);
      if(newName===null)return;
      newName=newName.trim();
      if(!newName){alert('Name cannot be empty');return}
      if(newName===name)return;
      var salesmen=getSalesmen();
      var exists=salesmen.some(function(s){return s.toLowerCase()===newName.toLowerCase()});
      if(exists){alert('A salesman with name "'+newName+'" already exists');return}
      var pos=salesmen.indexOf(name);
      if(pos>=0)salesmen[pos]=newName;
      salesmen.sort();
      saveSalesmen(salesmen);
      var pending=getPending();
      var updated=0;
      pending.forEach(function(e){if(e.salesman===name){e.salesman=newName;updated++}});
      savePending(pending);
      showMsg('Renamed: "'+name+'" → "'+newName+'" ('+updated+' order'+(updated!==1?'s':'')+' updated)');
      openSalesmanManager();
      renderPendingView();
      renderCompletedView();
      try{autoBackup()}catch(e){}
    }

    window.deleteSalesmanAt=function(idx){
      var name=window._smCurrentList&&window._smCurrentList[idx];
      if(!name)return;
      var pending=getPending();
      var usageCount=pending.filter(function(e){return e.salesman===name}).length;
      var msg='Delete salesman "'+name+'"?';
      if(usageCount>0)msg+='\n\n'+usageCount+' order'+(usageCount!==1?'s':'')+' currently assigned will be cleared.';
      if(!confirm(msg))return;
      var salesmen=getSalesmen();
      var pos=salesmen.indexOf(name);
      if(pos>=0)salesmen.splice(pos,1);
      saveSalesmen(salesmen);
      var updated=0;
      pending.forEach(function(e){if(e.salesman===name){e.salesman='';updated++}});
      savePending(pending);
      showMsg('Deleted "'+name+'" ('+updated+' order'+(updated!==1?'s':'')+' cleared)');
      openSalesmanManager();
      renderPendingView();
      renderCompletedView();
      try{autoBackup()}catch(e){}
    }

    window.addNewSalesmanFromManager=function(){
      var name=prompt('Enter new salesman name:');
      if(name===null)return;
      name=name.trim();
      if(!name){alert('Name cannot be empty');return}
      var salesmen=getSalesmen();
      var exists=salesmen.some(function(s){return s.toLowerCase()===name.toLowerCase()});
      if(exists){alert('A salesman with name "'+name+'" already exists');openSalesmanManager();return}
      salesmen.push(name);
      salesmen.sort();
      saveSalesmen(salesmen);
      showMsg('Salesman "'+name+'" added');
      openSalesmanManager();
      try{autoBackup()}catch(e){}
    }

    function pricingCurrency(){
      var el=document.getElementById('pricingCurrency')
      return el?el.value:'USD'
    }
    function pricingSymbol(){
      return pricingCurrency()==='AED'?'AED ':'$'
    }
    function pricingConv(val){
      var cur=pricingCurrency()
      return cur==='AED'?val*3.674:val
    }
    window.refreshPricingView=function(){switchPricingView(currentView)}
    window.switchPricingView=function(view){
      currentView=view
      document.getElementById('pricingViewPending').className=view==='pending'?'active':''
      document.getElementById('pricingViewCompleted').className=view==='completed'?'active':''
      document.getElementById('pricingPendingView').style.display=view==='pending'?'block':'none'
      document.getElementById('pricingCompletedView').style.display=view==='completed'?'block':'none'
      if(view==='pending')renderPendingView()
      else renderCompletedView()
    }

    function renderPendingView(){
      setPricingDateUI()
      var el=document.getElementById('pricingPendingView')
      var allPending=getPending().filter(function(e){return !e.completed})
      var totalBefore=allPending.length
      var pending=_pricingDateFilter?allPending.filter(function(e){return e.date===_pricingDateFilter}):allPending
      var headerHtml='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:10px 14px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:8px;border:1px solid #bfdbfe">'
        +'<div style="font-size:12px;color:#1e3c72"><i class="fas fa-info-circle"></i> <strong>Pending pricing</strong> — set unit prices and assign a salesman before submitting. <span style="color:#64748b">'+(_pricingDateFilter?('Showing '+pending.length+' of '+totalBefore+' for '+_pricingDateFilter):('Showing all '+totalBefore))+'</span></div>'
        +'<button onclick="openSalesmanManager()" style="padding:7px 14px;background:#1e3c72;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600"><i class="fas fa-users-cog"></i> ⚙️ Manage Salesmen</button>'
        +'</div>';
      if(!pending.length){
        var empty=_pricingDateFilter
          ?('No pending pricing for '+_pricingDateFilter+'. <a href="#" onclick="onPricingDateAll();return false" style="color:#89b4fa;text-decoration:underline">Show all dates</a>')
          :('No pending pricing submissions. Submit from Delivery Order.')
        el.innerHTML=headerHtml+'<div class="pricing-empty">'+empty+'</div>';return
      }
      var html=headerHtml
      html+='<div class="pricing-card-list">'
      pending.forEach(function(entry,ei){
        html+='<div class="appr-card pending pricing-card" data-id="'+entry.id+'">'
        html+='<div class="appr-header">'
        html+='<h3>'+esc(entry.customer)+'</h3>'
        html+='<div class="appr-meta">'
        if(entry.date)html+='<span>&#128197; '+esc(entry.date)+'</span>'
        if(entry.logistics)html+='<span>&#128666; '+esc(entry.logistics)+'</span>'
        if(entry.marks)html+='<span>&#128220; '+esc(entry.marks)+'</span>'
        if(entry.week)html+='<span>&#128197; '+esc(entry.week)+'</span>'
        if(entry.salesman)html+='<span style="background:#dbeafe;color:#1e3c72;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>'
        html+='<span class="appr-badge pending">Pending</span>'
        html+='</div></div>'
        html+='<div style="padding:6px 14px;display:flex;align-items:center;gap:16px;background:#f0f9ff;border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;font-size:11px">'
        html+='<span>&#128100; <strong>Salesman:</strong> '+renderSalesmanSelect(entry.id,entry.salesman||'')+'</span>'
        if(entry.salesman)html+='<span style="color:#16a34a;font-weight:700">&#10003; '+esc(entry.salesman)+'</span>'
        html+='<span style="margin-left:auto;font-size:10px;color:#888">'+new Date(entry.submittedAt).toLocaleString()+'</span>'
        html+='</div>'
        html+='<table class="appr-tbl">'
        html+='<thead><tr><th>#</th><th style="text-align:left">Item</th><th>Color</th><th>Qty</th><th>Price</th><th>Total ('+pricingSymbol().trim()+')</th></tr></thead>'
        html+='<tbody>'
        var grand=0
        entry.items.forEach(function(item,ii){
          var unit=parseInt(item.qty)||0
          var price=parseFloat(item.unitPrice)||0
          var total=unit*price
          if(price>0)grand+=total
          html+='<tr><td>'+(ii+1)+'</td><td class="item-name">IPHONE '+esc(item.name)+'</td><td>'+esc(item.color)+'</td><td>'+unit+'</td>'
          var priceInput='<span class="curr-s">'+pricingSymbol()+'</span><input class="price-input" type="number" step="0.01" min="0" value="'+(price>0?price:'')+'" placeholder="0.00" onchange="onPricingItemPriceChange(\''+entry.id+'\','+ii+',this.value)" onfocus="this.select()" style="width:60px;padding:2px 4px;border:1px solid #ccc;border-radius:3px;font-size:10px;text-align:right;font-weight:600">'
          html+='<td>'+priceInput+'</td>'
          html+='<td style="font-weight:700">'+(total>0?pricingSymbol()+pricingConv(total).toFixed(2):'-')+'</td></tr>'
        })
        html+='</tbody>'
        var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
        html+='<tfoot><tr class="appr-total"><td colspan="3" style="text-align:right">Total Units</td><td>'+totalUnits+'</td><td></td><td style="font-weight:700;color:#1e3c72">'+(grand>0?pricingSymbol()+pricingConv(grand).toFixed(2):pricingSymbol()+'0.00')+'</td></tr></tfoot>'
        html+='</table>'
        html+='<div class="appr-actions">'
        html+='<button class="btn btn-success" style="background:#4ade80;color:#1e1e2e" onclick="submitPricingEntry(\''+entry.id+'\')"><i class="fas fa-check"></i> SUBMIT</button>'
        html+='<button class="btn btn-danger" style="background:#ff3b30;color:#fff" onclick="deletePricingEntry(\''+entry.id+'\')"><i class="fas fa-trash"></i> DELETE</button>'
        html+='</div>'
        html+='</div>'
      })
      html+='</div>'
      el.innerHTML=html
    }

    window.onPricingItemPriceChange=function(entryId,itemIdx,val){
      var pending=getPending()
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){
          pending[i].items[itemIdx].unitPrice=parseFloat(val)||''
          break
        }
      }
      savePending(pending)
      // Recalculate all totals for this entry
      var entryEl=document.querySelector('#pricingPendingView .pricing-card[data-id="'+entryId+'"]')
      if(entryEl){
        var rows=entryEl.querySelectorAll('tbody tr')
        var grand=0
        rows.forEach(function(row,ri){
          var inp=row.querySelector('.price-input')
          var pr=parseFloat(inp?inp.value:0)||0
          var unit=parseInt(row.cells[3].textContent)||0
          var total=unit*pr
          if(pr>0)grand+=total
          var tc=row.cells[5]
          if(tc){
            if(pr>0)tc.textContent=pricingSymbol()+pricingConv(total).toFixed(2)
            else tc.textContent='-'
          }
        })
        var gf=entryEl.querySelector('.appr-total td:last-child')
        if(gf)gf.textContent=grand>0?pricingSymbol()+pricingConv(grand).toFixed(2):pricingSymbol()+'0.00'
      }
    }

    window.submitPricingEntry=function(entryId){
      if(!confirm('Submit this pricing? It will go to DO Approval.'))return
      var pending=getPending()
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){
          pending[i].completed=true
          pending[i].completedAt=Date.now()
          pending[i].approved=undefined // goes to approval panel
          pending[i]._pricingDone=true
          break
        }
      }
      savePending(pending)
      renderPendingView()
      showMsg('Pricing submitted! Waiting for DO Approval.')
      autoBackup()
      refreshAllSections()
      if(typeof updateTabNotifs==='function')updateTabNotifs()
    }

    window.deletePricingEntry=function(entryId){
      if(!confirm('Delete this pricing entry?'))return
      var pending=getPending()
      var entry=null
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){entry=pending[i];pending.splice(i,1);break}
      }
      savePending(pending)
      // Remove submitted keys
      if(entry&&entry.submittedKeys){
        var existing=getSubmittedKeys()
        Object.keys(entry.submittedKeys).forEach(function(k){
          if(existing[k])existing[k]-=entry.submittedKeys[k]
          if(existing[k]<=0)delete existing[k]
        })
        saveSubmittedKeys(existing)
      }
      renderPendingView()
      renderCompletedView()
      showMsg('Pricing entry deleted')
      refreshAllSections()
    }

    function renderCompletedView(){
      setPricingDateUI()
      var el=document.getElementById('pricingCompletedView')
      var allCompleted=getPending().filter(function(e){return e.completed})
      var totalBefore=allCompleted.length
      var completed=_pricingDateFilter?allCompleted.filter(function(e){return e.date===_pricingDateFilter}):allCompleted
      if(!completed.length){
        var empty=_pricingDateFilter
          ?('No completed pricing for '+_pricingDateFilter+'. <a href="#" onclick="onPricingDateAll();return false" style="color:#89b4fa;text-decoration:underline">Show all dates</a>')
          :('No completed pricing entries.')
        el.innerHTML='<div class="pricing-empty">'+empty+'</div>';return
      }
      var dateInfo=_pricingDateFilter?('<div style="margin-bottom:10px;padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;font-size:12px;color:#1e3c72">Showing <strong>'+completed.length+'</strong> of '+totalBefore+' for <strong>'+_pricingDateFilter+'</strong> &middot; <a href="#" onclick="onPricingDateAll();return false" style="color:#3b82f6;text-decoration:underline">Show all dates</a></div>'):''
      var html=dateInfo+'<div class="completed-list">'
      completed.forEach(function(entry){
        var totalItems=entry.items.reduce(function(s,it){return s+(parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0)},0)
        html+='<div class="completed-card">'
        html+='<div class="card-info"><strong>'+esc(entry.customer)+'</strong> &middot; '+entry.items.length+' items &middot; Total: <strong>'+pricingSymbol()+pricingConv(totalItems).toFixed(2)+'</strong> &middot; <span style="color:#888">'+new Date(entry.completedAt).toLocaleDateString()+'</span>'+(entry.salesman?' &middot; <span style="background:#dbeafe;color:#1e3c72;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>':'')+'</div>'
        html+='<div class="card-actions">'
        html+='<button class="btn" style="background:#89b4fa;color:#1e1e2e;font-size:10px;padding:4px 10px" onclick="editCompletedPricing(\''+entry.id+'\')">Edit</button>'
        html+='<button class="btn" style="background:#f59e0b;color:#1e1e2e;font-size:10px;padding:4px 10px" onclick="backToDO(\''+entry.id+'\')">Back to DO</button>'
        html+='<button class="btn" style="background:#ff3b30;color:#fff;font-size:10px;padding:4px 10px" onclick="deletePricingEntry(\''+entry.id+'\')">Delete</button>'
        html+='</div></div>'
      })
      html+='</div>'
      el.innerHTML=html
    }

    window.editCompletedPricing=function(entryId){
      var pending=getPending()
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){
          pending[i].completed=false
          pending[i].completedAt=null
          pending[i].approved=undefined
          break
        }
      }
      savePending(pending)
      switchPricingView('pending')
      renderPendingView()
      showMsg('Entry moved to pending for editing')
      refreshAllSections()
    }

    window.backToDO=function(entryId){
      var pending=getPending()
      var entry=null
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===entryId){
          entry=pending[i]
          pending.splice(i,1)
          break
        }
      }
      if(!entry){showMsg('Entry not found','error');return}
      savePending(pending)
      // Remove submitted keys so items appear in DO again
      if(entry.submittedKeys){
        var existing=getSubmittedKeys()
        Object.keys(entry.submittedKeys).forEach(function(k){
          if(existing[k])existing[k]-=entry.submittedKeys[k]
          if(existing[k]<=0)delete existing[k]
        })
        saveSubmittedKeys(existing)
      }
      switchTab('delivery')
      // Populate DO fields after initDO has run
      setTimeout(function(){
        var sel=document.getElementById('do-customer')
        if(sel)sel.value=entry.customer
        document.getElementById('do-logistics').value=entry.logistics||''
        document.getElementById('do-status').value=entry.status||'Order In Hand'
        document.getElementById('do-date').value=entry.date||''
        document.getElementById('do-week').value=entry.week||''
        updateDOField('customer',entry.customer)
        updateDOField('logistics',entry.logistics||'')
        updateDOField('status',entry.status||'Order In Hand')
        updateDOField('date',entry.date||'')
        updateDOField('week',entry.week||'')
        updateDOField('marks',entry.marks||'--')
        populateDOMarks(entry.customer,false)
        if(entry.marks==='__ALL__'){window.doAllMarksView=true;updateDOField('marks','All Marks');loadDOAllMarks(entry.customer)}
        else{if(entry.marks){var ms=document.getElementById('do-marks');if(ms)ms.value=entry.marks};loadDOData(entry.customer,entry.marks)}
        renderDOTable()
      },50)
      showMsg('Entry sent back to Delivery Order')
      refreshAllSections()
    }

    window.printPricing=function(){
      var view=currentView==='pending'?'pricingPendingView':'pricingCompletedView'
      var el=document.getElementById(view)
      if(!el||!el.querySelector('.pricing-card')&&!el.querySelector('.completed-card')){
        showMsg('Nothing to print','error');return
      }
      var w=window.open('','','width=1100,height=800')
      w.document.write('<!DOCTYPE html><html><head><title>Pricing Sheet</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;padding:10mm 12mm}h3{font-size:13px;color:#1e3c72;margin:0 0 4px}.meta{display:flex;gap:20px;font-size:10px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:12px}th,td{border:1px solid #999;padding:4px 8px;text-align:center}th{background:#f0f0f0;font-weight:700;font-size:10px}td.item-name{text-align:left;font-weight:600;font-size:10.5px}.appr-total td{background:#e8e8e8;font-weight:700;font-size:11px}.no-print{display:none!important}.appr-actions{display:none}.completed-card{padding:8px 0;border-bottom:1px solid #eee;margin-bottom:4px}.completed-card .card-actions{display:none}</style></head><body>')
      w.document.write('<h1 style="font-size:16px;margin-bottom:4px">★ SUPERNOVA STOCK LEDGER</h1>')
      w.document.write('<h2 style="font-size:13px;margin-bottom:16px">'+(currentView==='pending'?'Pending Pricing':'Completed Pricing')+'</h2>')
      w.document.write(el.innerHTML)
      w.document.write('</body></html>')
      w.document.close()
      setTimeout(function(){w.print()},300)
    }

    window.savePricingPDF=function(){
      var view=currentView==='pending'?'pricingPendingView':'pricingCompletedView'
      var el=document.getElementById(view)
      if(!el||!el.querySelector('.pricing-card')&&!el.querySelector('.completed-card')){
        showMsg('Nothing to export','error');return
      }
      // Build a temporary container for PDF
      var container=document.createElement('div')
      container.style.cssText='font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;padding:30px 35px;background:#fff'
      container.innerHTML='<h1 style="font-size:16px;margin-bottom:4px">★ SUPERNOVA STOCK LEDGER</h1>'
      container.innerHTML+='<h2 style="font-size:13px;margin-bottom:16px">'+(currentView==='pending'?'Pending Pricing':'Completed Pricing')+'</h2>'
      container.innerHTML+=el.innerHTML
      // Remove buttons/inputs from the container
      container.querySelectorAll('.sub-actions,.no-print,button,input').forEach(function(n){n.remove()})
      document.body.appendChild(container)
      if(typeof html2canvas==='undefined'){document.body.removeChild(container);showMsg('html2canvas not loaded','error');return}
      html2canvas(container,{scale:2}).then(function(canvas){
        var pdf=new jspdf.jsPDF('p','mm','a4')
        var w=pdf.internal.pageSize.getWidth()-20
        var h=canvas.height*w/canvas.width
        pdf.addImage(canvas.toDataURL('image/png'),'PNG',10,10,w,h)
        pdf.save('Pricing_'+new Date().toISOString().slice(0,10)+'.pdf')
        document.body.removeChild(container)
        showMsg('PDF saved!')
      }).catch(function(){
        document.body.removeChild(container)
        showMsg('PDF generation failed','error')
      })
    }

    // Hook into tab switch
    var origPricingSwitch=window.switchTab
    window.switchTab=function(tab){
      if(origPricingSwitch)origPricingSwitch(tab)
      if(tab==='pricing'){
        switchPricingView('pending')
        renderPendingView()
        setTimeout(function(){
          try{
            var p=JSON.parse(localStorage.getItem('pricingPending'))||[]
            var unread=p.filter(function(e){return !e.completed && !e._pricingNotified})
            if(unread.length){
              showSubmitPopup(unread.length,'pricing')
              unread.forEach(function(e){e._pricingNotified=true})
              localStorage.setItem('pricingPending',JSON.stringify(p))
            }
          }catch(ee){}
        },300)
      }
    }
    document.querySelectorAll('.tab-btn[data-tab="pricing"]').forEach(function(btn){
      btn.addEventListener('click',function(){
        setTimeout(function(){switchPricingView('pending');renderPendingView()},100)
      })
    })
    var currencyEl=document.getElementById('pricingCurrency')
    if(currencyEl)currencyEl.addEventListener('change',function(){
      if(currentView==='completed')renderCompletedView()
      else renderPendingView()
    })
  })()
  // ===================== END PRICING MODULE =====================

  // Pricing table keyboard navigation (price-input arrows + Enter)
  !function(){
    var pp=document.getElementById('panel-pricing')
    if(!pp)return
    pp.addEventListener('keydown',function(e){
      var inp=e.target
      if(!inp.classList||!inp.classList.contains('price-input'))return
      if(e.key==='Enter'||e.key==='ArrowDown'){
        e.preventDefault()
        var tr=inp.closest('tr'),tb=tr&&tr.closest('tbody')
        if(!tb)return
        var rows=Array.from(tb.querySelectorAll(':scope > tr'))
        var idx=rows.indexOf(tr)
        if(idx>=0&&idx<rows.length-1){
          var next=rows[idx+1].querySelector('.price-input')
          if(next)next.focus()
        }
        return
      }
      if(e.key==='ArrowUp'){
        e.preventDefault()
        var tr=inp.closest('tr'),tb=tr&&tr.closest('tbody')
        if(!tb)return
        var rows=Array.from(tb.querySelectorAll(':scope > tr'))
        var idx=rows.indexOf(tr)
        if(idx>0){
          var prev=rows[idx-1].querySelector('.price-input')
          if(prev)prev.focus()
        }
        return
      }
      if(e.key==='ArrowLeft'){
        e.preventDefault()
        var td=inp.closest('td'),pr=td&&td.previousElementSibling
        while(pr){
          var pi=pr.querySelector('input,select,button')
          if(pi&&!pi.disabled){pi.focus();return}
          pr=pr.previousElementSibling
        }
        return
      }
      if(e.key==='ArrowRight'){
        e.preventDefault()
        var td=inp.closest('td'),nx=td&&td.nextElementSibling
        while(nx){
          var ni=nx.querySelector('input,select,button')
          if(ni&&!ni.disabled){ni.focus();return}
          nx=nx.nextElementSibling
        }
        return
      }
    })
  }()

  // ===================== DO APPROVAL MODULE =====================
  ;(function(){
    var approvalView='pending'
    var _today=function(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}()
    var _apprDateFilter=_today

    window.getApprovalView=function(){return approvalView}
    window.refreshApprovalView=function(){switchApprovalView(approvalView)}

    function getPending(){try{return JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){return []}}
    function savePending(arr){try{localStorage.setItem('pricingPending',JSON.stringify(arr))}catch(e){}}

    window.onApprDateChange=function(){
      var el=document.getElementById('apprDateFilter')
      _apprDateFilter=el?el.value:_today
      switchApprovalView(approvalView)
    }
    window.onApprDateAll=function(){
      _apprDateFilter=''
      var el=document.getElementById('apprDateFilter')
      if(el)el.value=''
      switchApprovalView(approvalView)
    }
    function setApprDateUI(){
      var el=document.getElementById('apprDateFilter')
      if(el&&el.value!==_apprDateFilter)el.value=_apprDateFilter||''
    }

    window.switchApprovalView=function(view){
      setApprDateUI()
      approvalView=view||'pending'
      document.querySelectorAll('#panel-approval .view-toggle button').forEach(function(b){b.classList.remove('active')})
      var btn=document.getElementById('apprView'+view.charAt(0).toUpperCase()+view.slice(1))
      if(btn)btn.classList.add('active')

      ;['Pending','Approved','Rejected','Released'].forEach(function(v){
        var el=document.getElementById('approval'+v)
        if(el)el.style.display=(v.toLowerCase()===view?'block':'none')
      })

      var all=getPending()
      var pendingEntries=all.filter(function(e){return e.completed && e.approved!==true && e.approved!==false})
      var approvedEntries=all.filter(function(e){return e.approved===true && e.cashReleased!==true})
      var releasedEntries=all.filter(function(e){return e.cashReleased===true})
      var rejectedEntries=all.filter(function(e){return e.approved===false})
      var totalAll=pendingEntries.length+approvedEntries.length+releasedEntries.length+rejectedEntries.length
      if(_apprDateFilter){
        pendingEntries=pendingEntries.filter(function(e){return e.date===_apprDateFilter})
        approvedEntries=approvedEntries.filter(function(e){return e.date===_apprDateFilter})
        releasedEntries=releasedEntries.filter(function(e){return e.date===_apprDateFilter})
        rejectedEntries=rejectedEntries.filter(function(e){return e.date===_apprDateFilter})
      }
      var totalAfter=pendingEntries.length+approvedEntries.length+releasedEntries.length+rejectedEntries.length

      var countEl=document.getElementById('apprPendingCount')
      if(countEl)countEl.textContent=pendingEntries.length
      var dateCountEl=document.getElementById('apprDateCount')
      if(dateCountEl)dateCountEl.textContent=_apprDateFilter?('Showing '+totalAfter+' of '+totalAll+' for '+_apprDateFilter):('Showing all '+totalAll)

      renderView('Pending',pendingEntries,'pending',renderApprovalCard)
      renderView('Approved',approvedEntries,'approved',renderApprovedCard)
      renderView('Rejected',rejectedEntries,'rejected',renderRejectedCard)
      renderView('Released',releasedEntries,'released',renderReleasedCard)

      window.refreshCompanyLogos()
    }

    function renderView(divName,entries,cls,renderFn){
      var el=document.getElementById('approval'+divName)
      if(!el)return
      if(!entries.length){
        var empty='No '+divName.toLowerCase().replace('_',' ')+' entries.'
        if(_apprDateFilter)empty+=' <a href="#" onclick="onApprDateAll();return false" style="color:#89b4fa;text-decoration:underline">Show all dates</a>'
        el.innerHTML='<div class="appr-empty">'+empty+'</div>'
        return
      }
      var html='<div style="margin-bottom:12px"><span class="appr-badge '+cls+'"><strong>'+entries.length+'</strong> '+divName.toLowerCase().replace('_',' ')+' order(s)</span></div>'
      entries.forEach(function(e){html+=renderFn(e)})
      el.innerHTML=html
      // Animate cards
      setTimeout(function(){
        var cards=el.querySelectorAll('.appr-card')
        cards.forEach(function(c,i){
          c.style.opacity='0'
          c.style.animation='bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) '+i*0.06+'s forwards'
        })
      },10)
    }

    function renderApprovalCard(entry){
      var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
      var grandTotal=entry.items.reduce(function(s,it){return s+((parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0))},0)
      var html='<div class="appr-card pending">'
      html+='<div class="appr-header">'
      html+='<h3>'+esc(entry.customer)+'</h3>'
      html+='<div class="appr-meta">'
      if(entry.date)html+='<span>&#128197; '+esc(entry.date)+'</span>'
      if(entry.logistics)html+='<span>&#128666; '+esc(entry.logistics)+'</span>'
      if(entry.marks)html+='<span>&#128220; '+esc(entry.marks)+'</span>'
      if(entry.week)html+='<span>&#128197; '+esc(entry.week)+'</span>'
      if(entry.salesman)html+='<span style="background:#dbeafe;color:#1e3c72;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>'
      html+='<span class="appr-badge pending">Pending</span>'
      html+='</div></div>'
      html+='<table class="appr-tbl">'
      html+='<thead><tr><th>#</th><th style="text-align:left">Item</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>'
      html+='<tbody>'
      entry.items.forEach(function(item,ii){
        var price=parseFloat(item.unitPrice)||0
        var qty=parseInt(item.qty)||0
        var total=price*qty
        html+='<tr><td>'+(ii+1)+'</td><td class="item-name">IPHONE '+esc(item.name)+'</td><td>'+esc(item.color)+'</td><td>'+qty+'</td><td>'+(price>0?'$'+price.toFixed(2):'-')+'</td><td style="font-weight:700">'+(total>0?'$'+total.toFixed(2):'-')+'</td></tr>'
      })
      html+='</tbody>'
      html+='<tfoot><tr class="appr-total"><td colspan="3" style="text-align:right">Total Units</td><td>'+totalUnits+'</td><td></td><td style="font-weight:700;color:#1e3c72">$'+grandTotal.toFixed(2)+'</td></tr></tfoot>'
      html+='</table>'
      html+='<div class="appr-actions">'
      html+='<button class="btn btn-success" style="background:#4ade80;color:#1e1e2e" onclick="approveDOEntry(\''+entry.id+'\')"><i class="fas fa-check"></i> Approve</button>'
      html+='<button class="btn btn-danger" style="background:#ff3b30;color:#fff" onclick="rejectDOEntry(\''+entry.id+'\')"><i class="fas fa-times"></i> Reject</button>'
      html+='<button class="btn btn-danger" style="background:#6b7280;color:#fff;margin-left:auto" onclick="deleteDOEntry(\''+entry.id+'\')"><i class="fas fa-trash"></i> Delete</button>'
      html+='</div>'
      html+='</div>'
      return html
    }

    function renderApprovedCard(entry){
      var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
      var grandTotal=entry.items.reduce(function(s,it){return s+((parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0))},0)
      var html='<div class="appr-card approved">'
      html+='<div class="appr-header">'
      html+='<h3>'+esc(entry.customer)+'</h3>'
      html+='<div class="appr-meta">'
      if(entry.date)html+='<span>&#128197; '+esc(entry.date)+'</span>'
      if(entry.logistics)html+='<span>&#128666; '+esc(entry.logistics)+'</span>'
      if(entry.marks)html+='<span>&#128220; '+esc(entry.marks)+'</span>'
      if(entry.week)html+='<span>&#128197; '+esc(entry.week)+'</span>'
      if(entry.salesman)html+='<span style="background:#dbeafe;color:#1e3c72;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>'
      html+='<span class="appr-badge approved">Approved</span>'
      html+='</div></div>'
      html+='<table class="appr-tbl">'
      html+='<thead><tr><th>#</th><th style="text-align:left">Item</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>'
      html+='<tbody>'
      entry.items.forEach(function(item,ii){
        var price=parseFloat(item.unitPrice)||0
        var qty=parseInt(item.qty)||0
        var total=price*qty
        html+='<tr><td>'+(ii+1)+'</td><td class="item-name">IPHONE '+esc(item.name)+'</td><td>'+esc(item.color)+'</td><td>'+qty+'</td><td>'+(price>0?'$'+price.toFixed(2):'-')+'</td><td style="font-weight:700">'+(total>0?'$'+total.toFixed(2):'-')+'</td></tr>'
      })
      html+='</tbody>'
      html+='<tfoot><tr class="appr-total"><td colspan="3" style="text-align:right">Total Units</td><td>'+totalUnits+'</td><td></td><td style="font-weight:700;color:#1e3c72">$'+grandTotal.toFixed(2)+'</td></tr></tfoot>'
      html+='</table>'
      html+='<div class="appr-actions">'
      html+='<button class="btn" style="background:#f59e0b;color:#1e1e2e" onclick="releaseAgainstCash(\''+entry.id+'\')"><i class="fas fa-hand-holding-usd"></i> Release Against Cash</button>'
      html+='<button class="btn btn-danger" style="background:#6b7280;color:#fff;margin-left:auto" onclick="deleteDOEntry(\''+entry.id+'\')"><i class="fas fa-trash"></i> Delete</button>'
      html+='</div>'
      html+='</div>'
      return html
    }

    function renderRejectedCard(entry){
      var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
      var grandTotal=entry.items.reduce(function(s,it){return s+((parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0))},0)
      var html='<div class="appr-card rejected">'
      html+='<div class="appr-header">'
      html+='<h3>'+esc(entry.customer)+'</h3>'
      html+='<div class="appr-meta">'
      if(entry.date)html+='<span>&#128197; '+esc(entry.date)+'</span>'
      if(entry.logistics)html+='<span>&#128666; '+esc(entry.logistics)+'</span>'
      if(entry.marks)html+='<span>&#128220; '+esc(entry.marks)+'</span>'
      if(entry.week)html+='<span>&#128197; '+esc(entry.week)+'</span>'
      if(entry.salesman)html+='<span style="background:#dbeafe;color:#1e3c72;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>'
      html+='<span class="appr-badge rejected">Rejected</span>'
      html+='</div></div>'
      html+='<table class="appr-tbl">'
      html+='<thead><tr><th>#</th><th style="text-align:left">Item</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>'
      html+='<tbody>'
      entry.items.forEach(function(item,ii){
        var price=parseFloat(item.unitPrice)||0
        var qty=parseInt(item.qty)||0
        var total=price*qty
        html+='<tr><td>'+(ii+1)+'</td><td class="item-name">IPHONE '+esc(item.name)+'</td><td>'+esc(item.color)+'</td><td>'+qty+'</td><td>'+(price>0?'$'+price.toFixed(2):'-')+'</td><td style="font-weight:700">'+(total>0?'$'+total.toFixed(2):'-')+'</td></tr>'
      })
      html+='</tbody>'
      html+='<tfoot><tr class="appr-total"><td colspan="3" style="text-align:right">Total Units</td><td>'+totalUnits+'</td><td></td><td style="font-weight:700;color:#1e3c72">$'+grandTotal.toFixed(2)+'</td></tr></tfoot>'
      html+='</table>'
      html+='<div class="appr-actions">'
      html+='<button class="btn" style="background:#89b4fa;color:#1e1e2e" onclick="unrejectDOEntry(\''+entry.id+'\')"><i class="fas fa-undo"></i> Move to Pending</button>'
      html+='<button class="btn btn-danger" style="background:#6b7280;color:#fff;margin-left:auto" onclick="deleteDOEntry(\''+entry.id+'\')"><i class="fas fa-trash"></i> Delete</button>'
      html+='</div>'
      html+='</div>'
      return html
    }

    function renderReleasedCard(entry){
      var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
      var grandTotal=entry.items.reduce(function(s,it){return s+((parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0))},0)
      var html='<div class="appr-card released">'
      html+='<div class="appr-header">'
      html+='<h3>'+esc(entry.customer)+'</h3>'
      html+='<div class="appr-meta">'
      if(entry.date)html+='<span>&#128197; '+esc(entry.date)+'</span>'
      if(entry.logistics)html+='<span>&#128666; '+esc(entry.logistics)+'</span>'
      if(entry.marks)html+='<span>&#128220; '+esc(entry.marks)+'</span>'
      if(entry.week)html+='<span>&#128197; '+esc(entry.week)+'</span>'
      if(entry.salesman)html+='<span style="background:#dbeafe;color:#1e3c72;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700">&#128100; '+esc(entry.salesman)+'</span>'
      html+='<span class="appr-badge released">Released Against Cash</span>'
      html+='</div></div>'
      html+='<table class="appr-tbl">'
      html+='<thead><tr><th>#</th><th style="text-align:left">Item</th><th>Color</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>'
      html+='<tbody>'
      entry.items.forEach(function(item,ii){
        var price=parseFloat(item.unitPrice)||0
        var qty=parseInt(item.qty)||0
        var total=price*qty
        html+='<tr><td>'+(ii+1)+'</td><td class="item-name">IPHONE '+esc(item.name)+'</td><td>'+esc(item.color)+'</td><td>'+qty+'</td><td>'+(price>0?'$'+price.toFixed(2):'-')+'</td><td style="font-weight:700">'+(total>0?'$'+total.toFixed(2):'-')+'</td></tr>'
      })
      html+='</tbody>'
      html+='<tfoot><tr class="appr-total"><td colspan="3" style="text-align:right">Total Units</td><td>'+totalUnits+'</td><td></td><td style="font-weight:700;color:#1e3c72">$'+grandTotal.toFixed(2)+'</td></tr></tfoot>'
      html+='</table>'
      html+='</div>'
      return html
    }

    window.approveDOEntry=function(entryId){
      if(!confirm('Approve this DO delivery order?'))return
      var all=getPending()
      for(var i=0;i<all.length;i++){
        if(all[i].id===entryId){
          all[i].approved=true
          all[i].approvedAt=Date.now()
          break
        }
      }
      savePending(all)
      switchApprovalView(approvalView)
      showMsg('Delivery Order Approved!')
      autoBackup()
      refreshAllSections()
      if(typeof updateTabNotifs==='function')updateTabNotifs()
    }

    window.releaseAgainstCash=function(entryId){
      if(!confirm('Release this approved DO against cash?'))return
      var all=getPending()
      for(var i=0;i<all.length;i++){
        if(all[i].id===entryId){
          all[i].cashReleased=true
          all[i].cashReleasedAt=Date.now()
          break
        }
      }
      savePending(all)
      switchApprovalView(approvalView)
      showMsg('Released Against Cash!')
      autoBackup()
      refreshAllSections()
      if(typeof updateTabNotifs==='function')updateTabNotifs()
    }

    window.rejectDOEntry=function(entryId){
      if(!confirm('Reject this DO?'))return
      var all=getPending()
      for(var i=0;i<all.length;i++){
        if(all[i].id===entryId){
          all[i].approved=false
          all[i].rejectedAt=Date.now()
          break
        }
      }
      savePending(all)
      switchApprovalView(approvalView)
      if(confirm('Move back to Pricing pending for editing?')){
        for(var j=0;j<all.length;j++){
          if(all[j].id===entryId){
            all[j].completed=false
            all[j].approved=undefined
            all[j].rejectedAt=undefined
            break
          }
        }
        savePending(all)
        switchApprovalView(approvalView)
        autoBackup()
        showMsg('Moved back to Pricing pending')
        refreshAllSections()
        if(typeof updateTabNotifs==='function')updateTabNotifs()
      }else{
        showMsg('DO Rejected')
        autoBackup()
        refreshAllSections()
        if(typeof updateTabNotifs==='function')updateTabNotifs()
      }
    }

    window.unrejectDOEntry=function(entryId){
      if(!confirm('Move this entry back to pending?'))return
      var all=getPending()
      for(var i=0;i<all.length;i++){
        if(all[i].id===entryId){
          all[i].approved=undefined
          all[i].rejectedAt=undefined
          break
        }
      }
      savePending(all)
      switchApprovalView(approvalView)
      showMsg('Moved back to pending')
      autoBackup()
      refreshAllSections()
    }

    window.deleteDOEntry=function(entryId){
      if(!confirm('Delete this DO entry permanently? This cannot be undone.'))return
      var all=getPending()
      all=all.filter(function(e){return e.id!==entryId})
      savePending(all)
      switchApprovalView(approvalView)
      showMsg('DO Entry Deleted')
      autoBackup()
      refreshAllSections()
    }

    window.deleteDOEntry=function(entryId){
      if(!confirm('Delete this DO entry permanently? This cannot be undone.'))return
      var all=getPending()
      all=all.filter(function(e){return e.id!==entryId})
      savePending(all)
      switchApprovalView(approvalView)
      showMsg('DO Entry Deleted')
      autoBackup()
      refreshAllSections()
    }

        var origApprSwitch=window.switchTab
    window.switchTab=function(tab){
      if(origApprSwitch)origApprSwitch(tab)
      if(tab==='approval'){
        switchApprovalView('pending')
      }
    }
    document.querySelectorAll('.tab-btn[data-tab="approval"]').forEach(function(btn){
      btn.addEventListener('click',function(){
        setTimeout(function(){switchApprovalView('pending')},100)
      })
    })
  })()
  // ===================== END DO APPROVAL MODULE =====================

  // ===================== WAREHOUSE MODULE =====================
  ;(function(){
    var warehouseView='topack'
    var whSelectedEntry=null
    var _today=function(){var d=new Date(),p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}()
    var _whDateFilter=_today

    window.getWarehouseView=function(){return warehouseView}
    window.refreshWarehouseView=function(){renderWarehouseView()}

    function getPending(){try{return JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){return []}}
    function savePending(arr){try{localStorage.setItem('pricingPending',JSON.stringify(arr))}catch(e){}}

    window.onWHDateChange=function(){
      var el=document.getElementById('whDateFilter')
      _whDateFilter=el?el.value:_today
      whSelectedEntry=null
      renderWarehouseView()
    }
    window.onWHDateAll=function(){
      _whDateFilter=''
      var el=document.getElementById('whDateFilter')
      if(el)el.value=''
      whSelectedEntry=null
      renderWarehouseView()
    }
    function setWHDateUI(){
      var el=document.getElementById('whDateFilter')
      if(el&&el.value!==_whDateFilter)el.value=_whDateFilter||''
    }

    window.switchWarehouseView=function(view){
      warehouseView=view||'topack'
      document.querySelectorAll('#panel-warehouse .view-toggle button').forEach(function(b){b.classList.remove('active')})
      var btnMap={topack:'whViewToPack',packed:'whViewPacked'}
      var btn=document.getElementById(btnMap[warehouseView])
      if(btn)btn.classList.add('active')

      document.getElementById('warehouseToPack').style.display=(warehouseView==='topack'?'block':'none')
      document.getElementById('warehousePacked').style.display=(warehouseView==='packed'?'block':'none')

      renderWarehouseView()
    }

    function renderWarehouseView(){
      setWHDateUI()
      var viewId=warehouseView==='topack'?'ToPack':'Packed'
      var listId=viewId==='ToPack'?'wh-customer-list':'wh-packing-list'
      var contentId=viewId==='ToPack'?'wh-content':'wh-packed-content'
      var listEl=document.getElementById(listId)
      var contentEl=document.getElementById(contentId)
      if(!listEl||!contentEl)return
      var all=getPending()
      var warehouseEntries=all.filter(function(e){return e.approved===true})
      var toPack=warehouseEntries.filter(function(e){return e.warehousePacked!==true})
      var packed=warehouseEntries.filter(function(e){return e.warehousePacked===true})
      var entries=warehouseView==='topack'?toPack:packed
      var totalBeforeFilter=entries.length
      if(_whDateFilter){
        entries=entries.filter(function(e){return e.date===_whDateFilter})
      }
      var isPackedView=warehouseView==='packed'

      var countEl=document.getElementById('whDateCount')
      if(countEl){
        var lbl=_whDateFilter?('Showing '+entries.length+' of '+totalBeforeFilter+' for '+_whDateFilter):('Showing all '+entries.length)
        countEl.textContent=lbl
      }

      if(!entries.length){
        var emptyMsg=_whDateFilter
          ?('No '+(isPackedView?'packed':'delivery orders')+' for '+_whDateFilter+'. <a href="#" onclick="onWHDateAll();return false" style="color:#89b4fa;text-decoration:underline">Show all dates</a>')
          :('No '+(isPackedView?'packed':'delivery orders')+'.')
        listEl.innerHTML='<div class="wh-empty">'+emptyMsg+'</div>'
        contentEl.innerHTML='<div class="wh-empty">'+(_whDateFilter?'Select "All Dates" to see other entries.':'Select a customer from the sidebar.')+'</div>'
        return
      }

      // Find selected entry
      var foundIdx=-1
      if(whSelectedEntry){
        for(var ei=0;ei<entries.length;ei++){
          if(entries[ei].id===whSelectedEntry.id){foundIdx=ei;break}
        }
      }
      if(foundIdx<0)foundIdx=0
      whSelectedEntry=entries[foundIdx]

      // Render sidebar
      var listHtml=''
      entries.forEach(function(entry,idx){
        var totalItems=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
        var isActive=entry.id===whSelectedEntry.id
        var isPacked=entry.warehousePacked===true
        var statusLabel=entry.cashReleased?'Released':'Approved'
        listHtml+='<div class="wh-list-item'+(isActive?' active':'')+(isPackedView?' packed':'')+'" onclick="whSelectCustomer(\''+entry.id+'\')">'
        listHtml+='<div class="wh-cust-name">'+esc(entry.customer)+'</div>'
        listHtml+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px"><span class="wh-cust-meta">'+esc(entry.logistics||'--')+' · '+totalItems+' qty</span><span class="wh-cust-count">'+totalItems+'</span></div>'
        listHtml+='</div>'
      })
      listEl.innerHTML=listHtml

      // Render content
      contentEl.innerHTML=renderWHContent(whSelectedEntry)
      // Re-apply edit mode if active
      if(window._whEditing)setTimeout(onWHStartEdit,0)
    }

    function renderWHContent(entry){
      if(!entry)return'<div class="wh-empty">Select a customer.</div>'
      var isPacked=entry.warehousePacked===true
      var statusLabel=entry.cashReleased?'Released Against Cash':'Approved'
      var totalUnits=entry.items.reduce(function(s,it){return s+(parseInt(it.qty)||0)},0)
      var html='<div class="wh-do-page" data-entry-id="'+escAttr(entry.id)+'">'
      html+='<div class="wh-do-header"><div><h3>'+esc(entry.customer)+'</h3></div><span style="font-size:11px;color:#888">'+statusLabel+' · '+totalUnits+' units</span></div>'
      html+='<div class="wh-do-meta">'
      if(entry.logistics)html+='<span>&#128666; <strong>Logistics:</strong> '+esc(entry.logistics)+'</span>'
      if(entry.marks)html+='<span>&#128220; <strong>Marks:</strong> '+esc(entry.marks)+'</span>'
      if(entry.date)html+='<span>&#128197; <strong>Date:</strong> '+esc(entry.date)+'</span>'
      if(entry.week)html+='<span>&#128197; <strong>Week:</strong> '+esc(entry.week)+'</span>'
      html+='</div>'
      html+=renderWHTable(entry)
      html+='<div class="wh-actions">'
      html+='<button class="btn wh-edit-btn" style="background:#1e3c72;color:#fff" data-action="edit" title="Edit Quantities"><i class="fas fa-edit"></i> EDIT QTY</button>'
      html+='<button class="btn wh-save-btn" style="background:#4ade80;color:#1e1e2e;display:none" data-action="save" title="Save Quantities"><i class="fas fa-save"></i> SAVE QTY</button>'
      html+='<button class="btn wh-cancel-btn" style="background:#ff3b30;color:#fff;display:none" data-action="cancel" title="Cancel Edit"><i class="fas fa-times"></i> CANCEL</button>'
      html+='<button class="btn" style="background:'+(isPacked?'#f59e0b':'#4ade80')+';color:#1e1e2e" onclick="whTogglePack(\''+entry.id+'\')" title="'+(isPacked?'Undo Packed':'Mark as Packed')+'"><i class="fas fa-'+(isPacked?'undo':'box')+'"></i> '+(isPacked?'UNDO PACKED':'MARK AS PACKED')+'</button>'
      html+='</div>'
      html+='</div>'
      return html
    }

    function getCurrentWHContainer(){
      var id=warehouseView==='topack'?'wh-content':'wh-packed-content'
      return document.getElementById(id)
    }

    window.onWHStartEdit=function(){
      var container=getCurrentWHContainer()
      if(!container)return
      var inputs=container.querySelectorAll('.wh-qty-input')
      var texts=container.querySelectorAll('.wh-qty-text')
      inputs.forEach(function(inp){inp.style.display='inline-block'})
      texts.forEach(function(t){t.style.display='none'})
      var editBtn=container.querySelector('.wh-edit-btn')
      var saveBtn=container.querySelector('.wh-save-btn')
      var cancelBtn=container.querySelector('.wh-cancel-btn')
      if(editBtn)editBtn.style.display='none'
      if(saveBtn)saveBtn.style.display='inline-flex'
      if(cancelBtn)cancelBtn.style.display='inline-flex'
      window._whEditing=true
    }

    window.onWHCancelEdit=function(){
      var container=getCurrentWHContainer()
      if(!container)return
      var cells=container.querySelectorAll('.wh-qty-cell')
      cells.forEach(function(cell){
        var orig=cell.getAttribute('data-orig-qty')
        var input=cell.querySelector('.wh-qty-input')
        var text=cell.querySelector('.wh-qty-text')
        if(input)input.value=orig
        if(text)text.textContent=orig
      })
      var inputs=container.querySelectorAll('.wh-qty-input')
      var texts=container.querySelectorAll('.wh-qty-text')
      inputs.forEach(function(inp){inp.style.display='none'})
      texts.forEach(function(t){t.style.display='inline'})
      var editBtn=container.querySelector('.wh-edit-btn')
      var saveBtn=container.querySelector('.wh-save-btn')
      var cancelBtn=container.querySelector('.wh-cancel-btn')
      if(editBtn)editBtn.style.display='inline-flex'
      if(saveBtn)saveBtn.style.display='none'
      if(cancelBtn)cancelBtn.style.display='none'
      window._whEditing=false
    }

    window.onWHSaveQty=function(){
      var container=getCurrentWHContainer()
      if(!container)return
      if(!whSelectedEntry){showMsg('No entry selected','error');return}
      var entry=whSelectedEntry
      var entryId=entry.id
      var inputs=container.querySelectorAll('.wh-qty-input')
      var changes=[]
      var hasError=false
      inputs.forEach(function(inp){
        var idx=parseInt(inp.getAttribute('data-idx'))
        var cell=inp.closest('.wh-qty-cell')
        var orig=parseInt(cell.getAttribute('data-orig-qty'))||0
        var newVal=parseInt(inp.value)
        if(isNaN(newVal)||newVal<0){
          showMsg('Invalid quantity at row '+(idx+1),'error')
          hasError=true
          return
        }
        if(newVal!==orig)changes.push({idx:idx,old:orig,new:newVal})
      })
      if(hasError)return
      if(changes.length===0){
        showMsg('No changes to save')
        onWHCancelEdit()
        return
      }
      var msg='Save QTY changes for '+esc(entry.customer)+'?\n\n'
      changes.forEach(function(c){
        var item=entry.items[c.idx]
        var itemName='IPHONE '+(item.name||'')+' '+(item.color||'')
        msg+='Row '+(c.idx+1)+' ('+itemName+'): '+c.old+' → '+c.new+'\n'
      })
      msg+='\nThese changes will reflect in Transaction History, Balance, WTS, WTB, and all other sections.'
      if(!confirm(msg))return
      var all=getPending()
      var pendingEntry=null
      for(var i=0;i<all.length;i++){if(all[i].id===entryId){pendingEntry=all[i];break}}
      if(!pendingEntry){showMsg('Entry not found','error');return}
      // Re-read allSavedTx fresh from DB
      try{allSavedTx=DB.getTransactions()}catch(e){}
      var totalMatched=0
      changes.forEach(function(c){
        var item=pendingEntry.items[c.idx]
        var delta=c.new-c.old
        item.qty=c.new
        var matchedCount=0
        var matchedTxs=[]
        try{
          var cn=(pendingEntry.customer||'').trim().toUpperCase()
          var mk=(pendingEntry.marks||'').trim().toUpperCase()
          var itemKey=(item.name||'').replace(/^iPhone\s*/i,'').trim()
          var colorKey=(item.color||'').trim()
          allSavedTx.forEach(function(t){
            if((t.customer_vendor||'').trim().toUpperCase()!==cn)return
            if(mk&&(t.marks||'').trim().toUpperCase()!==mk)return
            var itemHdr=((t.item_name||'')+' '+(t.storage||'')+' '+(t.specs||'')).trim().replace(/^iPhone\s*/i,'')
            if(itemHdr!==itemKey)return
            if((t.color||'').trim()!==colorKey)return
            matchedTxs.push(t)
          })
          if(matchedTxs.length>0){
            // Sort by id so the same transaction is always picked
            matchedTxs.sort(function(a,b){return String(a.id).localeCompare(String(b.id))})
            // Add delta to the first matching transaction only (keeps total correct)
            var firstTx=matchedTxs[0]
            var newQty=(parseInt(firstTx.quantity)||0)+delta
            if(newQty<0)newQty=0
            firstTx.quantity=newQty
            try{DB.updateById(firstTx.id,firstTx)}catch(e){console.warn('[WH QTY] updateById error:',e)}
            matchedCount=matchedTxs.length
            console.log('[WH QTY] Matched '+matchedTxs.length+' tx for '+item.name+'/'+item.color+', added delta='+delta+' to tx id='+firstTx.id+', new qty='+newQty)
          }
        }catch(e){console.warn('[WH QTY SAVE] Sync error:',e)}
        if(matchedCount===0){
          // Try submittedKeys approach as fallback
          try{
            var cn2=(pendingEntry.customer||'').trim().toUpperCase()
            var mk2=(pendingEntry.marks||'').trim()
            var matchedTxs2=[]
            if(pendingEntry.submittedKeys){
              var colorTrim=(item.color||'').trim()
              Object.keys(pendingEntry.submittedKeys).forEach(function(k){
                var parts=k.split('|')
                if(parts.length<6)return
                if(parts[0]!==cn2)return
                if(mk2&&parts[1]!==mk2)return
                if(parts[5]!==colorTrim)return
                var skItem=parts.slice(2,5).filter(function(s){return s}).join(' ').trim().replace(/^iPhone\s*/i,'')
                if(skItem!==itemKey)return
                allSavedTx.forEach(function(tx){
                  var txParts=[(tx.customer_vendor||'').trim().toUpperCase(),(tx.marks||'').trim(),tx.item_name||'',tx.storage||'',tx.specs||'',(tx.color||'').trim()]
                  var txKey=txParts.join('|')
                  if(txKey===k)matchedTxs2.push(tx)
                })
              })
            }
            if(matchedTxs2.length>0){
              matchedTxs2.sort(function(a,b){return String(a.id).localeCompare(String(b.id))})
              var firstTx2=matchedTxs2[0]
              var newQty2=(parseInt(firstTx2.quantity)||0)+delta
              if(newQty2<0)newQty2=0
              firstTx2.quantity=newQty2
              try{DB.updateById(firstTx2.id,firstTx2)}catch(e){console.warn('[WH QTY] Fallback updateById error:',e)}
              matchedCount=matchedTxs2.length
              console.log('[WH QTY] Fallback matched '+matchedTxs2.length+' tx, added delta to id='+firstTx2.id+', new qty='+newQty2)
            }
          }catch(e){console.warn('[WH QTY SAVE] Fallback error:',e)}
        }
        totalMatched+=matchedCount
      })
      savePending(all)
      try{DB.save()}catch(e){console.warn('[WH QTY SAVE] DB.save error:',e)}
      try{allSavedTx=DB.getTransactions()}catch(e){console.warn('[WH QTY SAVE] DB.getTransactions error:',e)}
      try{autoBackup()}catch(e){console.warn('[WH QTY SAVE] autoBackup not defined, skipping:',e.message)}
      // Verify data in localStorage
      try{
        var stored=JSON.parse(localStorage.getItem('stockLedgerDB')||'[]')
        var sampleMatch=stored.filter(function(t){
          return (t.customer_vendor||'').toUpperCase()===(pendingEntry.customer||'').toUpperCase() && (t.marks||'').toUpperCase()===(pendingEntry.marks||'').toUpperCase()
        })
        console.log('[WH QTY VERIFY] Stored transactions for this customer/marks:',sampleMatch.length)
        if(sampleMatch.length>0)console.log('[WH QTY VERIFY] Sample stored tx qty:',sampleMatch[0].quantity,'item:',sampleMatch[0].item_name,sampleMatch[0].storage,sampleMatch[0].specs,'color:',sampleMatch[0].color)
      }catch(e){console.warn('[WH QTY VERIFY] error:',e)}
      window._whEditing=false
      renderWarehouseView()
      try{window._raRender()}catch(e){console.warn('[WH] _raRender error:',e)}
      try{renderBalance()}catch(e){console.warn('[WH] renderBalance error:',e)}
      try{fetchHistory()}catch(e){console.warn('[WH] fetchHistory error:',e)}
      try{dcRenderLists()}catch(e){console.warn('[WH] dcRenderLists error:',e)}
      try{window.refreshApprovalView()}catch(e){console.warn('[WH] refreshApproval error:',e)}
      try{window.refreshPricingView()}catch(e){console.warn('[WH] refreshPricing error:',e)}
      try{refreshDOCustomers()}catch(e){console.warn('[WH] refreshDOCustomers error:',e)}
      try{refreshDOCustomerList()}catch(e){console.warn('[WH] refreshDOCustomerList error:',e)}
      if(typeof updateTabNotifs==='function')try{updateTabNotifs()}catch(e){}
      console.log('[WH QTY SAVE] Complete. Changes:',changes.length,'totalMatched:',totalMatched,'allSavedTx:',allSavedTx.length)
      if(totalMatched===0){
        showMsg('QTY saved in pricingPending but NO transactions matched in History','error')
      }else{
        showMsg('QTY updated! Matched '+totalMatched+' transaction'+(totalMatched!==1?'s':'')+' in History ('+changes.length+' change'+(changes.length!==1?'s':'')+')')
      }
    }

    document.addEventListener('click',function(e){
      var btn=e.target.closest('.wh-edit-btn,.wh-save-btn,.wh-cancel-btn')
      if(!btn)return
      var action=btn.getAttribute('data-action')
      if(action==='edit')onWHStartEdit()
      else if(action==='save')onWHSaveQty()
      else if(action==='cancel')onWHCancelEdit()
    })

    function renderWHTable(entry){
      if(!entry)return''
      var entryId=escAttr(entry.id)
      var tbl='<table class="wh-tbl" data-entry-id="'+entryId+'">'
      tbl+='<thead><tr><th style="width:40px">S-NO</th><th style="text-align:left">ITEM NAME</th><th style="width:80px">UNIT</th><th style="width:60px">TICK</th></tr></thead><tbody>'
      var rowIdx=0
      var grandTotal=0
      entry.items.forEach(function(item,ii){
        rowIdx++
        var qty=parseInt(item.qty)||0
        grandTotal+=qty
        var itemName='IPHONE '+esc(item.name)+' '+esc(item.color)+(item.specs?' '+esc(item.specs):'')
        tbl+='<tr data-idx="'+ii+'"><td style="text-align:center;font-weight:700">'+rowIdx+'</td><td class="item-name">'+itemName+'</td>'
        tbl+='<td style="text-align:center" class="wh-qty-cell" data-orig-qty="'+qty+'"><span class="wh-qty-text" data-idx="'+ii+'">'+qty+'</span><input type="number" min="0" step="1" class="wh-qty-input" data-idx="'+ii+'" value="'+qty+'" style="display:none;width:70px;padding:4px 6px;border:1px solid #1e3c72;border-radius:4px;font-size:12px;font-weight:700;text-align:center;color:#1e3c72;background:#fff0e6" onclick="this.select()"></td>'
        tbl+='<td style="text-align:center"><input type="checkbox" style="width:16px;height:16px;cursor:pointer"></td></tr>'
      })
      tbl+='</tbody>'
      tbl+='<tfoot><tr class="row-grand"><td colspan="2" style="text-align:right;font-size:12px;font-weight:800">Grand Total</td><td id="wh-grand-cell" style="font-size:13px;font-weight:900;color:#1e3c72">'+grandTotal+'</td><td></td></tr></tfoot>'
      tbl+='</table>'
      return tbl
    }

    window.whSelectCustomer=function(id){
      var all=getPending()
      var warehouseEntries=all.filter(function(e){return e.approved===true})
      var entries=warehouseView==='topack'?warehouseEntries.filter(function(e){return e.warehousePacked!==true}):warehouseEntries.filter(function(e){return e.warehousePacked===true})
      for(var i=0;i<entries.length;i++){
        if(entries[i].id===id){whSelectedEntry=entries[i];break}
      }
      renderWarehouseView()
    }

    window.whTogglePack=function(id){
      var all=getPending()
      var found=false
      var isPacking=false
      for(var i=0;i<all.length;i++){
        if(all[i].id===id){
          found=true
          if(all[i].warehousePacked===true){
            if(!confirm('Undo packed status? This will set transaction status back to "Order In Hand".'))return
            all[i].warehousePacked=false
            all[i].warehousePackedAt=undefined
            isPacking=false
            showMsg('Packed status undone')
          }else{
            if(!confirm('Mark as Packed? This will set transaction status to "Order Dispatched".'))return
            all[i].warehousePacked=true
            all[i].warehousePackedAt=Date.now()
            isPacking=true
            showMsg('Marked as Packed!')
          }
          // Sync transaction_status in Transaction History for matching transactions
          try{
            var entry=all[i]
            var cn=(entry.customer||'').trim().toUpperCase()
            var mk=(entry.marks||'').trim().toUpperCase()
            var newStatus=isPacking?'Order Dispatched':'Order In Hand'
            var matched=0
            // Re-read transactions fresh from DB
            var txs=(typeof DB!=='undefined'&&DB&&DB.getTransactions)?DB.getTransactions():(allSavedTx||[])
            txs.forEach(function(t){
              if((t.customer_vendor||'').trim().toUpperCase()!==cn)return
              if(mk&&(t.marks||'').trim().toUpperCase()!==mk)return
              // Only update transactions currently in "Order In Hand" (or empty) when packing
              if(isPacking){
                var cur=(t.transaction_status||'').trim()
                if(cur!=='Order In Hand'&&cur!=='')return
              }else{
                if((t.transaction_status||'').trim()!=='Order Dispatched')return
              }
              t.transaction_status=newStatus
              try{if(typeof DB!=='undefined'&&DB&&DB.updateById)DB.updateById(t.id,t)}catch(e){}
              matched++
            })
            try{if(typeof DB!=='undefined'&&DB&&DB.save)DB.save()}catch(e){}
            try{allSavedTx=(typeof DB!=='undefined'&&DB&&DB.getTransactions)?DB.getTransactions():(allSavedTx||[])}catch(e){}
            console.log('[WH PACK] Entry '+id+' packed='+isPacking+', updated '+matched+' transaction(s) to "'+newStatus+'"')
          }catch(e){console.warn('[WH PACK] Status sync error:',e)}
          break
        }
      }
      if(!found){showMsg('Entry not found','error');return}
      savePending(all)
      var view='topack'
      var entry=all.filter(function(e){return e.id===id})[0]
      if(entry&&entry.warehousePacked===true)view='packed'
      var confirmAll=getPending()
      var confirmEntry=confirmAll.filter(function(e){return e.id===id})[0]
      if(confirmEntry&&confirmEntry.warehousePacked===true)view='packed'
      whSelectedEntry=confirmEntry||null
      switchWarehouseView(view)
      try{autoBackup()}catch(e){console.warn('[WH PACK] autoBackup skipped:',e.message)}
      refreshAllSections()
      if(typeof updateTabNotifs==='function')updateTabNotifs()
    }

    window.printWH=function(){
      var cards=document.querySelectorAll('#panel-warehouse .wh-do-page')
      if(!cards.length){showMsg('No DO to print','error');return}
      var html=''
      cards.forEach(function(card){html+=card.outerHTML})
      var w=window.open('','_blank','width=800,height=600')
      w.document.write('<!DOCTYPE html><html><head><title>Warehouse DO</title><style>@page{size:A4;margin:15mm 12mm}')
      w.document.write('*{margin:0;padding:0;box-sizing:border-box}')
      w.document.write('body{font-family:Arial,Helvetica,sans-serif;font-size:11px;background:#fff;color:#000}')
      w.document.write('.wh-do-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #1e3c72}')
      w.document.write('.wh-do-header h3{margin:0;font-size:16px;font-weight:800;color:#1e3c72}')
      w.document.write('.wh-do-meta{display:flex;gap:24px;font-size:13px;font-weight:700;color:#1e3c72;margin-bottom:12px;padding:8px 12px;background:#f0f4ff;border-radius:6px;flex-wrap:wrap}')
      w.document.write('.wh-do-meta span{white-space:nowrap}')
      w.document.write('.wh-tbl{width:100%;border-collapse:collapse;font-size:10.5px}')
      w.document.write('.wh-tbl th,.wh-tbl td{border:1px solid #999;padding:4px 8px;text-align:center}')
      w.document.write('.wh-tbl th{background:#1e3c72;font-weight:700;font-size:10px;color:#fff}')
      w.document.write('.wh-tbl td.item-name{text-align:left;font-weight:600;font-size:10.5px}')
      w.document.write('.wh-tbl .row-grand td{background:#e8e8e8;font-weight:700;font-size:11px}')
      w.document.write('.wh-qty-input{display:none!important}')
      w.document.write('</style></head><body>'+html+'</body></html>')
      w.document.close()
      setTimeout(function(){w.focus();w.print()},300)
    }

    var origWhSwitch=window.switchTab
    window.switchTab=function(tab){
      if(origWhSwitch)origWhSwitch(tab)
      if(tab==='warehouse'){
        switchWarehouseView('topack')
      }
    }
    document.querySelectorAll('.tab-btn[data-tab="warehouse"]').forEach(function(btn){
      btn.addEventListener('click',function(){
        setTimeout(function(){switchWarehouseView('topack')},100)
      })
})

  // ===================== END WAREHOUSE MODULE =====================

  // ===================== END ACCOUNTING SALES MODULE =====================
  })();

  // ===================== INVOICE MODULE =====================
  ;(function(){
    var invSel=document.getElementById('invCustomer')
    if(!invSel)return

    function getPending(){try{return JSON.parse(localStorage.getItem('pricingPending'))||[]}catch(e){return []}}
    function clearInvoice(){
      var body=document.getElementById('inv-body')
      if(body)body.innerHTML='<tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>'
      document.getElementById('inv-subtotal').value=''
      document.getElementById('inv-vat').value=''
      document.getElementById('inv-totaldue').value=''
      document.getElementById('inv-totalqty').textContent='0'
      document.getElementById('inv-words').value=''
    }
    function populateInvCustomers(){
      var pending=getPending()
      var df=document.getElementById('invDateFrom')
      var dateVal=df&&df.value?df.value:''
      var customers=new Set()
      pending.forEach(function(e){
        if(e.completed && e.customer && (!dateVal || (e.date||'').slice(0,10)===dateVal))customers.add(e.customer)
      })
      var v=invSel.value
      invSel.innerHTML='<option value="">-- Select Customer --</option>'
      ;[...customers].sort().forEach(function(c){
        invSel.innerHTML+='<option value="'+esc(c)+'">'+esc(c)+'</option>'
      })
      if([...customers].indexOf(v)===-1){
        if([...customers].length===1)v=[...customers][0]
        else v=''
      }
      invSel.value=v
      if(!v)clearInvoice()
      refreshInvCustomerList()
    }

    function refreshInvCustomerList(){
      var container=document.getElementById('inv-customer-cards')
      if(!container)return
      var pending=getPending()
      var df=document.getElementById('invDateFrom')
      var dateVal=df&&df.value?df.value:''
      var customerMap={}
      pending.forEach(function(e){
        if(e.completed && e.customer && (!dateVal || (e.date||'').slice(0,10)===dateVal)){
          if(!customerMap[e.customer])customerMap[e.customer]={entries:[],totalUnits:0,grandTotal:0}
          customerMap[e.customer].entries.push(e)
          e.items.forEach(function(it){
            customerMap[e.customer].totalUnits+=(parseInt(it.qty)||0)
            customerMap[e.customer].grandTotal+=((parseFloat(it.unitPrice)||0)*(parseInt(it.qty)||0))
          })
        }
      })
      var arr=Object.keys(customerMap).sort()
      if(!arr.length){container.innerHTML='<div style="padding:20px;text-align:center;color:var(--badge-color);font-size:0.75rem">No pricing submitted yet.</div>';return}
      var html=''
      arr.forEach(function(c){
        var data=customerMap[c]
        var active=invSel.value&&invSel.value.toUpperCase()===c.toUpperCase()?' active':''
        html+='<div class="do-list-item'+active+'" onclick="selectInvCustomer(\''+escAttr(c)+'\')">'
        html+='<div class="do-cust-name">'+esc(c)+'</div>'
        html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px"><span class="do-cust-meta">'+data.entries.length+' DO · '+data.totalUnits+' units · $'+data.grandTotal.toFixed(2)+'</span></div>'
        html+='</div>'
      })
      container.innerHTML=html
    }

    window.selectInvCustomer=function(name){
      invSel.value=name
      onInvCustomerChange(name)
      refreshInvCustomerList()
    }

    window.onInvCustomerChange=function(customer){
      var sel=document.getElementById('invMarks')
      if(!sel)return
      sel.innerHTML='<option value="__ALL__">All Marks</option>'
      if(customer){
        var pending=getPending()
        var marks={}
        pending.filter(function(e){return e.completed && e.customer===customer}).forEach(function(e){
          if(e.marks)marks[e.marks]=true
        })
        Object.keys(marks).sort().forEach(function(m){
          sel.innerHTML+='<option value="'+escAttr(m)+'">'+esc(m)+'</option>'
        })
        generateInvoice()
      }
      refreshInvCustomerList()
    }

    window.generateInvoice=function(){
      var customer=invSel.value
      if(!customer){showMsg('Select a customer','error');return}
      var pending=getPending()
      var entries=pending.filter(function(e){return e.completed && e.customer===customer})
      if(!entries.length){showMsg('No completed pricing for this customer','error');return}
      // Filter by selected mark
      var markSel=document.getElementById('invMarks')
      var selectedMark=markSel?markSel.value:'__ALL__'
      if(selectedMark!=='__ALL__'){
        entries=entries.filter(function(e){return e.marks===selectedMark})
        if(!entries.length){showMsg('No entries for selected mark','error');return}
      }

      // Set date
      var d=new Date()
      document.getElementById('inv-date').value=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
      document.getElementById('inv-shipdate').value=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
      document.getElementById('inv-billto').value=customer
      document.getElementById('inv-shipto').value=lookupLogisticsByCustomer(customer)||customer
      // Set salesperson from matching entry
      var salesmenList=[]
      entries.forEach(function(en){if(en.salesman&&salesmenList.indexOf(en.salesman)<0)salesmenList.push(en.salesman)})
      var spEl=document.getElementById('inv-salesperson')
      if(spEl)spEl.value=salesmenList.length?salesmenList.join(', '):''

      // Collect all items from all entries for this customer
      var allItems=[]
      entries.forEach(function(entry){
        entry.items.forEach(function(item){
          allItems.push(item)
        })
      })

      // Render invoice table
      var body=document.getElementById('inv-body')
      var html='',serial=0,subtotal=0,totalQty=0
      var currencySel=document.getElementById('invCurrency')
      var currency=currencySel?currencySel.value:'USD'
      var rate=3.674
      var conv=currency==='AED'?rate:1
      // Update table header with currency
      var thCells=document.querySelectorAll('.items-table thead th')
      if(thCells.length>=5){thCells[4].textContent='UNIT PRICE ('+currency+')';thCells[5].textContent='TOTAL ('+currency+')'}
      allItems.forEach(function(item){
        serial++
        var qty=parseInt(item.qty)||0
        var price=parseFloat(item.unitPrice)||0
        var total=qty*price
        var priceConv=price*conv
        var totalConv=total*conv
        subtotal+=total
        totalQty+=qty
        var desc=item.name+(item.color?' '+item.color:'')
        html+='<tr>'
        html+='<td>'+serial+'</td>'
        html+='<td></td>'
        html+='<td class="desc">'+esc(desc)+'</td>'
        html+='<td class="qty">'+qty+'</td>'
        html+='<td class="amt">'+priceConv.toFixed(2)+'</td>'
        html+='<td class="amt">'+totalConv.toFixed(2)+'</td>'
        html+='</tr>'
      })
      body.innerHTML=html

      // Apply currency conversion to summary
      var withVat=document.getElementById('invVatToggle').value==='with'
      var vatRate=0.05
      var vat=withVat?subtotal*vatRate:0
      var totalDue=subtotal+vat
      var subtotalConv=subtotal*conv
      var vatConv=vat*conv
      var totalDueConv=totalDue*conv
      document.getElementById('invVatLabel').textContent='VAT '+(withVat?Math.round(vatRate*100)+'%':'0%')
      document.getElementById('inv-subtotal').value=subtotalConv.toFixed(2)
      document.getElementById('inv-vat').value=vatConv.toFixed(2)
      document.getElementById('inv-totaldue').value=totalDueConv.toFixed(2)
      document.getElementById('inv-totalqty').textContent=totalQty
      document.getElementById('inv-words').value=numberToWords(totalDueConv)+' ONLY'
      document.getElementById('invCurrencySymbol').textContent=currency
      document.getElementById('invTotalDueCurrency').textContent=currency
      showMsg('Invoice generated for '+customer)
    }

    function numberToWords(n){
      if(!n||isNaN(n))return 'Zero'
      var num=Math.floor(n)
      var a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      var b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      var units=['','Thousand','Million','Billion']
      function convertLessThanThousand(n){
        if(n===0)return ''
        var s=''
        if(n>=100){s+=a[Math.floor(n/100)]+' Hundred ';n%=100}
        if(n>=20){s+=b[Math.floor(n/10)]+' ';n%=10}
        if(n>0)s+=a[n]+' '
        return s
      }
      if(num===0)return 'Zero'
      var result='',unitIndex=0
      while(num>0){
        var chunk=num%1000
        if(chunk>0){
          var chunkStr=convertLessThanThousand(chunk)
          result=chunkStr+(units[unitIndex]?units[unitIndex]+' ':'')+result
        }
        num=Math.floor(num/1000)
        unitIndex++
      }
      var dec=Math.round((n-Math.floor(n))*100)
      if(dec>0)result+='and '+dec+'/100 '
      return result.trim()
    }

    window.printInvoice=function(){
      var page=document.getElementById('inv-page')
      if(!page)return
      // Set input values as text for printing
      page.querySelectorAll('input').forEach(function(el){
        el.setAttribute('value',el.value)
      })
      // Mark invoiced
      try{
        var all=getPending()
        var customer=document.getElementById('inv-customer')?document.getElementById('inv-customer').value:''
        if(customer){
          all.forEach(function(e){if(e.customer===customer)e.invoiced=true})
          savePending(all)
        }
      }catch(e){}
      var w=window.open('','_blank','width=800,height=600')
      w.document.write('<!DOCTYPE html><html><head><title>Tax Invoice</title>')
      w.document.write('<style>@page{size:A4;margin:0}body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;background:#fff}.inv-page *{margin:0;padding:0;box-sizing:border-box}.inv-page{width:210mm;padding:5mm 10mm;box-sizing:border-box;line-height:1.4}.inv-page .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.inv-page .logo-block{display:flex;flex-direction:column}.inv-page .logo-svg-row{display:flex;align-items:center;gap:6px}.inv-page .logo-text-main{font-size:28px;font-weight:900;color:#1a3c6e;letter-spacing:-1px;line-height:1;font-style:italic}.inv-page .logo-text-sub{font-size:11px;font-weight:bold;color:#1a3c6e;letter-spacing:2px;margin-top:2px}.inv-page .invoice-title-block{text-align:right}.inv-page .invoice-title-block h1{font-size:22px;font-weight:900;color:#1a3c6e;letter-spacing:1px;margin-bottom:6px}.inv-page .inv-meta-table{border-collapse:collapse;margin-left:auto}.inv-page .inv-meta-table td{border:1px solid #1a3c6e;padding:4px 10px;font-size:11px}.inv-page .inv-meta-table td.lbl{font-weight:bold;color:#1a3c6e;background:#f0f3fa;min-width:90px}.inv-page .inv-meta-table td.val input{border:none;background:transparent;font-size:11px;font-weight:bold;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .address-section{margin-bottom:8px}.inv-page .company-addr{font-size:10.5px;line-height:1.65;color:#111;margin-bottom:8px}.inv-page .company-addr strong{font-size:12px}.inv-page .company-addr .trn{font-weight:bold}.inv-page .bill-ship-row{display:flex;gap:0;border:1px solid #1a3c6e}.inv-page .bill-block{width:50%;padding:0;border-right:1px solid #1a3c6e}.inv-page .ship-block{width:50%;padding:0}.inv-page .bs-label{background:#1a3c6e;color:#fff;font-weight:bold;font-size:10px;padding:3px 8px;letter-spacing:0.5px}.inv-page .bs-name{font-size:14px;font-weight:900;padding:5px 8px 2px;color:#000}.inv-page .bs-name input{border:none;background:transparent;font-size:14px;font-weight:900;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .bs-sub{font-size:10px;padding:0 8px 5px;color:#333}.inv-page .sales-table{width:100%;border-collapse:collapse;margin-top:12px}.inv-page .sales-table th{background:#1a3c6e;color:#fff;font-size:10px;font-weight:bold;padding:5px 8px;border:1px solid #1a3c6e;text-align:center;letter-spacing:0.5px}.inv-page .sales-table td{border:1px solid #c0c8d8;padding:5px 8px;font-size:11px;text-align:center}.inv-page .sales-table td input{border:none;background:transparent;font-size:11px;text-align:center;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .items-table{width:100%;border-collapse:collapse;margin-top:10px}.inv-page .items-table thead tr{background:#1a3c6e;color:#fff}.inv-page .items-table thead th{padding:6px 8px;font-size:10px;font-weight:bold;border:1px solid #1a3c6e;text-align:center;letter-spacing:0.5px}.inv-page .items-table thead th.desc{text-align:left}.inv-page .items-table tbody tr{border-bottom:1px solid #dde2ee}.inv-page .items-table tbody tr:nth-child(odd){background:#fff}.inv-page .items-table tbody tr:nth-child(even){background:#f5f7fc}.inv-page .items-table tbody td{padding:5px 8px;border:1px solid #dde2ee;font-size:10.5px;vertical-align:middle}.inv-page .items-table tbody td.center{text-align:center}.inv-page .items-table tbody td.right{text-align:right}.inv-page .items-table tbody td.bold-right{text-align:right;font-weight:bold}.inv-page .items-table tbody tr.empty-row td{height:22px}.inv-page .bottom-area{display:flex;gap:0;border:1px solid #c0c8d8;border-top:none}.inv-page .bottom-left{width:60%;border-right:1px solid #c0c8d8;padding:8px 10px;box-sizing:border-box}.inv-page .in-words-line{font-size:10px;font-weight:bold;color:#000;margin-bottom:8px;line-height:1.5}.inv-page .in-words-line input{border:none;background:transparent;font-size:10px;font-weight:bold;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .terms-list{padding:0;list-style:none;margin:0}.inv-page .terms-list li{font-size:9px;color:#333;margin-bottom:2px;line-height:1.45}.inv-page .comments-title{font-weight:bold;font-size:10px;margin:7px 0 3px}.inv-page .comments-val{font-size:10px;color:#333;margin-bottom:7px}.inv-page .bank-table{width:100%;border-collapse:collapse;margin-top:4px}.inv-page .bank-table td{border:1px solid #c0c8d8;padding:3px 7px;font-size:10px}.inv-page .bank-table td:first-child{font-weight:bold;color:#333;width:115px}.inv-page .signatory-line{font-size:11px;font-weight:bold;color:#1a3c6e;text-align:right;margin-top:10px;padding-right:4px}.inv-page .bottom-right{width:40%;padding:8px 10px;display:flex;flex-direction:column;justify-content:flex-start;box-sizing:border-box}.inv-page .total-row{display:flex;justify-content:space-between;padding:5px 4px;border-bottom:1px solid #dde2ee;font-size:11px}.inv-page .total-row .lbl{color:#333}.inv-page .total-row .amt{font-weight:bold}.inv-page .total-row .amt input{border:none;background:transparent;font-size:11px;font-weight:bold;text-align:right;outline:none;color:#000;width:100px;font-family:Arial,sans-serif}.inv-page .total-due-bar{background:#1a3c6e;color:#fff;display:flex;justify-content:space-between;padding:8px 6px;font-size:13px;font-weight:bold;margin-top:6px}.inv-page .total-due-bar span:last-child input{background:transparent;color:#fff;font-size:13px;font-weight:bold;text-align:right;border:none;outline:none;width:100px;font-family:Arial,sans-serif}.inv-page .warranty-section{border:1px solid #c0c8d8;border-top:none;padding:8px 10px}.inv-page .warranty-title{font-weight:bold;font-size:10.5px;color:#000;margin-bottom:4px}.inv-page .warranty-text{font-size:9px;color:#333;line-height:1.55}.inv-page .thankyou{text-align:center;margin-top:12px;font-size:15px;font-weight:bold;font-style:italic;color:#1a3c6e}.inv-page .generated{text-align:center;font-size:9px;color:#777;font-style:italic;margin-top:2px}input{border:none;background:transparent;font-family:Arial,sans-serif;color:#000}.no-print{display:none!important}</style></head><body>')
      w.document.write(page.outerHTML)
      w.document.write('</body></html>')
      w.document.close()
      setTimeout(function(){w.focus();w.print()},500)
      if(typeof updateTabNotifs==='function')updateTabNotifs()
    }

    window.saveInvoicePDF=function(){
      var page=document.getElementById('inv-page')
      if(!page)return showMsg('Generate invoice first','error')
      if(typeof html2canvas==='undefined')return showMsg('html2canvas not loaded','error')
      // Mark invoiced
      try{
        var all=getPending()
        var customer=document.getElementById('inv-customer')?document.getElementById('inv-customer').value:''
        if(customer){
          all.forEach(function(e){if(e.customer===customer)e.invoiced=true})
          savePending(all)
          if(typeof updateTabNotifs==='function')updateTabNotifs()
        }
      }catch(e){}
      // Clone and prepare for PDF
      var clone=page.cloneNode(true)
      clone.querySelectorAll('input').forEach(function(el){
        el.setAttribute('value',el.value)
      })
      // Set print styles on clone
      clone.style.cssText='width:210mm;padding:5mm 10mm;background:#fff;font-family:Calibri,Arial,sans-serif;font-size:11px;color:#000;box-sizing:border-box;font-weight:700'
      // inject CSS for clone
      var style=document.createElement('style')
      style.textContent='.inv-page *{margin:0;padding:0;box-sizing:border-box}.inv-page{width:210mm;padding:5mm 10mm;box-sizing:border-box;line-height:1.4;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;background:#fff}.inv-page .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.inv-page .logo-block{display:flex;flex-direction:column}.inv-page .logo-svg-row{display:flex;align-items:center;gap:6px}.inv-page .logo-text-main{font-size:28px;font-weight:900;color:#1a3c6e;letter-spacing:-1px;line-height:1;font-style:italic}.inv-page .logo-text-sub{font-size:11px;font-weight:bold;color:#1a3c6e;letter-spacing:2px;margin-top:2px}.inv-page .invoice-title-block{text-align:right}.inv-page .invoice-title-block h1{font-size:22px;font-weight:900;color:#1a3c6e;letter-spacing:1px;margin-bottom:6px}.inv-page .inv-meta-table{border-collapse:collapse;margin-left:auto}.inv-page .inv-meta-table td{border:1px solid #1a3c6e;padding:4px 10px;font-size:11px}.inv-page .inv-meta-table td.lbl{font-weight:bold;color:#1a3c6e;background:#f0f3fa;min-width:90px}.inv-page .inv-meta-table td.val input{border:none;background:transparent;font-size:11px;font-weight:bold;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .address-section{margin-bottom:8px}.inv-page .company-addr{font-size:10.5px;line-height:1.65;color:#111;margin-bottom:8px}.inv-page .company-addr strong{font-size:12px}.inv-page .company-addr .trn{font-weight:bold}.inv-page .bill-ship-row{display:flex;gap:0;border:1px solid #1a3c6e}.inv-page .bill-block{width:50%;padding:0;border-right:1px solid #1a3c6e}.inv-page .ship-block{width:50%;padding:0}.inv-page .bs-label{background:#1a3c6e;color:#fff;font-weight:bold;font-size:10px;padding:3px 8px;letter-spacing:0.5px}.inv-page .bs-name{font-size:14px;font-weight:900;padding:5px 8px 2px;color:#000}.inv-page .bs-name input{border:none;background:transparent;font-size:14px;font-weight:900;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .bs-sub{font-size:10px;padding:0 8px 5px;color:#333}.inv-page .sales-table{width:100%;border-collapse:collapse;margin-top:12px}.inv-page .sales-table th{background:#1a3c6e;color:#fff;font-size:10px;font-weight:bold;padding:5px 8px;border:1px solid #1a3c6e;text-align:center;letter-spacing:0.5px}.inv-page .sales-table td{border:1px solid #c0c8d8;padding:5px 8px;font-size:11px;text-align:center}.inv-page .sales-table td input{border:none;background:transparent;font-size:11px;text-align:center;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .items-table{width:100%;border-collapse:collapse;margin-top:10px}.inv-page .items-table thead tr{background:#1a3c6e;color:#fff}.inv-page .items-table thead th{padding:6px 8px;font-size:10px;font-weight:bold;border:1px solid #1a3c6e;text-align:center;letter-spacing:0.5px}.inv-page .items-table thead th.desc{text-align:left}.inv-page .items-table tbody tr{border-bottom:1px solid #dde2ee}.inv-page .items-table tbody tr:nth-child(odd){background:#fff}.inv-page .items-table tbody tr:nth-child(even){background:#f5f7fc}.inv-page .items-table tbody td{padding:5px 8px;border:1px solid #dde2ee;font-size:10.5px;vertical-align:middle}.inv-page .items-table tbody td.center{text-align:center}.inv-page .items-table tbody td.right{text-align:right}.inv-page .items-table tbody td.bold-right{text-align:right;font-weight:bold}.inv-page .items-table tbody tr.empty-row td{height:22px}.inv-page .bottom-area{display:flex;gap:0;border:1px solid #c0c8d8;border-top:none}.inv-page .bottom-left{width:60%;border-right:1px solid #c0c8d8;padding:8px 10px;box-sizing:border-box}.inv-page .in-words-line{font-size:10px;font-weight:bold;color:#000;margin-bottom:8px;line-height:1.5}.inv-page .in-words-line input{border:none;background:transparent;font-size:10px;font-weight:bold;outline:none;color:#000;width:100%;font-family:Arial,sans-serif}.inv-page .terms-list{padding:0;list-style:none;margin:0}.inv-page .terms-list li{font-size:9px;color:#333;margin-bottom:2px;line-height:1.45}.inv-page .comments-title{font-weight:bold;font-size:10px;margin:7px 0 3px}.inv-page .comments-val{font-size:10px;color:#333;margin-bottom:7px}.inv-page .bank-table{width:100%;border-collapse:collapse;margin-top:4px}.inv-page .bank-table td{border:1px solid #c0c8d8;padding:3px 7px;font-size:10px}.inv-page .bank-table td:first-child{font-weight:bold;color:#333;width:115px}.inv-page .signatory-line{font-size:11px;font-weight:bold;color:#1a3c6e;text-align:right;margin-top:10px;padding-right:4px}.inv-page .bottom-right{width:40%;padding:8px 10px;display:flex;flex-direction:column;justify-content:flex-start;box-sizing:border-box}.inv-page .total-row{display:flex;justify-content:space-between;padding:5px 4px;border-bottom:1px solid #dde2ee;font-size:11px}.inv-page .total-row .lbl{color:#333}.inv-page .total-row .amt{font-weight:bold}.inv-page .total-row .amt input{border:none;background:transparent;font-size:11px;font-weight:bold;text-align:right;outline:none;color:#000;width:100px;font-family:Arial,sans-serif}.inv-page .total-due-bar{background:#1a3c6e;color:#fff;display:flex;justify-content:space-between;padding:8px 6px;font-size:13px;font-weight:bold;margin-top:6px}.inv-page .total-due-bar span:last-child input{background:transparent;color:#fff;font-size:13px;font-weight:bold;text-align:right;border:none;outline:none;width:100px;font-family:Arial,sans-serif}.inv-page .warranty-section{border:1px solid #c0c8d8;border-top:none;padding:8px 10px}.inv-page .warranty-title{font-weight:bold;font-size:10.5px;color:#000;margin-bottom:4px}.inv-page .warranty-text{font-size:9px;color:#333;line-height:1.55}.inv-page .thankyou{text-align:center;margin-top:12px;font-size:15px;font-weight:bold;font-style:italic;color:#1a3c6e}.inv-page .generated{text-align:center;font-size:9px;color:#777;font-style:italic;margin-top:2px}input{border:none;background:transparent;font-family:Arial,sans-serif;color:#000}.no-print{display:none!important}'
      clone.insertBefore(style,clone.firstChild)
      document.body.appendChild(clone)
      html2canvas(clone,{scale:2,width:794,windowWidth:794}).then(function(canvas){
        var pdf=new jspdf.jsPDF('p','mm','a4')
        var w=190
        var h=canvas.height*w/canvas.width
        pdf.addImage(canvas.toDataURL('image/png'),'PNG',10,10,w,h)
        pdf.save('Invoice_'+document.getElementById('inv-no').value+'_'+new Date().toISOString().slice(0,10)+'.pdf')
        document.body.removeChild(clone)
        showMsg('Invoice PDF saved!')
      }).catch(function(){
        document.body.removeChild(clone)
        showMsg('PDF generation failed','error')
      })
    }

    // Hook into tab switch
    var origInvSwitch=window.switchTab
    window.switchTab=function(tab){
      if(origInvSwitch)origInvSwitch(tab)
      if(tab==='invoice'){
        populateInvCustomers()
        refreshInvCustomerList()
        if(typeof refreshCompanyLogos==='function')refreshCompanyLogos()
      }
    }
    document.querySelectorAll('.tab-btn[data-tab="invoice"]').forEach(function(btn){
      btn.addEventListener('click',function(){
        setTimeout(populateInvCustomers,100)
      })
    })
  })()
  // ===================== END INVOICE MODULE =====================
  // Logo upload & display
  try{
    window.refreshCompanyLogos=function(){
      try{
        var src=localStorage.getItem('companyLogo')
        document.querySelectorAll('.company-logo-container').forEach(function(c){
          if(src){
            var img=c.querySelector('.company-logo-img')
            if(!img){img=document.createElement('img');img.className='company-logo-img';c.innerHTML='';c.appendChild(img)}
            img.src=src
          }else{
            var img=c.querySelector('.company-logo-img')
            if(img){var txt=c.getAttribute('data-fallback');if(txt)c.innerHTML=txt}
          }
        })
      }catch(e){}
    }
    document.querySelectorAll('.company-logo-container').forEach(function(c){if(!c.getAttribute('data-fallback'))c.setAttribute('data-fallback',c.innerHTML)})
    document.getElementById('logoFileInput').addEventListener('change',function(){
      var file=this.files[0]
      if(!file)return
      var reader=new FileReader()
      reader.onload=function(){
        try{
          localStorage.setItem('companyLogo',reader.result)
          window.refreshCompanyLogos()
        }catch(e){}
      }
      reader.readAsDataURL(file)
      this.value=''
    })
    window.refreshCompanyLogos()
    // Auto-refresh all sections every 3 seconds
    setInterval(function(){try{refreshAllSections()}catch(e){}},300000)
    // Refresh all sections after any button click (skip warehouse edit buttons)
    document.addEventListener('click',function(e){
      var btn=e.target.closest('button')
      if(!btn)return
      if(btn.classList.contains('wh-edit-btn')||btn.classList.contains('wh-save-btn')||btn.classList.contains('wh-cancel-btn')||btn.classList.contains('wh-qty-input'))return
      setTimeout(function(){try{refreshAllSections()}catch(e){}},50)
    })
  }catch(e){}
  // Initial tab notification update
  if(typeof updateTabNotifs==='function')try{updateTabNotifs()}catch(e){};
(function(){
  var bgBtn=document.getElementById('bgUploadBtn')
  var bgPanel=document.getElementById('bgPanel')
  var bgFile=document.getElementById('bgFileInput2')
  var bgClear=document.getElementById('bgClearBtn')
  var bgOpacitySlider=document.getElementById('bgOpacitySlider')
  var bgBlurSlider=document.getElementById('bgBlurSlider')
  var cardOpacitySlider=document.getElementById('cardOpacitySlider')
  var bgOpacityVal=document.getElementById('bgOpacityVal')
  var bgBlurVal=document.getElementById('bgBlurVal')
  var cardOpacityVal=document.getElementById('cardOpacityVal')
  function applyBgImage(src){
    if(src){
      document.documentElement.style.setProperty('--bg-overlay-img','url('+src+')')
      if(bgClear)bgClear.style.display='block'
      try{localStorage.setItem('bgImage',src)}catch(e){}
    }else{
      document.documentElement.style.setProperty('--bg-overlay-img','none')
      if(bgClear)bgClear.style.display='none'
      try{localStorage.removeItem('bgImage')}catch(e){}
    }
  }
  function applyBgOpacity(val){
    document.documentElement.style.setProperty('--bg-overlay-opacity',val)
    if(bgOpacityVal)bgOpacityVal.textContent=parseFloat(val).toFixed(2)
    try{localStorage.setItem('bgOpacity',val)}catch(e){}
  }
  function applyBlur(val){
    document.documentElement.style.setProperty('--bg-blur-px',val+'px')
    if(bgBlurVal)bgBlurVal.textContent=val+'px'
    try{localStorage.setItem('bgBlur',val)}catch(e){}
  }
  function applyCardOpacity(val){
    document.documentElement.style.setProperty('--card-opacity-val',val)
    if(cardOpacityVal)cardOpacityVal.textContent=parseFloat(val).toFixed(2)
    try{localStorage.setItem('cardOpacity',val)}catch(e){}
  }
  try{var savedBg=localStorage.getItem('bgImage');if(savedBg)applyBgImage(savedBg)}catch(e){}
  try{var savedOp=localStorage.getItem('bgOpacity');if(savedOp&&bgOpacitySlider){bgOpacitySlider.value=savedOp;applyBgOpacity(savedOp)}}catch(e){}
  try{var savedBl=localStorage.getItem('bgBlur');if(savedBl&&bgBlurSlider){bgBlurSlider.value=savedBl;applyBlur(savedBl)}}catch(e){}
  try{var savedCo=localStorage.getItem('cardOpacity');if(savedCo&&cardOpacitySlider){cardOpacitySlider.value=savedCo;applyCardOpacity(savedCo)}}catch(e){}
  if(bgBtn){
    bgBtn.addEventListener('click',function(e){
      e.stopPropagation()
      if(bgPanel.style.display==='block'){bgPanel.style.display='none';return}
      var rect=bgBtn.getBoundingClientRect()
      bgPanel.style.left=Math.max(8,Math.min(window.innerWidth-288,rect.left+rect.width/2-140))+'px'
      bgPanel.style.top=(rect.bottom+8)+'px'
      bgPanel.style.display='block'
    })
  }
  document.addEventListener('click',function(e){
    if(bgPanel.style.display!=='block')return
    if(!bgPanel.contains(e.target)&&e.target!==bgBtn&&!e.target.closest('#sBgSettings')){
      setTimeout(function(){bgPanel.style.display='none'},0)
    }
  })
  bgFile.addEventListener('change',function(){
    var file=this.files[0]
    if(!file)return
    var reader=new FileReader()
    reader.onload=function(e){applyBgImage(e.target.result)}
    reader.readAsDataURL(file)
    this.value=''
  })
  bgClear.addEventListener('click',function(){applyBgImage(null)})
  bgOpacitySlider.addEventListener('input',function(){applyBgOpacity(this.value)})
  bgBlurSlider.addEventListener('input',function(){applyBlur(this.value)})
  cardOpacitySlider.addEventListener('input',function(){applyCardOpacity(this.value)})
})()
// ===================== LOGIN SYSTEM =====================
;(function(){
  var USERS_KEY='loginUsers'
  var ROLE_KEY='currentUser'
  function getUsers(){
    try{return JSON.parse(localStorage.getItem(USERS_KEY))||{}}catch(e){return {}}
  }
  function saveUsers(u){try{localStorage.setItem(USERS_KEY,JSON.stringify(u))}catch(e){}}
  var defaultUsers={
    supernova:{password:'admin123',role:'admin',name:'Supernova Admin'}
  }
  var users=getUsers()
  // Ensure all default users exist with correct role
  for(var dk in defaultUsers){
    if(!users[dk])users[dk]=defaultUsers[dk]
    else if(!users[dk].role)users[dk].role=defaultUsers[dk].role
  }
  saveUsers(users)
  var currentUser=null
  // Tab-role mapping (legacy)
  var tabRoles={
    entry:['data'],balance:['balance','bpc','data'],delivery:['data'],customs:['customs','bpc','data'],datacontrol:['data'],
    invoice:['invoice_reports','invoice'],reports:['invoice_reports'],
    pricing:['pricing','bpc'],approval:['approval'],warehouse:['warehouse'],history:['admin','data']
  }
  var tabLabels={
    entry:'Entry',balance:'Balance Stock',delivery:'Delivery',
    customs:'Customs',datacontrol:'Data Control',
    invoice:'Invoice',reports:'Reports',
    pricing:'Pricing',approval:'Approval',
    warehouse:'Warehouse',history:'History'
  }
  function canAccess(tab){
    if(!currentUser)return false
    var users=getUsers()
    var u=users[currentUser.username]
    if(!u)return false
    if(u.role==='admin')return true
    if(u.tabs&&Array.isArray(u.tabs))return u.tabs.indexOf(tab)>=0
    var role=currentUser.role
    if(!role)return false
    var allowed=tabRoles[tab]
    if(!allowed)return false
    return allowed.indexOf(role)>=0
  }
  function applyAccess(){
    if(!currentUser){
      document.querySelectorAll('.tab-btn').forEach(function(b){b.style.display=''})
      document.querySelectorAll('.panel').forEach(function(p){p.style.display=''})
      return
    }
    document.querySelectorAll('.tab-btn').forEach(function(btn){
      var tab=btn.getAttribute('data-tab')
      if(canAccess(tab)){btn.style.display=''}else{btn.style.display='none'}
    })
    document.querySelectorAll('.panel').forEach(function(p){
      var tab=p.id?p.id.replace('panel-',''):''
      if(tab){if(canAccess(tab))p.style.display='';else p.style.display='none'}
    })
    var activeTab=document.querySelector('.tab-btn.active')
    if(activeTab&&activeTab.style.display==='none'){
      var firstVis=document.querySelector('.tab-btn:not([style*="display:none"])')
      if(firstVis&&typeof switchTab==='function')switchTab(firstVis.getAttribute('data-tab'))
    }
  }
  function showLogin(){document.getElementById('loginOverlay').classList.remove('hidden')}
  function hideLogin(){document.getElementById('loginOverlay').classList.add('hidden')}
  function updateUI(){
    if(currentUser){
      document.getElementById('userNameDisplay').textContent=currentUser.name||currentUser.username
      document.getElementById('userRoleDisplay').textContent=currentUser.role||(currentUser.tabs?'Custom':'')
      document.getElementById('changePwdLink').style.display=''
      var cul=document.getElementById('changeUserLink');if(cul)cul.style.display=''
      document.getElementById('adminUserMgmtLink').style.display=currentUser.role==='admin'?'':'none'
      hideLogin()
    }else{
      document.getElementById('userNameDisplay').textContent='Not logged in'
      document.getElementById('userRoleDisplay').textContent=''
      document.getElementById('changePwdLink').style.display='none'
      var cul2=document.getElementById('changeUserLink');if(cul2)cul2.style.display='none'
      document.getElementById('adminUserMgmtLink').style.display='none'
    }
    applyAccess()
  }
  window.loginAs=function(username){
    var users=getUsers()
    if(!users[username])return false
    currentUser={username:username,role:users[username].role,name:users[username].name||username}
    updateUI()
    return true
  }
  window.logout=function(){currentUser=null;updateUI();showLogin();var lp=document.getElementById('loginPass');if(lp)lp.value='';var lu=document.getElementById('loginUser');if(lu)lu.value='';var le=document.getElementById('loginError');if(le)le.textContent='';try{localStorage.removeItem('rememberedUser')}catch(e){}}
  // Helper to bind safely
  function onId(id,ev,fn){var el=document.getElementById(id);if(el)el.addEventListener(ev,fn);else console.warn('Login: element #'+id+' not found')}
  // Ensure supernova exists
  (function(){var u=getUsers();if(!u.supernova){u.supernova={password:'admin123',role:'admin',name:'Supernova Admin'};saveUsers(u)}})()
  window.loginRefreshDropdown=function(){}
  function toggleShowPass(){
    var inp=document.getElementById('loginPass')
    var eye=document.getElementById('passEye')
    if(!inp||!eye)return
    if(inp.type==='password'){
      inp.type='text'
      eye.innerHTML='<path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2" fill="none"/>'
    }else{
      inp.type='password'
      eye.innerHTML='<path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>'
    }
  }
  // Auto-login if remembered
  (function initRemembered(){
    try{
      var r=localStorage.getItem('rememberedUser')
      if(!r)return
      var u=JSON.parse(r)
      if(!u||!u.username)return
      var users=getUsers()
      if(!users[u.username])return
      currentUser={username:u.username,role:u.role,name:u.name||u.username}
      var rm=document.getElementById('rememberMe')
      if(rm)rm.checked=true
      updateUI()
    }catch(e){}
    // Retry if DOM not ready
    if(!document.getElementById('rememberMe'))setTimeout(initRemembered,100)
  })()
  document.addEventListener('DOMContentLoaded',function(){
  ;(function(){
    var c=document.getElementById('stars')
    if(!c)return
    for(var i=0;i<100;i++){
      var e=document.createElement('div')
      e.className='star'
      e.style.left=Math.random()*100+'%'
      e.style.top=Math.random()*60+'%'
      var s=Math.random()*2.5+1
      e.style.width=s+'px'
      e.style.height=s+'px'
      e.style.setProperty('--o',Math.random()*0.8+0.2)
      e.style.setProperty('--d',Math.random()*3+2+'s')
      c.appendChild(e)
    }
    for(var i=0;i<10;i++){
      var e=document.createElement('div')
      e.className='star-cross'
      e.textContent='✧'
      e.style.left=Math.random()*100+'%'
      e.style.top=Math.random()*50+'%'
      e.style.setProperty('--s',Math.random()*12+8+'px')
      e.style.setProperty('--o',Math.random()*0.5+0.3)
      e.style.setProperty('--d',Math.random()*4+3+'s')
      c.appendChild(e)
    }
  })()
  onId('loginBtn','click',function(){
    var user=document.getElementById('loginUser').value.trim().toLowerCase()
    var pass=document.getElementById('loginPass').value
    var el=document.getElementById('loginError')
    if(!user||!pass){if(el)el.textContent='Enter username and password';return}
    var users=getUsers()
    if(!users[user]){if(el)el.textContent='User not found';return}
    if(users[user].password!==pass){if(el)el.textContent='Wrong password';return}
    if(el)el.textContent=''
    currentUser={username:user,role:users[user].role,name:users[user].name||user}
    updateUI()
    if(document.getElementById('rememberMe').checked){
      try{localStorage.setItem('rememberedUser',JSON.stringify({username:user,role:users[user].role,name:users[user].name||user}))}catch(e){}
    }
  })
  onId('loginPass','keydown',function(e){if(e.key==='Enter'){var btn=document.getElementById('loginBtn');if(btn)btn.click()}})
  onId('loginUser','input',function(){var lp=document.getElementById('loginPass');if(lp)lp.value=''})
  onId('logoutLink','click',function(){window.logout()})
  onId('changePwdLink','click',function(){
    var t=document.getElementById('changePwdTitle');if(t)t.textContent='Change Password'
    var f=document.getElementById('changePwdFields');if(f)f.style.display=''
    var c1=document.getElementById('cpCurrent');if(c1)c1.value=''
    var c2=document.getElementById('cpNew');if(c2)c2.value=''
    var c3=document.getElementById('cpConfirm');if(c3)c3.value=''
    var e=document.getElementById('cpError');if(e)e.textContent=''
    var m=document.getElementById('changePwdModal');if(m)m.style.display='flex'
  })
  onId('cpCancelBtn','click',function(){var m=document.getElementById('changePwdModal');if(m)m.style.display='none'})
  onId('cpSaveBtn','click',function(){
    var cur=(document.getElementById('cpCurrent')||{}).value||''
    var nw=(document.getElementById('cpNew')||{}).value||''
    var cf=(document.getElementById('cpConfirm')||{}).value||''
    var el=document.getElementById('cpError')
    if(!cur||!nw||!cf){if(el)el.textContent='Fill all fields';return}
    if(nw!==cf){if(el)el.textContent='New passwords do not match';return}
    if(nw.length<4){if(el)el.textContent='Password must be at least 4 chars';return}
    var users=getUsers()
    if(!currentUser||!users[currentUser.username]){if(el)el.textContent='Not logged in';return}
    if(users[currentUser.username].password!==cur){if(el)el.textContent='Current password is wrong';return}
    users[currentUser.username].password=nw
    saveUsers(users)
    if(el)el.textContent=''
    var m=document.getElementById('changePwdModal');if(m)m.style.display='none'
    alert('Password changed successfully')
  })
  // Forgot Password (Email-based, 2-step)
  onId('forgotPwdLink','click',function(){
    var fu=document.getElementById('fpUser');if(fu)fu.value=''
    var fem=document.getElementById('fpEmail');if(fem)fem.value=''
    var fe=document.getElementById('fpError');if(fe)fe.textContent=''
    var s1=document.getElementById('fpStep1');if(s1)s1.style.display=''
    var s2=document.getElementById('fpStep2');if(s2)s2.style.display='none'
    var fm=document.getElementById('forgotPwdModal');if(fm)fm.style.display='flex'
  })
  onId('fpCancelBtn','click',function(){var m=document.getElementById('forgotPwdModal');if(m)m.style.display='none'})
  onId('fpVerifyBtn','click',function(){
    var un=(document.getElementById('fpUser')||{}).value||''
    var em=(document.getElementById('fpEmail')||{}).value||''
    un=un.trim().toLowerCase()
    em=em.trim().toLowerCase()
    var el=document.getElementById('fpError')
    if(!un){if(el)el.textContent='Enter your username';return}
    if(!em){if(el)el.textContent='Enter your email';return}
    var users=getUsers()
    if(!users[un]){if(el)el.textContent='User not found';return}
    var storedEmail=(users[un].email||'').toLowerCase().trim()
    if(!storedEmail){if(el)el.textContent='No email is set for this user. Please contact admin to reset password.';return}
    if(storedEmail!==em){if(el)el.textContent='Email does not match our records';return}
    window._fpVerifiedUser=un
    if(el)el.textContent=''
    var succ=document.getElementById('fpSuccess');if(succ)succ.textContent='✓ Verified! Set your new password below.'
    var np=document.getElementById('fpNewPass');if(np)np.value=''
    var cp=document.getElementById('fpConfirmPass');if(cp)cp.value=''
    var e2=document.getElementById('fpError2');if(e2)e2.textContent=''
    var s1=document.getElementById('fpStep1');if(s1)s1.style.display='none'
    var s2=document.getElementById('fpStep2');if(s2)s2.style.display=''
  })
  onId('fpBackBtn','click',function(){
    var s1=document.getElementById('fpStep1');if(s1)s1.style.display=''
    var s2=document.getElementById('fpStep2');if(s2)s2.style.display='none'
  })
  onId('fpSaveBtn','click',function(){
    var un=window._fpVerifiedUser
    var np=(document.getElementById('fpNewPass')||{}).value||''
    var cp=(document.getElementById('fpConfirmPass')||{}).value||''
    var el=document.getElementById('fpError2')
    if(!un){if(el)el.textContent='Verification expired. Please try again.';return}
    if(!np||!cp){if(el)el.textContent='Fill both password fields';return}
    if(np!==cp){if(el)el.textContent='Passwords do not match';return}
    if(np.length<4){if(el)el.textContent='Password must be at least 4 characters';return}
    var users=getUsers()
    if(!users[un]){if(el)el.textContent='User not found';return}
    users[un].password=np
    saveUsers(users)
    if(el)el.textContent=''
    alert('Password reset successfully! You can now log in with your new password.')
    var m=document.getElementById('forgotPwdModal');if(m)m.style.display='none'
  })

  // Change Username / Email
  onId('changeUserLink','click',function(){
    var cu=document.getElementById('cuCurrentUser');if(cu)cu.value=currentUser?currentUser.username:''
    var nu=document.getElementById('cuNewUser');if(nu)nu.value=''
    var em=document.getElementById('cuEmail');if(em){em.value='';if(currentUser){var users=getUsers();var stored=users[currentUser.username];if(stored&&stored.email)em.value=stored.email}}
    var cp=document.getElementById('cuCurrentPass');if(cp)cp.value=''
    var e=document.getElementById('cuError');if(e)e.textContent=''
    var m=document.getElementById('changeUserModal');if(m)m.style.display='flex'
  })
  onId('cuCancelBtn','click',function(){var m=document.getElementById('changeUserModal');if(m)m.style.display='none'})
  onId('cuSaveBtn','click',function(){
    var nu=(document.getElementById('cuNewUser')||{}).value||''
    var em=(document.getElementById('cuEmail')||{}).value||''
    var cp=(document.getElementById('cuCurrentPass')||{}).value||''
    var el=document.getElementById('cuError')
    nu=nu.trim().toLowerCase()
    em=em.trim().toLowerCase()
    if(!currentUser){if(el)el.textContent='Not logged in';return}
    if(!cp){if(el)el.textContent='Enter your current password to confirm';return}
    var users=getUsers()
    if(!users[currentUser.username]){if(el)el.textContent='Current user not found';return}
    if(users[currentUser.username].password!==cp){if(el)el.textContent='Current password is wrong';return}
    if(!nu&&!em){if(el)el.textContent='Enter a new username or email (or both)';return}
    if(nu&&nu!==currentUser.username.toLowerCase()){
      if(users[nu]){if(el)el.textContent='Username "'+nu+'" is already taken';return}
      if(nu.length<2){if(el)el.textContent='Username must be at least 2 characters';return}
      users[nu]=users[currentUser.username]
      delete users[currentUser.username]
      currentUser.username=nu
      try{var ru=localStorage.getItem('rememberedUser');if(ru===currentUser.username||(currentUser.username&&ru&&ru.toLowerCase()===currentUser.username.toLowerCase())){localStorage.setItem('rememberedUser',nu)}}catch(er){}
    }
    if(em){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){if(el)el.textContent='Invalid email format';return}
      users[currentUser.username].email=em
    }
    saveUsers(users)
    if(el)el.textContent=''
    var unameEl=document.getElementById('userNameDisplay');if(unameEl)unameEl.textContent=currentUser.name||currentUser.username
    var m=document.getElementById('changeUserModal');if(m)m.style.display='none'
    alert('Username/email updated successfully!')
  })
  // Admin User Management
  onId('adminUserMgmtLink','click',function(){
    clearUserForm()
    renderUserList()
    var m=document.getElementById('adminUserModal');if(m)m.style.display='flex'
  })
  onId('auCloseBtn','click',function(){var m=document.getElementById('adminUserModal');if(m)m.style.display='none'})
  function getCheckedTabs(){
    var checks=document.querySelectorAll('#auTabsContainer input[type="checkbox"]')
    var tabs=[]
    checks.forEach(function(c){if(c.checked)tabs.push(c.value)})
    return tabs
  }
  function populateTabCheckboxes(selected){
    var c=document.getElementById('auTabsContainer')
    if(!c)return
    c.innerHTML=''
    Object.keys(tabLabels).forEach(function(t){
      var label=document.createElement('label')
      label.style.cssText='display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;cursor:pointer;padding:3px 7px;border-radius:4px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8)'
      var cb=document.createElement('input')
      cb.type='checkbox'
      cb.value=t
      if(selected&&selected.indexOf(t)>=0)cb.checked=true
      label.appendChild(cb)
      label.appendChild(document.createTextNode(tabLabels[t]))
      c.appendChild(label)
    })
  }
  function clearUserForm(){
    var ue=document.getElementById('auEditUser');if(ue)ue.value=''
    var un=document.getElementById('auUsername');if(un)un.value=''
    var pw=document.getElementById('auPassword');if(pw)pw.value=''
    populateTabCheckboxes([])
  }
  onId('auAddBtn','click',function(){
    var un=document.getElementById('auUsername').value.trim().toLowerCase()
    var pw=document.getElementById('auPassword').value
    var tabs=getCheckedTabs()
    var editUser=document.getElementById('auEditUser').value
    if(!un){alert('Enter username');return}
    if(!pw&&!editUser){alert('Enter password');return}
    if(!tabs.length){alert('Select at least one tab');return}
    var users=getUsers()
    if(!editUser&&users[un]){alert('User "'+un+'" already exists');return}
    if(editUser&&editUser!==un&&users[un]){alert('Username "'+un+'" already taken');return}
    if(editUser&&editUser!==un){delete users[editUser]}
    users[un]={password:pw||users[editUser]?.password||'',tabs:tabs,name:un}
    saveUsers(users)
    clearUserForm()
    renderUserList()
    alert('User "'+un+'" saved')
  })
  function renderUserList(){
    var users=getUsers()
    var html=''
    Object.keys(users).forEach(function(u){
      var isAdmin=users[u].role==='admin'
      var tabStr=''
      if(isAdmin)tabStr='admin'
      else if(users[u].tabs)tabStr=users[u].tabs.map(function(t){return tabLabels[t]||t}).join(', ')
      else tabStr=users[u].role||'?'
      html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">'
      html+='<div><strong>'+u+'</strong> <span style="color:rgba(255,255,255,0.4);font-size:0.65rem">('+tabStr+')</span></div>'
      html+='<div>'
      if(!isAdmin){
        html+='<a class="au-edit" data-user="'+u+'" style="cursor:pointer;color:#89b4fa;font-size:0.65rem;margin-left:10px">Edit</a>'
        html+='<a class="au-delete" data-user="'+u+'" style="cursor:pointer;color:#ff453a;font-size:0.65rem;margin-left:10px">Delete</a>'
      }else{
        html+='<span style="color:rgba(255,255,255,0.3);font-size:0.6rem">protected</span>'
      }
      html+='</div></div>'
    })
    document.getElementById('adminUserList').innerHTML=html
    document.querySelectorAll('.au-delete').forEach(function(el){
      el.addEventListener('click',function(){
        var u=this.getAttribute('data-user')
        if(!confirm('Delete user "'+u+'"?'))return
        var users=getUsers()
        delete users[u]
        saveUsers(users)
        renderUserList()
      })
    })
    document.querySelectorAll('.au-edit').forEach(function(el){
      el.addEventListener('click',function(){
        var u=this.getAttribute('data-user')
        var users=getUsers()
        var ud=users[u]
        if(!ud)return
        document.getElementById('auEditUser').value=u
        document.getElementById('auUsername').value=u
        document.getElementById('auPassword').value=''
        populateTabCheckboxes(ud.tabs||[])
      })
    })
  }
  // Show login overlay on page load (after everything loaded)
  updateUI()
  if(!currentUser)showLogin()
  })
})();