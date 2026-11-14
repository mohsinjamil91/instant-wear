(function(){
'use strict';
var CFG=window.IW_CONFIG||{};
var fb=window.firebase, auth=null, db=null;
var configured=!!(fb&&CFG.firebase&&CFG.firebase.apiKey&&String(CFG.firebase.apiKey).indexOf('PASTE')<0);
if(configured){try{fb.initializeApp(CFG.firebase);auth=fb.auth();db=fb.firestore()}catch(e){configured=false}}
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var fmt=function(n){return '₹'+Math.round(Number(n||0)).toLocaleString('en-IN')};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var LS={
  get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
function randId(n){
  var c='abcdefghijklmnopqrstuvwxyz0123456789',out='',a=new Uint8Array(n);
  (window.crypto||window.msCrypto).getRandomValues(a);
  for(var i=0;i<n;i++) out+=c[a[i]%c.length];
  return out;
}
var SIZES=['XS','S','M','L','XL','XXL'];
var TYPES={tee:'T-shirt',shirt:'Shirt',top:'Crop top',hoodie:'Hoodie',jacket:'Jacket',jeans:'Jeans or trousers',dress:'Dress',kurti:'Kurti'};
var STATUSES=['Placed','Packed','Out for delivery','Delivered','Cancelled'];
var DELIVERY_FEE=29, FREE_OVER=999;

var SEED=[
 {id:'w1',name:'Floral Wrap Dress',cat:'women',type:'dress',color:'#d9577b',price:899,mrp:1399,stock:12,sizes:['S','M','L'],active:true},
 {id:'w2',name:'Cotton Kurti',cat:'women',type:'kurti',color:'#2f8f83',price:649,mrp:999,stock:20,sizes:['S','M','L','XL'],active:true},
 {id:'w3',name:'Denim Jacket',cat:'women',type:'jacket',color:'#4a6fa5',price:1299,mrp:1899,stock:7,sizes:['S','M','L'],active:true},
 {id:'w4',name:'Ribbed Crop Top',cat:'women',type:'top',color:'#e8b04b',price:399,mrp:599,stock:3,sizes:['XS','S','M'],active:true},
 {id:'w5',name:'High-Waist Jeans',cat:'women',type:'jeans',color:'#2e4a7d',price:1099,mrp:1599,stock:15,sizes:['S','M','L','XL'],active:true},
 {id:'w6',name:'Oversized Hoodie',cat:'women',type:'hoodie',color:'#9c7bd1',price:1199,mrp:1799,stock:9,sizes:['S','M','L'],active:true},
 {id:'m1',name:'Oxford Shirt',cat:'men',type:'shirt',color:'#8fb8de',price:799,mrp:1199,stock:18,sizes:['M','L','XL'],active:true},
 {id:'m2',name:'Graphic Tee',cat:'men',type:'tee',color:'#2b2f3f',price:499,mrp:799,stock:25,sizes:['S','M','L','XL','XXL'],active:true},
 {id:'m3',name:'Slim Chinos',cat:'men',type:'jeans',color:'#b59a6d',price:999,mrp:1499,stock:11,sizes:['M','L','XL'],active:true},
 {id:'m4',name:'Pullover Hoodie',cat:'men',type:'hoodie',color:'#4d5a6b',price:1199,mrp:1799,stock:4,sizes:['M','L','XL'],active:true},
 {id:'m5',name:'Bomber Jacket',cat:'men',type:'jacket',color:'#3d5a45',price:1799,mrp:2599,stock:6,sizes:['M','L','XL'],active:true},
 {id:'m6',name:'Straight Jeans',cat:'men',type:'jeans',color:'#35507a',price:1099,mrp:1599,stock:14,sizes:['M','L','XL'],active:true}
].map(function(p,i){p.ord=i;return p});

/* garment drawings */
var ST='stroke="rgba(0,0,0,.3)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
var SHAPES={
 tee:'M30 18 L42 14 Q50 22 58 14 L70 18 L88 34 L78 44 L70 38 L70 86 L30 86 L30 38 L22 44 L12 34 Z',
 shirt:'M30 18 L42 14 Q50 22 58 14 L70 18 L88 34 L78 44 L70 38 L70 86 L30 86 L30 38 L22 44 L12 34 Z',
 top:'M32 24 L42 20 Q50 28 58 20 L68 24 L82 38 L74 46 L68 42 L68 66 L32 66 L32 42 L26 46 L18 38 Z',
 hoodie:'M30 22 L40 16 Q50 26 60 16 L70 22 L92 70 L80 76 L70 52 L70 86 L30 86 L30 52 L20 76 L8 70 Z',
 jacket:'M30 20 L42 14 L50 24 L58 14 L70 20 L92 68 L80 74 L70 50 L70 86 L30 86 L30 50 L20 74 L8 68 Z',
 jeans:'M32 12 H68 L72 88 H54 L50 40 L46 88 H28 Z',
 dress:'M38 12 L44 12 Q50 22 56 12 L62 12 L66 40 L84 88 H16 L34 40 Z',
 kurti:'M32 14 L44 12 Q50 20 56 12 L68 14 L72 40 L70 90 H30 L28 40 Z'
};
var DETAIL={
 shirt:'<path d="M50 24 V86" fill="none" '+ST+'/><path d="M42 14 L50 26 L58 14" fill="rgba(255,255,255,.4)" '+ST+'/>',
 hoodie:'<path d="M40 16 Q50 4 60 16" fill="none" '+ST+'/><path d="M46 28 V42 M54 28 V42" fill="none" '+ST+'/>',
 jacket:'<path d="M50 24 V86" fill="none" '+ST+'/><path d="M30 60 H44 M56 60 H70" fill="none" '+ST+'/>',
 jeans:'<path d="M50 12 V40 M36 20 Q40 28 46 26" fill="none" '+ST+'/>',
 dress:'<path d="M34 40 H66" fill="none" '+ST+'/>',
 kurti:'<path d="M44 12 L50 30 L56 12" fill="rgba(255,255,255,.4)" '+ST+'/><path d="M50 30 V70" fill="none" '+ST+'/>'
};
function garment(type){
  var d=SHAPES[type]||SHAPES.tee;
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="'+d+'" fill="var(--g)" '+ST+'/>'+(DETAIL[type]||'')+'</svg>';
}
function safeColor(c){return /^#[0-9a-f]{6}$/i.test(c||'')?c:'#4a6fa5'}

/* state */
var state={
  products:[], loaded:false, loadErr:false, orders:[],
  cart:LS.get('iw_cart',[]), last:LS.get('iw_last',null),
  sel:{}, user:null, isOwner:false, gateMsg:'',
  editing:null, delArm:null, tab:'items', drawer:'cart'
};
function saveCart(){LS.set('iw_cart',state.cart)}
function find(id){return state.products.filter(function(p){return p.id===id})[0]}
function stockOf(p){return Math.max(0,p.stock||0)}

var toastT;
function toast(msg){
  var t=$('#toast');t.textContent=msg;t.hidden=false;
  clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true},2400);
}
function withTimeout(promise,ms){
  return Promise.race([promise,new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'))},ms)})]);
}

/* ---------- shop ---------- */
function card(p){
  var sel=state.sel[p.id]||p.sizes[0];
  var sizes=p.sizes.map(function(s){return '<button type="button" class="sz" data-act="size" data-id="'+esc(p.id)+'" data-size="'+esc(s)+'" aria-pressed="'+(sel===s)+'">'+esc(s)+'</button>'}).join('');
  var off=p.mrp>p.price?Math.round((1-p.price/p.mrp)*100):0;
  var st=stockOf(p), sold=st<=0;
  var tag=sold?'<span class="tag out">Sold out</span>':(st<=5?'<span class="tag">Only '+st+' left</span>':'');
  return '<article class="card"><div class="tile" style="--g:'+safeColor(p.color)+'">'+garment(p.type)+tag+'</div>'+
   '<div class="cinfo"><h3>'+esc(p.name)+'</h3>'+
   '<div class="price"><b>'+fmt(p.price)+'</b>'+(off?'<s>'+fmt(p.mrp)+'</s><em>'+off+'% off</em>':'')+'</div>'+
   '<div class="sizes" role="group" aria-label="Size for '+esc(p.name)+'">'+sizes+'</div>'+
   '<button type="button" class="btn pri add" data-act="add" data-id="'+esc(p.id)+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':'Add to cart')+'</button></div></article>';
}
function renderShop(){
  $('#setup').hidden=configured;
  ['women','men'].forEach(function(cat){
    var box=$('#g-'+cat);
    if(!configured){$('#n-'+cat).textContent='';box.innerHTML='';return}
    if(!state.loaded){$('#n-'+cat).textContent='';box.innerHTML='<div class="empty">'+(state.loadErr?'Could not load clothes. Check your connection and reload.':'Loading clothes...')+'</div>';return}
    var list=state.products.filter(function(p){return p.cat===cat&&p.active!==false&&p.sizes&&p.sizes.length}).sort(function(a,b){return (a.ord||0)-(b.ord||0)});
    $('#n-'+cat).textContent=list.length+(list.length===1?' item':' items');
    box.innerHTML=list.length?'<div class="grid">'+list.map(card).join('')+'</div>':'<div class="empty">Nothing listed in this collection right now. Check back in a few minutes.</div>';
  });
}

/* ---------- cart ---------- */
function cartLines(){
  return state.cart.map(function(l){var p=find(l.pid);return p&&p.active!==false?{pid:l.pid,size:l.size,qty:l.qty,p:p}:null}).filter(Boolean);
}
function totals(lines){
  var sub=lines.reduce(function(a,l){return a+l.p.price*l.qty},0);
  var fee=!lines.length||sub>=FREE_OVER?0:DELIVERY_FEE;
  return {sub:sub,fee:fee,total:sub+fee,count:lines.reduce(function(a,l){return a+l.qty},0)};
}
function addToCart(pid){
  var p=find(pid);if(!p||stockOf(p)<=0) return;
  var size=state.sel[pid]||p.sizes[0];
  var inCart=state.cart.filter(function(l){return l.pid===pid}).reduce(function(a,l){return a+l.qty},0);
  if(inCart>=stockOf(p)){toast('Only '+stockOf(p)+' in stock');return}
  var l=state.cart.filter(function(x){return x.pid===pid&&x.size===size})[0];
  if(l) l.qty++; else state.cart.push({pid:pid,size:size,qty:1});
  saveCart();renderCart();toast(p.name+' ('+size+') added');
}
function changeQty(pid,size,delta){
  var l=state.cart.filter(function(x){return x.pid===pid&&x.size===size})[0];if(!l) return;
  var p=find(pid);
  if(delta>0){
    var inCart=state.cart.filter(function(x){return x.pid===pid}).reduce(function(a,x){return a+x.qty},0);
    if(p&&inCart>=stockOf(p)){toast('Only '+stockOf(p)+' in stock');return}
  }
  l.qty+=delta;
  if(l.qty<=0) state.cart=state.cart.filter(function(x){return x!==l});
  saveCart();renderCart();
}
function renderCart(){
  var lines=cartLines(), t=totals(lines);
  $('#cartCount').textContent=t.count;
  $('#cartbar').hidden=!t.count||!$('#drawer').hidden;
  $('#cb-l').textContent='View cart ('+t.count+(t.count===1?' item)':' items)');
  $('#cb-r').textContent=fmt(t.total);
  if(!lines.length){
    var live=state.last&&state.last.status!=='Delivered'&&state.last.status!=='Cancelled';
    $('#dlines').innerHTML='<div class="empty">Your cart is empty.'+(live?'<br><br><button type="button" class="btn sm" data-act="track">Track your last order</button>':'')+'</div>';
    $('#dsum').innerHTML='';$('#cform').hidden=true;$('#authForm').hidden=!!state.user;return;
  }
  $('#cform').hidden=!state.user;$('#authForm').hidden=!!state.user;$('#whoami').textContent=state.user?'Signed in as '+state.user.email:'';
  $('#dlines').innerHTML=lines.map(function(l){
    return '<div class="line"><div class="mini" style="--g:'+safeColor(l.p.color)+'">'+garment(l.p.type)+'</div>'+
    '<div><h4>'+esc(l.p.name)+'</h4><small>Size '+esc(l.size)+' · '+fmt(l.p.price)+'</small></div>'+
    '<div class="qty"><button type="button" data-act="dec" data-id="'+esc(l.pid)+'" data-size="'+esc(l.size)+'" aria-label="Fewer">&minus;</button><b>'+l.qty+'</b><button type="button" data-act="inc" data-id="'+esc(l.pid)+'" data-size="'+esc(l.size)+'" aria-label="More">+</button></div></div>';
  }).join('');
  $('#dsum').innerHTML='<div><span>Items</span><span class="mono">'+fmt(t.sub)+'</span></div>'+
    '<div><span>Delivery</span><span class="mono">'+(t.fee?fmt(t.fee):'Free')+'</span></div>'+
    (t.fee?'<small class="note">Add '+fmt(FREE_OVER-t.sub)+' more for free delivery.</small>':'')+
    '<div class="tot"><span>Total</span><span class="mono">'+fmt(t.total)+'</span></div>';
}
var lastFocus=null;
function openDrawer(view){
  lastFocus=document.activeElement;
  state.drawer=view||'cart';
  $('#dcart').hidden=state.drawer!=='cart';
  $('#ddone').hidden=state.drawer!=='done';
  $('#dtitle').textContent=state.drawer==='done'?'Order placed':'Your cart';
  $('#drawer').hidden=false;$('#scrim').hidden=false;
  document.body.style.overflow='hidden';
  renderCart();
  $('#dclose').focus();
}
function closeDrawer(){
  $('#drawer').hidden=true;$('#scrim').hidden=true;document.body.style.overflow='';
  renderCart();
  if(lastFocus&&lastFocus.focus) try{lastFocus.focus()}catch(e){}
}

/* ---------- checkout + live order status ---------- */
var unwatchLast=null;
function tick(){
  var el=$('#cd');if(!el||!state.last) return;
  var ms=new Date(state.last.etaAt)-Date.now();
  if(ms<=0){el.textContent='Arriving';return}
  var m=Math.floor(ms/60000), s=Math.floor(ms%60000/1000);
  el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function showDone(){
  var o=state.last;if(!o) return;
  var eta=new Date(o.etaAt).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
  $('#ddone').innerHTML='<div class="done"><span class="ok">'+esc(o.code)+'</span>'+
   '<div class="cd" id="cd">30:00</div><div>Arriving by <b>'+esc(eta)+'</b></div>'+
   '<p class="note" style="margin-top:8px">Status: <b id="ostat">'+esc(o.status)+'</b></p>'+
   '<ul>'+o.items.map(function(i){return '<li><span>'+i.qty+' × '+esc(i.name)+' ('+esc(i.size)+')</span><span class="mono">'+fmt(i.price*i.qty)+'</span></li>'}).join('')+
   '<li><b>Total to pay on delivery</b><b class="mono">'+fmt(o.total)+'</b></li></ul>'+
   '<button type="button" class="btn pri" data-act="shopmore">Keep shopping</button></div>';
  tick();openDrawer('done');
  watchLast();
}
function watchLast(){
  if(unwatchLast){unwatchLast();unwatchLast=null}
  if(!db||!state.last) return;
  unwatchLast=db.collection('orders').doc(state.last.id).onSnapshot(function(s){
    if(!s.exists) return;
    var d=s.data();state.last.status=d.status;LS.set('iw_last',state.last);
    var el=$('#ostat');if(el) el.textContent=d.status;
  },function(){});
}
function notifyOwner(orderId){
  try{
    state.user.getIdToken().then(function(tok){
      return fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:orderId,idToken:tok})});
    }).catch(function(){});
  }catch(e){}
}
$('#cform').addEventListener('submit',function(e){
  e.preventDefault();
  var name=$('#c-name').value.trim(), phone=$('#c-phone').value.replace(/[\s-]/g,'').replace(/^\+?91/,''), addr=$('#c-addr').value.trim(), pin=$('#c-pin').value.trim();
  var err=$('#cerr');
  if(!configured||!db){err.textContent='The store is not connected yet. Please try again later.';return}
  if(!state.user){err.textContent='Log in to place your order.';return}
  if(!name){err.textContent='Enter your name.';$('#c-name').focus();return}
  if(!/^[6-9]\d{9}$/.test(phone)){err.textContent='Enter a 10-digit mobile number.';$('#c-phone').focus();return}
  if(addr.length<8){err.textContent='Enter your full delivery address.';$('#c-addr').focus();return}
  if(!/^\d{6}$/.test(pin)){err.textContent='Enter a 6-digit PIN code.';$('#c-pin').focus();return}
  var lines=cartLines();if(!lines.length){err.textContent='Your cart is empty.';return}
  err.textContent='';
  var btn=$('#placeBtn');btn.disabled=true;btn.textContent='Placing order...';
  var t=totals(lines), now=new Date(), id=randId(20);
  var o={id:id,uid:state.user.uid,code:id.slice(0,6).toUpperCase(),name:name,phone:phone,addr:addr,pin:pin,
    items:lines.map(function(l){return {pid:l.pid,name:l.p.name,size:l.size,qty:l.qty,price:l.p.price}}),
    sub:t.sub,fee:t.fee,total:t.total,status:'Placed',at:now.toISOString(),etaAt:new Date(now.getTime()+30*60000).toISOString()};
  withTimeout(db.collection('orders').doc(id).set(o),10000).then(function(){
    state.last=o;LS.set('iw_last',o);
    LS.set('iw_cust',{name:name,phone:phone,addr:addr,pin:pin});
    state.cart=[];saveCart();
    btn.disabled=false;btn.textContent='Place order';
    notifyOwner(id);
    showDone();
  },function(){
    btn.disabled=false;btn.textContent='Place order';
    err.textContent='Could not place the order. Check your connection and try again.';
  });
});

/* ---------- owner ---------- */
function renderOwner(){
  var ok=state.isOwner;
  $('#gate').hidden=ok;$('#panel').hidden=!ok;
  $('#pinErr').textContent=state.gateMsg||'';
  if(!configured){$('#pinErr').textContent='Connect Firebase in config.js first.'}
  if(!ok) return;
  $('#syncNote').textContent='Signed in as '+(state.user&&state.user.email||'owner')+'. Changes go live for every customer instantly.';
  renderStats();renderPlist();renderOlist();
}
function renderStats(){
  var today=new Date().toDateString();
  var os=state.orders.filter(function(o){return new Date(o.at).toDateString()===today});
  var open=state.orders.filter(function(o){return o.status==='Placed'||o.status==='Packed'||o.status==='Out for delivery'}).length;
  var rev=os.filter(function(o){return o.status!=='Cancelled'}).reduce(function(a,o){return a+o.total},0);
  var low=state.products.filter(function(p){return stockOf(p)<=5}).length;
  $('#stats').innerHTML=[[os.length,'Orders today'],[open,'Open orders'],[fmt(rev),'Sales today'],[state.products.length,'Clothes listed'],[low,'Low stock']].map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('');
  $('#ordBadge').textContent=open?'('+open+')':'';
}
function renderPlist(){
  var list=state.products.slice().sort(function(a,b){return (a.cat>b.cat?1:a.cat<b.cat?-1:0)||((a.ord||0)-(b.ord||0))});
  if(!list.length){$('#plist').innerHTML='<div class="empty">No clothes yet. Add your first one with the form, or<br><br><button type="button" class="btn sm" data-act="seed">Load sample clothes</button></div>';return}
  $('#plist').innerHTML=list.map(function(p){
    var armed=state.delArm===p.id;
    return '<div class="prow"><div class="mini" style="--g:'+safeColor(p.color)+'">'+garment(p.type)+'</div>'+
    '<div class="pmeta"><b>'+esc(p.name)+'</b><span>'+(p.cat==='women'?'Women':'Men')+' · '+esc(TYPES[p.type]||p.type)+' · '+esc((p.sizes||[]).join(' '))+'</span></div>'+
    '<div class="pnum"><b>'+fmt(p.price)+'</b><span>Stock '+stockOf(p)+'</span></div>'+
    '<div class="pbar"><label class="inl"><input type="checkbox" data-act="toggle" data-id="'+esc(p.id)+'"'+(p.active!==false?' checked':'')+'> Listed</label>'+
    '<button type="button" class="btn sm" data-act="edit" data-id="'+esc(p.id)+'">Edit</button>'+
    '<button type="button" class="btn sm danger" data-act="del" data-id="'+esc(p.id)+'">'+(armed?'Confirm delete':'Delete')+'</button></div></div>';
  }).join('');
}
function renderOlist(){
  var list=state.orders;
  if(!list.length){$('#olist').innerHTML='<div class="empty">No orders yet. New orders appear here the moment a customer places them.</div>';return}
  $('#olist').innerHTML=list.map(function(o){
    var when=new Date(o.at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
    return '<article class="ocard"><header><b>'+esc(o.code||o.id)+'</b><span class="pill">'+esc(when)+'</span></header>'+
    '<div><b>'+esc(o.name)+'</b> · <span class="mono">'+esc(o.phone)+'</span><br><span class="note">'+esc(o.addr)+', '+esc(o.pin)+'</span></div>'+
    '<ul>'+o.items.map(function(i){return '<li>'+i.qty+' × '+esc(i.name)+' ('+esc(i.size)+') · '+fmt(i.price)+'</li>'}).join('')+'</ul>'+
    '<div class="pbar"><b class="mono">'+fmt(o.total)+'</b><select data-act="status" data-id="'+esc(o.id)+'" aria-label="Status of '+esc(o.code||o.id)+'">'+
    STATUSES.map(function(s){return '<option'+(o.status===s?' selected':'')+'>'+s+'</option>'}).join('')+'</select>'+
    '<button type="button" class="btn sm danger" data-act="delorder" data-id="'+esc(o.id)+'">Remove</button></div></article>';
  }).join('');
}
var unOrders=null, firstOrders=true, actx=null;
function beep(){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);
    o.frequency.value=880;g.gain.setValueAtTime(.25,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+.7);
    o.start();o.stop(actx.currentTime+.7);
  }catch(e){}
}
function alertNewOrder(o){
  toast('New order '+(o.code||'')+' · '+fmt(o.total));beep();
  try{if(window.Notification&&Notification.permission==='granted') new Notification('New order '+(o.code||''),{body:(o.name||'')+' · '+fmt(o.total)})}catch(e){}
}
function watchOrders(){
  if(unOrders||!db) return;
  unOrders=db.collection('orders').orderBy('at','desc').limit(200).onSnapshot(function(s){
    if(!firstOrders){s.docChanges().forEach(function(c){if(c.type==='added') alertNewOrder(c.doc.data())})}
    firstOrders=false;
    state.orders=s.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});
    if(state.isOwner){renderStats();renderOlist()}
  },function(){toast('Could not load orders')});
}
function stopOrders(){if(unOrders){unOrders();unOrders=null}state.orders=[];firstOrders=true}

