function bindScreenEyedropper(button,onSelect){
button.disabled=typeof window.EyeDropper!=='function';
button.title=button.disabled?'Системная пипетка недоступна в этом браузере':'Выбрать цвет на экране';
button.setAttribute('aria-pressed','false');
button.onclick=async()=>{
  if(button.getAttribute('aria-pressed')==='true')return;
  hideTooltip();
  button.setAttribute('aria-pressed','true');
  try{
    const {sRGBHex}=await new EyeDropper().open();
    const color=sRGBHex.toUpperCase();
    onSelect(color);
  }catch(error){
    if(error.name!=='AbortError')console.error('Не удалось открыть системную пипетку:',error);
  }finally{
    button.setAttribute('aria-pressed','false');
    button.focus({preventScroll:true});
  }
};
}
bindScreenEyedropper($('#media-color-dialog .icon[aria-label="Пипетка"]'),color=>{mediaColorValue.color=color;renderMediaColor();});
