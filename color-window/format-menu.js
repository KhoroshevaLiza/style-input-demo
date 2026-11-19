const colorFormatMenu=document.createElement('div');colorFormatMenu.id='color-format-menu';colorFormatMenu.hidden=true;colorFormatMenu.setAttribute('role','menu');colorFormatMenu.setAttribute('aria-label','Формат цвета');
for(const format of ['HEX','RGB','HSL']){
 const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(format==='HEX'));
 const icon=document.createElement('img');icon.src=format==='HEX'?'assets/menu-radio-selected.svg':'assets/menu-radio-empty.svg';icon.alt='';
 const label=document.createElement('span');label.textContent=format;item.append(icon,label);colorFormatMenu.append(item);
 item.onclick=()=>{if(!colorFormatAnchor)return;const anchor=colorFormatAnchor;anchor.dataset.colorModel=format;syncColorFormatField(anchor);closeColorFormatMenu();anchor.focus({preventScroll:true});};
}
document.body.append(colorFormatMenu);
let colorFormatAnchor=null;
function closeColorFormatMenu(){
 colorFormatMenu.hidden=true;if(colorFormatAnchor)colorFormatAnchor.setAttribute('aria-expanded','false');colorFormatAnchor=null;
}
function toggleColorFormatMenu(anchor){
 if(colorFormatAnchor===anchor&&!colorFormatMenu.hidden){closeColorFormatMenu();return;}
 closeColorFormatMenu();hideTooltip();colorFormatAnchor=anchor;anchor.setAttribute('aria-expanded','true');
 for(const item of colorFormatMenu.children){const selected=item.textContent===(anchor.dataset.colorModel||'HEX');item.setAttribute('aria-checked',String(selected));item.querySelector('img').src=selected?'assets/menu-radio-selected.svg':'assets/menu-radio-empty.svg';}
 const rect=anchor.getBoundingClientRect();colorFormatMenu.style.left=Math.max(8,Math.min(window.innerWidth-96,rect.left-18))+'px';colorFormatMenu.style.top=(rect.bottom-1)+'px';colorFormatMenu.hidden=false;
}
function prepareColorFormatFields(){
 document.querySelectorAll('.format:not([data-format-trigger])').forEach(anchor=>{
  anchor.dataset.formatTrigger='';anchor.dataset.colorModel='HEX';anchor.setAttribute('role','button');anchor.tabIndex=0;anchor.setAttribute('aria-label','Формат цвета: HEX');anchor.setAttribute('aria-haspopup','menu');anchor.setAttribute('aria-expanded','false');
  const channels=document.createElement('span');channels.className='color-model-channels';channels.hidden=true;
  for(let index=0;index<3;index++){const input=document.createElement('input');input.type='number';input.step='1';input.dataset.channel=index;input.onchange=()=>changeColorModelChannels(anchor);input.onblur=()=>syncColorFormatField(anchor,true);channels.append(input);}
  anchor.parentElement.querySelector('.hex-field').after(channels);
 });
}
function colorFormatValue(anchor){
 const row=anchor.closest('.gradient-color-row');
 if(row){const index=Number(row.dataset.stop);return {color:draft.gradient?.colors[index]||null,alpha:draft.gradient?.alphas[index]??100};}
 if(anchor.closest('#media-color-dialog'))return mediaColorValue||{color:null,alpha:100};
 return editingColor();
}
function colorRGB(hex){return hex.slice(1).match(/../g).map(value=>parseInt(value,16));}
function colorHSL(hex){
 const [r,g,b]=colorRGB(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;
 let h=0,s=0;if(delta){s=delta/(1-Math.abs(2*l-1));h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;h=(h*60+360)%360;}
 return [Math.round(h),Math.round(s*100),Math.round(l*100)];
}
function colorModelHex(values,model){
 let rgb=values;
 if(model==='HSL'){
  const [h,s,l]=[values[0]%360,values[1]/100,values[2]/100],c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  rgb=(h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x]).map(v=>(v+m)*255);
 }
 return '#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function syncColorFormatField(anchor,force=false){
 const model=anchor.dataset.colorModel||'HEX',hex=anchor.parentElement.querySelector('.hex-field'),channels=anchor.parentElement.querySelector('.color-model-channels');if(!channels)return;
 if(anchor.firstChild.textContent!==model)anchor.firstChild.textContent=model;
 anchor.setAttribute('aria-label','Формат цвета: '+model);
 if(hex.hidden!==(model!=='HEX'))hex.hidden=model!=='HEX';if(channels.hidden!==(model==='HEX'))channels.hidden=model==='HEX';
 if(model==='HEX')return;
 const value=colorFormatValue(anchor),values=value.color?(model==='RGB'?colorRGB(value.color):colorHSL(value.color)):['','',''];
 const labels=model==='RGB'?['R','G','B']:['H','S','L'];
 [...channels.children].forEach((input,index)=>{input.min='0';input.max=String(model==='RGB'?255:index===0?360:100);input.setAttribute('aria-label',model+' '+labels[index]);if(force||document.activeElement!==input)input.value=values[index];});
}
function syncColorFormatFields(){prepareColorFormatFields();document.querySelectorAll('.format[data-format-trigger]').forEach(anchor=>syncColorFormatField(anchor));}
function changeColorModelChannels(anchor){
 const model=anchor.dataset.colorModel,inputs=[...anchor.parentElement.querySelector('.color-model-channels').children];
 if(inputs.some(input=>input.value===''||!Number.isFinite(Number(input.value)))){syncColorFormatField(anchor,true);return;}
 const values=inputs.map(input=>Math.round(Math.max(0,Math.min(Number(input.max),Number(input.value))))),color=colorModelHex(values,model),row=anchor.closest('.gradient-color-row');
 if(row){changeGradientStop(Number(row.dataset.stop),{color});update();}
 else if(anchor.closest('#media-color-dialog')){mediaColorValue.color=color;renderMediaColor();}
 else{setEditingColor(color,editingColor().alpha);update();}
 syncColorFormatField(anchor,true);
}
document.addEventListener('click',event=>{
 const anchor=event.target.closest('.format');
 if(anchor){toggleColorFormatMenu(anchor);return;}
 if(!colorFormatMenu.contains(event.target))closeColorFormatMenu();
});
document.addEventListener('keydown',event=>{const anchor=event.target.closest('.format');if(anchor&&(event.key==='Enter'||event.key===' ')){event.preventDefault();toggleColorFormatMenu(anchor);}});
new MutationObserver(()=>{
 syncColorFormatFields();
 if(colorFormatAnchor&&(!colorFormatAnchor.isConnected||!colorFormatAnchor.checkVisibility()))closeColorFormatMenu();
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
window.addEventListener('resize',closeColorFormatMenu);window.addEventListener('scroll',closeColorFormatMenu,true);
syncColorFormatFields();