/* product form */
function initForm(){
  $('#f-type').innerHTML=Object.keys(TYPES).map(function(k){return '<option value="'+k+'">'+TYPES[k]+'</option>'}).join('');
  $('#f-sizes').innerHTML=SIZES.map(function(s){return '<label><input type="checkbox" value="'+s+'"> '+s+'</label>'}).join('');
  resetForm();
}
function preview(){$('#fPrev').style.setProperty('--g',safeColor($('#f-color').value));$('#fPrev').innerHTML=garment($('#f-type').value)}
function resetForm(){
  state.editing=null;
  $('#fTitle').textContent='Add a cloth';$('#fSave').textContent='Add cloth';$('#fCancel').hidden=true;
  $('#f-name').value='';$('#f-cat').value='women';$('#f-type').value='tee';$('#f-price').value='';$('#f-mrp').value='';$('#f-stock').value='10';
  $('#f-color').value='#4a6fa5';$('#f-active').checked=true;$('#fErr').textContent='';
  $$('#f-sizes input').forEach(function(c){c.checked=['S','M','L'].indexOf(c.value)>-1});
  preview();
}
function editProduct(id){
  var p=find(id);if(!p) return;
  state.editing=id;
  $('#fTitle').textContent='Edit cloth';$('#fSave').textContent='Save changes';$('#fCancel').hidden=false;
  $('#f-name').value=p.name;$('#f-cat').value=p.cat;$('#f-type').value=p.type;$('#f-price').value=p.price;$('#f-mrp').value=p.mrp||p.price;
  $('#f-stock').value=stockOf(p);$('#f-color').value=safeColor(p.color);$('#f-active').checked=p.active!==false;$('#fErr').textContent='';
  $$('#f-sizes input').forEach(function(c){c.checked=p.sizes.indexOf(c.value)>-1});
  preview();
  $('#pform').scrollIntoView({block:'start'});$('#f-name').focus();
}
function dbFail(){toast('Could not save. Check your connection and that you are signed in as owner.')}
$('#pform').addEventListener('input',function(e){if(e.target.id==='f-type'||e.target.id==='f-color') preview()});
$('#pform').addEventListener('change',function(e){if(e.target.id==='f-type') preview()});
$('#fCancel').addEventListener('click',resetForm);
$('#pform').addEventListener('submit',function(e){
  e.preventDefault();
  if(!state.isOwner||!db) return;
  var name=$('#f-name').value.trim(), price=Math.round(Number($('#f-price').value)), mrp=Math.round(Number($('#f-mrp').value))||price, stock=Math.max(0,Math.round(Number($('#f-stock').value))||0);
  var sizes=$$('#f-sizes input').filter(function(c){return c.checked}).map(function(c){return c.value});
  var err=$('#fErr');
  if(!name){err.textContent='Enter a name.';$('#f-name').focus();return}
  if(!(price>0)){err.textContent='Enter a price above 0.';$('#f-price').focus();return}
  if(!sizes.length){err.textContent='Pick at least one size.';return}
  if(mrp<price) mrp=price;
  var old=state.editing?find(state.editing):null;
  var p=Object.assign({},old||{},{name:name,cat:$('#f-cat').value,type:$('#f-type').value,color:$('#f-color').value,price:price,mrp:mrp,stock:stock,sizes:sizes,active:$('#f-active').checked});
  if(!old){p.id='p'+Date.now().toString(36)+randId(3);p.ord=Date.now()}
  db.collection('products').doc(p.id).set(p).then(function(){toast('Saved and live for customers');resetForm()},dbFail);
});

