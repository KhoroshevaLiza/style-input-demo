// Color collections and tooltips from the background demo.
const savedColors=[];
const historyColors=[];
const seededHistoryFixtures=new Set();
const pickerHistoryPinned=new Set();
// Scenario fixtures seed a collection on its first edit, preserving session data.
const collectionDisplay={savedFallback:[],historyFallback:[],hiddenSaved:new Set(),hiddenHistory:new Set(),savedEdited:false,historyEdited:false};
const getSavedColors=()=>((savedColors.length||collectionDisplay.savedEdited)?savedColors:collectionDisplay.savedFallback).filter(value=>!collectionDisplay.hiddenSaved.has(colorKey(value)));
const getHistoryColors=()=>((historyColors.length||collectionDisplay.historyEdited)?historyColors:collectionDisplay.historyFallback).filter(value=>!collectionDisplay.hiddenHistory.has(colorKey(value)));
let menuSavedRows=[],menuHistoryRows=[];
let mineContext=null;
const colorKey=value=>`${value.color}:${value.alpha}:${value.texture||0}:${value.blur||0}:${JSON.stringify(value.gradient?{...value.gradient,presetReversed:undefined}:null)}`;
const isSaved=value=>getSavedColors().some(item=>colorKey(item)===colorKey(value));
const colorLabel=value=>value.gradient?value.gradient.colors.map((color,index)=>`${color}${value.gradient.alphas[index]<100?", "+value.gradient.alphas[index]/100:""}`).join(" → "):`${value.color}${value.alpha<100?', '+Number((value.alpha/100).toFixed(2)):''}`;
let tooltipValue=null,tooltipAnchor=null,tooltipShowTimer,tooltipHideTimer;
function hideTooltip(){
  clearTimeout(tooltipShowTimer);clearTimeout(tooltipHideTimer);
  $('#color-tooltip').hidden=true;
  if(tooltipAnchor)tooltipAnchor.removeAttribute('aria-describedby');
  tooltipAnchor=null;tooltipValue=null;
}
function syncTooltip(){
  if(!tooltipValue)return;
  const pinned=isSaved(tooltipValue),empty=tooltipValue.color===null;
  $('#tooltip-value').textContent=empty?'Без цвета':colorLabel(tooltipValue);
  if(tooltipValue.gradient){
    const label=$('#tooltip-value');label.replaceChildren();
    tooltipValue.gradient.colors.forEach((color,index)=>{
      if(index){const arrow=document.createElement('span');arrow.className='gradient-transition';const icon=document.createElement('img');icon.src='assets/gradient-transition.png';icon.alt='→';arrow.append(icon);label.append(arrow);}
      const text=document.createElement('span'),alpha=tooltipValue.gradient.alphas[index];
      text.textContent=color+(alpha<100?', '+Number((alpha/100).toFixed(2)):'');label.append(text);
    });
  }
  $('#tooltip-pin').hidden=empty;
  $('#tooltip-pin').setAttribute('aria-label',pinned?'Удалить из Моих цветов':'Добавить в Мои цвета');
  $('#tooltip-pin').title=pinned?'Удалить из Моих цветов':'Добавить в Мои цвета';
  $('#tooltip-pin').setAttribute('aria-pressed',String(pinned));
  $('#tooltip-pin-icon').src=pinned?'assets/unpin.svg':'assets/pin.svg';
}
function showTooltip(anchor,value){
  clearTimeout(tooltipShowTimer);clearTimeout(tooltipHideTimer);
  if(tooltipAnchor&&tooltipAnchor!==anchor)tooltipAnchor.removeAttribute('aria-describedby');
  tooltipAnchor=anchor;tooltipValue={...value};syncTooltip();
  anchor.setAttribute('aria-describedby','color-tooltip');
  const popup=$('#color-tooltip');popup.hidden=false;
  const rect=anchor.getBoundingClientRect(),width=popup.offsetWidth,height=popup.offsetHeight;
  const left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left+rect.width/2-width/2));
  const below=rect.top<height+18;
  popup.classList.toggle('tooltip-below',below);
  popup.style.left=left+'px';popup.style.top=(below?rect.bottom+12:rect.top-height-12)+'px';
  popup.style.setProperty('--nose-x',Math.max(14,Math.min(width-14,rect.left+rect.width/2-left))+'px');
}
function scheduleTooltipHide(){clearTimeout(tooltipShowTimer);clearTimeout(tooltipHideTimer);tooltipHideTimer=setTimeout(hideTooltip,180);}
function attachTooltip(button,value){
  button.title='';button.setAttribute('aria-label',value.color===null?'Без цвета':colorLabel(value));
  if(value.color===null){button.onpointerenter=hideTooltip;button.onfocus=hideTooltip;return;}
  button.onpointerenter=()=>{clearTimeout(tooltipHideTimer);clearTimeout(tooltipShowTimer);tooltipShowTimer=setTimeout(()=>showTooltip(button,value),250);};
  button.onpointerleave=scheduleTooltipHide;
  button.onfocus=()=>showTooltip(button,value);
  button.onblur=event=>{if(!$('#color-tooltip').contains(event.relatedTarget))scheduleTooltipHide();};
}
$('#color-tooltip').onpointerenter=()=>{clearTimeout(tooltipHideTimer);};
$('#color-tooltip').onpointerleave=scheduleTooltipHide;
$('#color-tooltip').onfocusin=()=>{clearTimeout(tooltipHideTimer);};
$('#color-tooltip').onfocusout=event=>{if(!$('#color-tooltip').contains(event.relatedTarget))scheduleTooltipHide();};
$('#tooltip-pin').onclick=event=>{event.stopPropagation();if(tooltipValue&&tooltipValue.color!==null){clearTimeout(tooltipHideTimer);toggleSaved({...tooltipValue});hideTooltip();}};
window.addEventListener('resize',hideTooltip);
window.addEventListener('scroll',hideTooltip,true);
function seedHistoryFallback(){
  const additions=collectionDisplay.historyFallback.filter(value=>!seededHistoryFixtures.has(colorKey(value))&&!historyColors.some(item=>colorKey(item)===colorKey(value)));
  collectionDisplay.historyFallback.forEach(value=>seededHistoryFixtures.add(colorKey(value)));
  historyColors.push(...structuredClone(additions));
}
function remember(value){
  if(value.color===null)return;
  if(!historyColors.length&&!collectionDisplay.historyEdited)seedHistoryFallback();
  collectionDisplay.historyEdited=true;collectionDisplay.hiddenHistory.delete(colorKey(value));
  const index=historyColors.findIndex(item=>colorKey(item)===colorKey(value));
  if(index>=0)historyColors.splice(index,1);
  historyColors.unshift({...value});historyColors.length=Math.min(historyColors.length,10);
  document.dispatchEvent(new Event('color-collection-change'));
}
function openMine(context=null){
  mineContext=context;
  const filter=context?.filter||(()=>true);
  (context?.host||$('#dialog')).append($('#mine-menu'));
  menuSavedRows=getSavedColors().filter(filter).map(value=>({...value}));
  menuHistoryRows=getHistoryColors().filter(value=>filter(value)&&!isSaved(value)).map(value=>({...value}));
  renderMenu();$('#mine-menu').hidden=false;
}
function toggleSaved(value){
  if(value.color===null)return;
  const pinned=isSaved(value);
  if(!pinned){
    if(activeScreen==='picker'&&!gradientPicker&&!$('#dialog').hidden&&getHistoryColors().some(item=>colorKey(item)===colorKey(value)))pickerHistoryPinned.add(colorKey(value));
    if(typeof retainColorDialogHistory==='function')retainColorDialogHistory(value);
  }
  if(!savedColors.length&&!collectionDisplay.savedEdited)savedColors.push(...structuredClone(getSavedColors()));
  collectionDisplay.savedEdited=true;collectionDisplay.hiddenSaved.delete(colorKey(value));
  const index=savedColors.findIndex(item=>colorKey(item)===colorKey(value));
  if(!pinned){
    if(index<0)savedColors.unshift({...value});
  }else{
    savedColors.splice(index,1);remember(value);
    menuSavedRows=menuSavedRows.filter(item=>colorKey(item)!==colorKey(value));
    if(!menuHistoryRows.some(item=>colorKey(item)===colorKey(value)))menuHistoryRows.unshift({...value});
  }
  renderSaved();syncPin();syncTooltip();
  if(activeScreen==='picker')renderPickerHistory();
  if(!$('#mine-menu').hidden)renderMenu();
  document.dispatchEvent(new Event('color-collection-change'));
}
function syncPin(){
  const pinned=isSaved(draft);
  $('.pin').setAttribute('aria-pressed',String(pinned));
  $('.pin').setAttribute('aria-label',pinned?'Удалить из Моих цветов':'Добавить в Мои цвета');
  $('.pin').title=pinned?'Удалить из Моих цветов':'Добавить в Мои цвета';
  $('.pin img').src=pinned?'assets/unpin.svg':'assets/pin.svg';
}
function savedSwatch(value,onSelect){
  const button=document.createElement('button');
  button.className='swatch saved-swatch';
  button.style.setProperty('--saved-color',value.gradient?gradientCSS(value):value.color);
  button.style.setProperty('--saved-solid',value.gradient?gradientCSS(value,true):value.color);
  button.classList.toggle('gradient-swatch',!!value.gradient);
  button.style.setProperty('--saved-alpha',value.gradient?1:value.alpha/100);
  const fill=document.createElement('span');fill.className='saved-swatch-fill';fill.style.filter=`blur(${(value.blur||0)/2}px)`;
  const pattern=document.createElement('span');pattern.className='texture-overlay';styleTexture(pattern,{...value,blur:0});fill.append(pattern);button.append(fill);
  if(value.swatchTextureSize){pattern.style.maskSize=value.swatchTextureSize;pattern.style.webkitMaskSize=value.swatchTextureSize;}
  attachTooltip(button,value);
  button.onclick=()=>{if(onSelect)onSelect(value);else{draft={...value};update();commit();}};
  return button;
}
function renderSaved(){
  const values=getSavedColors(),hasValues=values.length>0;
  $('#mine-block').hidden=!hasValues;
  $('#mine').replaceChildren();
  for(const value of values.slice(0,19))$('#mine').append(savedSwatch(value));
  if(hasValues){
    const more=document.createElement('button');more.className='mine-more';more.setAttribute('aria-label','Все мои цвета');more.title='Все мои цвета';
    more.onclick=()=>{if($('#mine-menu').hidden)openMine();else $('#mine-menu').hidden=true;};$('#mine').append(more);
  }else if(menuSavedRows.length===0&&menuHistoryRows.length===0)$('#mine-menu').hidden=true;
}
function moveSaved(value,direction){
  const index=menuSavedRows.findIndex(item=>colorKey(item)===colorKey(value));
  const target=index+direction;
  if(index<0||target<0||target>=menuSavedRows.length)return;
  if(!savedColors.length&&!collectionDisplay.savedEdited)savedColors.push(...getSavedColors().map(value=>({...value})));
  collectionDisplay.savedEdited=true;
  const from=savedColors.findIndex(item=>colorKey(item)===colorKey(value));
  const to=savedColors.findIndex(item=>colorKey(item)===colorKey(menuSavedRows[target]));
  if(from<0||to<0)return;
  [savedColors[from],savedColors[to]]=[savedColors[to],savedColors[from]];
  [menuSavedRows[index],menuSavedRows[target]]=[menuSavedRows[target],menuSavedRows[index]];
  renderSaved();renderMenu();
  document.dispatchEvent(new Event('color-collection-change'));
}
function renderMenu(){
  $('#mine-list').replaceChildren();
  const addRow=value=>{
    const row=document.createElement('div');row.className='mine-row';
    const name=document.createElement('button');name.className='mine-value';name.textContent=colorLabel(value);
    if(value.gradient){
      name.replaceChildren();
      value.gradient.colors.forEach((color,index)=>{
        if(index){const arrow=document.createElement('span');arrow.className='gradient-transition';const icon=document.createElement('img');icon.src='assets/gradient-transition.png';icon.alt='→';arrow.append(icon);name.append(arrow);}
        const text=document.createElement('span'),alpha=value.gradient.alphas[index];text.textContent=color+(alpha<100?', '+Number((alpha/100).toFixed(2)):'');name.append(text);
      });
    }
    const select=mineContext?.select;
    name.onclick=()=>{if(select)select(value);else{draft={...value};update();commit();}};
    const pinned=isSaved(value),action=pinned?'Удалить из Моих цветов':'Добавить в Мои цвета';
    const remove=document.createElement('button');remove.className='mine-remove';remove.setAttribute('aria-label',`${action} ${name.textContent}`);remove.setAttribute('aria-pressed',String(pinned));remove.title=action;
    const removeIcon=document.createElement('img');removeIcon.src=pinned?'assets/unpin.svg':'assets/pin.svg';removeIcon.alt='';remove.append(removeIcon);
    remove.onclick=()=>toggleSaved(value);
    const commands=document.createElement('div');commands.className='mine-row-commands';
    const savedIndex=menuSavedRows.findIndex(item=>colorKey(item)===colorKey(value));
    if(pinned&&savedIndex>=0){
      for(const [direction,label] of [[1,'Переместить вниз'],[-1,'Переместить вверх']]){
        if(savedIndex+direction<0||savedIndex+direction>=menuSavedRows.length)continue;
        const move=document.createElement('button');move.className='mine-move '+(direction===1?'move-down':'move-up');
        move.title=label;move.setAttribute('aria-label',`${label} ${colorLabel(value)}`);
        const arrow=document.createElement('img');arrow.src=direction===1?'assets/down.svg':'assets/up.svg';arrow.alt='';move.append(arrow);
        move.onclick=()=>moveSaved(value,direction);commands.append(move);
      }
    }
    commands.append(remove);
    row.append(savedSwatch(value,select),name,commands);$('#mine-list').append(row);
  };
  menuSavedRows.forEach(addRow);
  if(menuHistoryRows.length){
    const divider=document.createElement('div');divider.className='mine-history-divider';
    const caption=document.createElement('span');caption.textContent='Ранее использовались';divider.append(caption);$('#mine-list').append(divider);
    menuHistoryRows.forEach(addRow);
  }
}
$('.pin').onclick=()=>toggleSaved(draft);
$('#mine-close').onclick=()=>{$('#mine-menu').hidden=true;};
function hexToHSV(hex){
  const [r,g,b]=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  let h=pickerHSV.h;
  if(delta){h=max===r?60*((g-b)/delta%6):max===g?60*((b-r)/delta+2):60*((r-g)/delta+4);h=(h+360)%360;}
  return{h,s:max?delta/max:0,v:max};
}
function hsvToHex({h,s,v}){
  const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
  const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+rgb.map(channel=>Math.round((channel+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}
