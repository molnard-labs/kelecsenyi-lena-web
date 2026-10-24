import {attachBirthInputMask,parseBirthDate} from './astro-datetime.js';
import {createPlacePicker,DEFAULT_BIRTH_PLACE} from './astro-places.js';

const form=document.querySelector('#birth-start-form');
if(form){
  const date=form.querySelector('#start-date'),place=form.querySelector('#start-place');
  const button=form.querySelector('#start-button'),formError=form.querySelector('#start-form-error');
  const apiBase=form.dataset.apiBase.replace(/\/$/,'');
  function errorFor(input,message){
    form.querySelector(`#${input.id}-error`).textContent=message;
    input.setAttribute('aria-invalid',String(Boolean(message)));
  }
  function syncPlace(selection){
    for(const [field,key] of [['place_id','id'],['place_label','label'],['place_timezone','timezone']])form.elements[field].value=selection?.[key]||'';
  }
  const picker=createPlacePicker({input:place,list:form.querySelector('#start-place-options'),status:form.querySelector('#start-place-status'),apiBase,setError:message=>errorFor(place,message),onChange:syncPlace});
  // A history-restored, edited label must never silently revert to Budapest.
  const restored=form.elements.place_id.value;
  if(restored&&form.elements.place_label.value===place.value){
    picker.select({id:restored,label:place.value,timezone:form.elements.place_timezone.value});
  }else if(!place.value||place.value===DEFAULT_BIRTH_PLACE.label){
    picker.select(DEFAULT_BIRTH_PLACE);
  }else syncPlace(null);
  attachBirthInputMask(date,'date');
  date.addEventListener('input',()=>errorFor(date,''));
  date.addEventListener('blur',()=>{const parsed=parseBirthDate(date.value);if(parsed.valid)date.value=parsed.formatted;});
  button.disabled=false;
  form.addEventListener('submit',event=>{
    errorFor(date,'');errorFor(place,'');formError.hidden=true;picker.close();
    const parsed=parseBirthDate(date.value);
    if(!parsed.valid||!picker.selection){
      event.preventDefault();
      if(!picker.selection)errorFor(place,'Válassz egy települést a találati listából.');
      if(!parsed.valid)errorFor(date,'1900 és a mai nap közötti, érvényes dátum szükséges. Például: 1990. 05. 21.');
      (!parsed.valid?date:place).focus();return;
    }
    // Native POST navigation keeps personal input out of URLs and browser storage.
    date.value=parsed.iso;syncPlace(picker.selection);
    button.disabled=true;button.textContent='Tovább az elemzéshez…';
  });
  window.addEventListener('pageshow',()=>{
    button.disabled=false;button.textContent='Tovább a képletemhez →';
    const parsed=parseBirthDate(date.value);if(parsed.valid)date.value=parsed.formatted;
    // Some browsers restore form controls after the initial module evaluation.
    if(picker.selection?.label!==place.value){
      const id=form.elements.place_id.value,label=form.elements.place_label.value,timezone=form.elements.place_timezone.value;
      if(id&&label===place.value)picker.select({id,label,timezone});else picker.reset({clearInput:false});
    }
  });
}