/* owner sign-in */
$('#gateForm').addEventListener('submit',function(e){
  e.preventDefault();
  if(!configured||!auth){state.gateMsg='Connect Firebase in config.js first.';renderOwner();return}
  var btn=$('#gBtn');btn.disabled=true;
  auth.signInWithEmailAndPassword($('#g-email').value.trim(),$('#g-pass').value).then(function(){
    state.gateMsg='';$('#g-pass').value='';
  },function(){state.gateMsg='Email or password is not right.';renderOwner()}).then(function(){btn.disabled=false});
});
$('#lockBtn').addEventListener('click',function(){if(auth) auth.signOut()});
if(configured){
  auth.onAuthStateChanged(function(u){
    state.user=u;state.isOwner=!!(u&&CFG.ownerUid&&u.uid===CFG.ownerUid);
    if(state.isOwner){state.gateMsg='';watchOrders()}else stopOrders();
    if(u&&!state.isOwner&&location.hash==='#owner') state.gateMsg='You are signed in as a customer ('+u.email+'). Sign in with the owner account to continue.';
    $('#acctBtn').textContent=u?'Log out':'Log in';
    renderOwner();renderCart();
    if(u&&state.last) watchLast();
  });
}
$$('.otabs button').forEach(function(b){b.addEventListener('click',function(){
  state.tab=b.dataset.tab;
  $$('.otabs button').forEach(function(x){x.setAttribute('aria-selected',String(x===b))});
  $('#tab-items').hidden=state.tab!=='items';$('#tab-orders').hidden=state.tab!=='orders';
})});

