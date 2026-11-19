let mediaColorValue=null,mediaColorSnapshot=null,mediaColorHSV=null;
let colorDialogOptions=null;
const colorDialogHistoryPinned=new Set();
// One value editor shared by image styles, gradient stops and future color fields.
const isPlainColor=value=>!!value.color&&!value.gradient&&!value.texture&&!Number(value.blur||0)&&value.mode!=='media';
const mediaColorDialog=document.createElement('section');mediaColorDialog.id='media-color-dialog';mediaColorDialog.className='dialog';mediaColorDialog.hidden=true;mediaColorDialog.setAttribute('role','dialog');mediaColorDialog.setAttribute('aria-label','Цвет градиента картинки');
mediaColorDialog.innerHTML=`<header><span class="title">Цвет</span><div class="commands"><button class="icon" aria-label="Пипетка" disabled><img src="assets/eyedropper.svg" alt=""></button><button id="media-color-reset" class="icon" aria-label="Сбросить цвет"><span class="media-glyph large">&#xE629;</span></button><button id="media-color-apply" class="icon success" aria-label="Применить цвет"><img src="assets/save.svg" alt=""></button></div><button id="media-color-close" class="close" aria-label="Отменить выбор цвета"><img src="assets/close.svg" alt=""></button></header><div class="content"><div class="value-card"><div id="media-color-preview" class="preview"><span class="preview-fill"></span></div><button id="media-color-pin" class="pin" aria-label="Добавить в Мои цвета"><img src="assets/pin.svg" alt=""></button><div class="fields"><span class="format">HEX<img src="assets/arrow.svg" alt=""></span><span class="hex-field"><span>#</span><input id="media-color-hex" aria-label="HEX цвета градиента" maxlength="6"></span><label><input id="media-color-alpha" type="number" min="0" max="100" aria-label="Непрозрачность цвета градиента">%</label></div></div><div id="media-color-palette-card" class="palette-card"><div id="media-color-palette" class="palette"></div><footer><button id="media-color-other">Другой цвет</button></footer></div></div><section id="media-color-picker" class="picker-card" hidden><div class="picker-heading"><button id="media-color-back" class="back-round" aria-label="Вернуться к палитре"><img src="assets/picker-back.svg" alt=""></button><span>Другой цвет</span></div><div class="picker-controls"><div id="media-color-sv" class="sv-picker" tabindex="0" role="slider" aria-label="Насыщенность и яркость"><span class="sv-thumb"></span></div><div id="media-color-hue" class="picker-rail" tabindex="0" role="slider" aria-label="Оттенок"><div class="hue-track"></div><span class="rail-thumb"></span></div><div id="media-color-opacity" class="picker-rail" tabindex="0" role="slider" aria-label="Непрозрачность"><div class="opacity-track"></div><span class="rail-thumb"></span></div></div></section>`;
$('#dialog').append(mediaColorDialog);
mediaColorDialog.setAttribute('aria-label','Цвет');
$('#media-color-hex').setAttribute('aria-label','HEX выбранного цвета');
$('#media-color-alpha').setAttribute('aria-label','Непрозрачность выбранного цвета');
const colorMine=document.createElement('div');colorMine.id='color-dialog-mine';colorMine.hidden=true;
colorMine.innerHTML='<div class="color-group-title">Мои</div><div class="palette" id="color-dialog-mine-colors"></div><div class="color-group-title palette-title">Палитра</div>';
$('#media-color-palette-card').prepend(colorMine);
const colorHistory=document.createElement('div');colorHistory.id='color-dialog-history';colorHistory.className='picker-history';colorHistory.hidden=true;
colorHistory.innerHTML='<div class="color-group-title">Ранее использовались</div><div id="color-dialog-history-colors" class="palette"></div>';
$('#media-color-picker').append(colorHistory);
function openColorDialog({value,anchor,onConfirm,title='Цвет',...options}){
  if(typeof finishColorHeadingEdit==='function')finishColorHeadingEdit();
  colorDialogHistoryPinned.clear();
  hideTooltip();$('#mine-menu').hidden=true;
  colorDialogOptions={...options,anchor,onConfirm};
  (options.host||$('#dialog')).append(mediaColorDialog);
  mediaColorDialog.classList.toggle('standalone-color-dialog',!!options.standalone);
  mediaColorDialog.classList.toggle('color-picker-only',!!options.pickerOnly);
  mediaColorDialog.classList.toggle('color-variable-dialog',!!options.variable);
  mediaColorValue={color:value.color?.toUpperCase()??null,alpha:value.alpha??100};mediaColorSnapshot={...mediaColorValue};mediaColorHSV=hexToHSV(mediaColorValue.color||'#FFFFFF');
  mediaColorDialog.querySelector('.title').textContent=title;mediaColorDialog.setAttribute('aria-label',title);
  let variableName=mediaColorDialog.querySelector('.color-variable-name');
  if(!variableName){variableName=document.createElement('span');variableName.className='color-variable-name';mediaColorDialog.querySelector('.title').after(variableName);}
  variableName.textContent=options.variable||'';variableName.hidden=!options.variable;
  if(typeof configureColorHeading==='function')configureColorHeading(options);
  $('#media-color-palette-card').hidden=!!options.pickerOnly;$('#media-color-picker').hidden=!options.pickerOnly;
  const palette=$('#media-color-palette');palette.replaceChildren();
  for(const color of [...options.allowNone?[null]:[],...(options.palette||colors.filter(Boolean))]){const button=document.createElement('button');button.className='swatch';button.classList.toggle('no-color',color===null);button.style.background=color||'#fff';attachTooltip(button,{color,alpha:100});button.onclick=()=>{mediaColorValue={color,alpha:100};saveMediaColor({fromPalette:true});};palette.append(button);}
  $('#media-color-reset').hidden=!!options.pickerOnly;$('#media-color-pin').hidden=!!options.pickerOnly;
  if(typeof renderColorUsage==='function')renderColorUsage(options);
  mediaColorDialog.hidden=false;renderMediaColor();renderColorCollections();positionColorDialog();
}
function positionColorDialog(){
  if(!colorDialogOptions||mediaColorDialog.hidden)return;
  if(colorDialogOptions.position){mediaColorDialog.style.left=colorDialogOptions.position.left+'px';mediaColorDialog.style.top=colorDialogOptions.position.top+'px';mediaColorDialog.style.right='auto';return;}
  placeMediaPopup(mediaColorDialog,colorDialogOptions.anchor,{left:-16,top:-56,width:366,height:mediaColorDialog.offsetHeight});
}
function closeColorDialog(){
  if(typeof finishColorHeadingEdit==='function')finishColorHeadingEdit();
  mediaColorDialog.hidden=true;hideTooltip();
  if($('#mine-menu').parentElement===mediaColorDialog){$('#mine-menu').hidden=true;$('#dialog').append($('#mine-menu'));mineContext=null;}
  const anchor=colorDialogOptions?.anchor,onClose=colorDialogOptions?.onClose;colorDialogOptions=null;
  if(anchor?.isConnected&&!$('#dialog').hidden)anchor.focus({preventScroll:true});
  if(onClose)onClose();
}
function selectDialogColor(value){mediaColorValue={color:value.color,alpha:value.alpha};saveMediaColor();}
function retainColorDialogHistory(value){
  if(!mediaColorDialog.hidden&&!$('#media-color-picker').hidden&&!colorDialogOptions?.hideCollections&&isPlainColor(value)&&getHistoryColors().some(item=>colorKey(item)===colorKey(value)))colorDialogHistoryPinned.add(colorKey(value));
}
function renderColorCollections(){
  if(mediaColorDialog.hidden)return;
  const values=getSavedColors().filter(isPlainColor),list=$('#color-dialog-mine-colors');list.replaceChildren();colorMine.hidden=values.length===0;
  for(const value of values.slice(0,19))list.append(savedSwatch(value,selectDialogColor));
  if(values.length){const more=document.createElement('button');more.className='mine-more';more.setAttribute('aria-label','Все мои цвета');more.title='Все мои цвета';more.onclick=()=>{if(!$('#mine-menu').hidden&&$('#mine-menu').parentElement===mediaColorDialog)$('#mine-menu').hidden=true;else openMine({host:mediaColorDialog,filter:isPlainColor,select:selectDialogColor});};list.append(more);}
  const history=getHistoryColors().filter(value=>isPlainColor(value)&&(!isSaved(value)||colorDialogHistoryPinned.has(colorKey(value))));
  colorHistory.hidden=history.length===0;
  if(colorDialogOptions?.hideCollections){colorMine.hidden=true;colorHistory.hidden=true;}
  $('#color-dialog-history-colors').replaceChildren(...history.map(value=>savedSwatch(value,selectDialogColor)));
  positionColorDialog();
}
function renderMediaColor(syncHSV=true){
  if(!mediaColorValue)return;
  if(syncHSV)mediaColorHSV=hexToHSV(mediaColorValue.color||'#FFFFFF');
  $('#media-color-hex').value=mediaColorValue.color?.slice(1)||'';$('#media-color-alpha').value=mediaColorValue.alpha;
  $('#media-color-preview').classList.toggle('no-color',mediaColorValue.color===null);
  $('#media-color-preview').style.setProperty('--preview-color',mediaColorValue.color||'#fff');$('#media-color-preview').style.setProperty('--preview-alpha',mediaColorValue.alpha/100);
  $('#media-color-pin').hidden=!!colorDialogOptions?.pickerOnly||mediaColorValue.color===null;
  const pinned=isSaved(mediaColorValue),pin=$('#media-color-pin'),action=pinned?'Удалить из Моих цветов':'Добавить в Мои цвета';pin.setAttribute('aria-pressed',String(pinned));pin.setAttribute('aria-label',action);pin.title=action;pin.querySelector('img').src=pinned?'assets/unpin.svg':'assets/pin.svg';
  $('#media-color-reset').disabled=colorKey(mediaColorValue)===colorKey(mediaColorSnapshot);
  const hsv=mediaColorHSV;
  $('#media-color-sv').style.setProperty('--hue-color',`hsl(${hsv.h} 100% 50%)`);$('#media-color-sv .sv-thumb').style.left=hsv.s*100+'%';$('#media-color-sv .sv-thumb').style.top=(1-hsv.v)*100+'%';$('#media-color-sv .sv-thumb').style.borderColor=hsv.v>.6?'#222':'#fff';
  $('#media-color-hue .rail-thumb').style.top=hsv.h/360*246+'px';$('#media-color-hue .rail-thumb').style.background=`hsl(${hsv.h} 100% 50%)`;
  $('#media-color-opacity').style.setProperty('--opacity-color',mediaColorValue.color||'#FFFFFF');$('#media-color-opacity .rail-thumb').style.top=(1-mediaColorValue.alpha/100)*246+'px';$('#media-color-opacity .rail-thumb').style.background=mediaColorValue.color||'#FFFFFF';
  if(typeof syncColorFormatFields==='function')syncColorFormatFields();
}
function saveMediaColor({fromPalette=false}={}){
  if(!colorDialogOptions)return;
  const value={...mediaColorValue},confirm=colorDialogOptions.onConfirm;
  if(!fromPalette)remember(value);closeColorDialog();confirm(value);renderSaved();
}
$('#media-color-apply').onclick=saveMediaColor;
$('#media-color-close').onclick=closeColorDialog;
$('#media-color-reset').onclick=()=>{mediaColorValue={...mediaColorSnapshot};renderMediaColor();};
$('#media-color-pin').onclick=()=>{toggleSaved({...mediaColorValue});renderMediaColor(false);};
$('#media-color-hex').oninput=event=>{
  const input=event.target,start=input.selectionStart,end=input.selectionEnd;
  input.value=input.value.toUpperCase();
  input.setSelectionRange(start,end);
};
$('#media-color-hex').onchange=event=>{const v=event.target.value.replace(/[^a-f0-9]/gi,'');if(v)mediaColorValue.color='#'+v.repeat(6).slice(0,6).toUpperCase();renderMediaColor();};
$('#media-color-alpha').oninput=event=>{mediaColorValue.alpha=Math.round(Math.max(0,Math.min(100,Number(event.target.value)||0)));renderMediaColor(false);};
$('#media-color-other').onclick=$('#media-color-preview').onclick=()=>{$('#mine-menu').hidden=true;$('#media-color-palette-card').hidden=true;$('#media-color-picker').hidden=false;renderColorCollections();};
$('#media-color-back').onclick=()=>{$('#media-color-palette-card').hidden=false;$('#media-color-picker').hidden=true;positionColorDialog();};
function changeMediaColorHSV(){mediaColorValue.color=hsvToHex(mediaColorHSV);renderMediaColor(false);}
for(const kind of ['sv','hue','opacity']){
  const element=$('#media-color-'+kind);let pointer=null;
  const move=event=>{const rect=element.getBoundingClientRect(),x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),inset=kind==='sv'?0:12,y=Math.max(0,Math.min(1,(event.clientY-rect.top-inset)/(rect.height-inset*2)));if(kind==='sv'){mediaColorHSV.s=x;mediaColorHSV.v=1-y;}else if(kind==='hue')mediaColorHSV.h=y*359.99;else mediaColorValue.alpha=Math.round((1-y)*100);if(kind==='opacity')renderMediaColor(false);else changeMediaColorHSV();event.preventDefault();};
  element.onpointerdown=event=>{if(event.button!==0)return;pointer=event.pointerId;element.setPointerCapture(pointer);element.focus();move(event);};element.onpointermove=event=>{if(pointer===event.pointerId)move(event);};element.onpointerup=element.onpointercancel=()=>pointer=null;
  element.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const step=event.shiftKey?10:1;if(kind==='sv'){if(event.key==='ArrowLeft')mediaColorHSV.s=Math.max(0,mediaColorHSV.s-step/100);if(event.key==='ArrowRight')mediaColorHSV.s=Math.min(1,mediaColorHSV.s+step/100);if(event.key==='ArrowUp')mediaColorHSV.v=Math.min(1,mediaColorHSV.v+step/100);if(event.key==='ArrowDown')mediaColorHSV.v=Math.max(0,mediaColorHSV.v-step/100);}else if(kind==='hue')mediaColorHSV.h=Math.max(0,Math.min(359.99,mediaColorHSV.h+(event.key==='ArrowUp'?-step:step)));else mediaColorValue.alpha=Math.max(0,Math.min(100,mediaColorValue.alpha+(event.key==='ArrowUp'?step:-step)));if(kind==='opacity')renderMediaColor(false);else changeMediaColorHSV();};
}
document.addEventListener('color-collection-change',()=>{if(!mediaColorDialog.hidden){renderColorCollections();renderMediaColor(false);}});
new MutationObserver(()=>{if($('#dialog').hidden&&!colorDialogOptions?.standalone)closeColorDialog();}).observe($('#dialog'),{attributes:true,attributeFilter:['hidden']});