/* customer login */
var authMode='login';
function setAuthMode(m){
  authMode=m;
  $('#authTitle').textContent=m==='login'?'Log in to place your order':'Create your account';
  $('#aBtn').textContent=m==='login'?'Log in':'Create account';
  $('#aSwitch').textContent=m==='login'?'New here? Create an account':'Already have an account? Log in';
  $('#a-pass').setAttribute('autocomplete',m==='login'?'current-password':'new-password');
  $('#aerr').textContent='';
}
$('#aSwitch').addEventListener('click',function(){setAuthMode(authMode==='login'?'signup':'login')});
$('#aForgot').addEventListener('click',function(){
  var em=$('#a-email').value.trim();
  if(!auth){return}
  if(!em){$('#aerr').textContent='Enter your email first.';return}
  auth.sendPasswordResetEmail(em).then(function(){toast('Password reset email sent')},function(){$('#aerr').textContent='Could not send the reset email. Check the address.'});
});
$('#authForm').addEventListener('submit',function(e){
  e.preventDefault();
  if(!configured||!auth){$('#aerr').textContent='The store is not connected yet.';return}
  var em=$('#a-email').value.trim(), pw=$('#a-pass').value;
  if(!em||pw.length<6){$('#aerr').textContent='Enter your email and a password of at least 6 characters.';return}
  var btn=$('#aBtn');btn.disabled=true;
  var wasSignup=authMode==='signup';
  var p=wasSignup?auth.createUserWithEmailAndPassword(em,pw):auth.signInWithEmailAndPassword(em,pw);
  p.then(function(){$('#a-pass').value='';$('#aerr').textContent='';toast(wasSignup?'Account created':'Logged in')},function(err){
    var c=(err&&err.code)||'';
    $('#aerr').textContent=c==='auth/email-already-in-use'?'This email already has an account. Log in instead.':
      c==='auth/weak-password'?'Use a password with at least 6 characters.':
      c==='auth/invalid-email'?'Enter a valid email address.':
      c==='auth/operation-not-allowed'?'Email sign-in is not enabled for this store.':
      c==='auth/too-many-requests'?'Too many attempts. Try again in a few minutes.':'Email or password is not right.';
  }).then(function(){btn.disabled=false});
});
$('#acctBtn').addEventListener('click',function(){
  if(!auth){toast('The store is not connected yet');return}
  if(state.user) auth.signOut().then(function(){toast('Logged out')}); else openDrawer('cart');
});
$('#alertBtn').addEventListener('click',function(){
  beep();
  if(window.Notification&&Notification.permission==='default') Notification.requestPermission().then(function(r){toast(r==='granted'?'Order alerts are on':'Pop-ups are blocked, sound alerts still work')});
  else toast('Sound alerts are on');
});

/* order status + stock bookkeeping */
function setStatus(o,next){
  var batch=db.batch(), ref=db.collection('orders').doc(o.id), upd={status:next};
  var cutNow=!o.stockCut&&o.status==='Placed'&&next!=='Placed'&&next!=='Cancelled';
  var restore=o.stockCut&&next==='Cancelled';
  if(cutNow||restore){
    o.items.forEach(function(i){
      if(find(i.pid)) batch.update(db.collection('products').doc(i.pid),{stock:fb.firestore.FieldValue.increment(cutNow?-i.qty:i.qty)});
    });
    upd.stockCut=cutNow;
  }
  batch.update(ref,upd);
  return batch.commit();
}

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t) return;
  var a=t.dataset.act, id=t.dataset.id;
  if(a==='size'){
    state.sel[id]=t.dataset.size;
    $$('.sz[data-id="'+id+'"]').forEach(function(b){b.setAttribute('aria-pressed',String(b===t))});
  }else if(a==='add') addToCart(id);
  else if(a==='inc') changeQty(id,t.dataset.size,1);
  else if(a==='dec') changeQty(id,t.dataset.size,-1);
  else if(a==='shopmore') closeDrawer();
  else if(a==='track') showDone();
  else if(a==='edit') editProduct(id);
  else if(a==='seed'){
    if(!state.isOwner||!db) return;
    var batch=db.batch();SEED.forEach(function(p){batch.set(db.collection('products').doc(p.id),p)});
    batch.commit().then(function(){toast('Sample clothes added')},dbFail);
  }
  else if(a==='del'){
    if(!state.isOwner||!db) return;
    if(state.delArm===id){
      state.delArm=null;
      db.collection('products').doc(id).delete().then(function(){toast('Deleted')},dbFail);
    }else{
      state.delArm=id;renderPlist();
      setTimeout(function(){if(state.delArm===id){state.delArm=null;renderPlist()}},3500);
    }
  }else if(a==='delorder'){
    if(!state.isOwner||!db) return;
    db.collection('orders').doc(id).delete().catch(dbFail);
  }
});
document.addEventListener('change',function(e){
  var t=e.target;if(!t.dataset||!t.dataset.act||!state.isOwner||!db) return;
  if(t.dataset.act==='toggle'){
    db.collection('products').doc(t.dataset.id).update({active:t.checked}).then(function(){toast(t.checked?'Listed for customers':'Hidden from customers')},dbFail);
  }else if(t.dataset.act==='status'){
    var o=state.orders.filter(function(x){return x.id===t.dataset.id})[0];if(!o) return;
    setStatus(o,t.value).then(function(){toast('Order '+(o.code||o.id)+': '+t.value)},function(){dbFail();renderOlist()});
  }
});
$('#cartBtn').addEventListener('click',function(){openDrawer('cart')});
$('#cartbar').addEventListener('click',function(){openDrawer('cart')});
$('#dclose').addEventListener('click',closeDrawer);
$('#scrim').addEventListener('click',closeDrawer);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('#drawer').hidden) closeDrawer()});

/* routing */
function route(){
  var h=location.hash.replace('#','');
  var own=h==='owner';
  $('#shopView').hidden=own;$('#ownerView').hidden=!own;
  if(!own) $('#nav-shop').setAttribute('aria-current','page'); else $('#nav-shop').removeAttribute('aria-current');
  if(own) renderOwner();
  else if(h==='women'||h==='men'){var el=document.getElementById(h);if(el) el.scrollIntoView()}
  else if(h==='shop') window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);

/* boot */
(function(){
  var c=LS.get('iw_cust',null);
  if(c){$('#c-name').value=c.name||'';$('#c-phone').value=c.phone||'';$('#c-addr').value=c.addr||'';$('#c-pin').value=c.pin||''}
})();
initForm();renderShop();renderCart();route();
if(configured){
  db.collection('products').onSnapshot(function(s){
    state.products=s.docs.map(function(d){return Object.assign({},d.data(),{id:d.id})});
    state.loaded=true;state.loadErr=false;
    renderShop();renderCart();
    if(state.isOwner){renderStats();renderPlist()}
  },function(){state.loadErr=true;renderShop()});
  if(state.last) watchLast();
}
setInterval(tick,1000);
})();
