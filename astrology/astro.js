import {buildReading,degreeLabel} from './astro-interpretation.js';
import {renderWheel} from './astro-wheel.js';
import {attachBirthInputMask,localTodayISO,parseBirthDate,parseBirthTime} from './astro-datetime.js';
import {createPlacePicker,DEFAULT_BIRTH_PLACE} from './astro-places.js';

const $=selector=>document.querySelector(selector);
const apiBase=$('meta[name="lena-api-base"]')?.content.replace(/\/$/,'')||'/api';
const form=$('#birth-form'),dateInput=$('#birth-date'),timeInput=$('#birth-time'),placeInput=$('#birth-place');
const button=$('#calculate-button'),result=$('#chart-result');
let chartController=null,generation=0,foldIdentity='',statusReady=false;
let wheelCleanup=null;
let maximumDate=localTodayISO();

function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function errorFor(input,message){const id=input.id.replace('birth-','');$(`#${id}-error`).textContent=message;input.setAttribute('aria-invalid',String(Boolean(message)));}
function clearErrors(){for(const input of [dateInput,timeInput,placeInput])errorFor(input,'');$('#form-error').hidden=true;$('#form-error').textContent='';}
function hideResult(){result.hidden=true;result.setAttribute('aria-busy','false');wheelCleanup?.();wheelCleanup=null;$('#chart-wheel').replaceChildren();}
function invalidate(){generation++;chartController?.abort();chartController=null;hideResult();$('#fold-choice').hidden=true;$('#fold-options').replaceChildren();foldIdentity='';button.disabled=false;button.textContent='Megnézem a képletem →';$('#form-status').textContent='';clearErrors();}
function showPlaceSelection(place){
  $('#place-selected').hidden=!place;
  $('#place-selected').textContent=place?`${place.label} · ${place.timezone}`:'';
}
const placePicker=createPlacePicker({input:placeInput,list:$('#place-options'),status:$('#place-status'),apiBase,
  setError:message=>errorFor(placeInput,message),onChange:place=>{invalidate();showPlaceSelection(place);}});

for(const input of [dateInput,timeInput,$('#house-system')])input.addEventListener('input',invalidate);
attachBirthInputMask(timeInput,'time');
dateInput.addEventListener('blur',()=>{const parsed=parseBirthDate(dateInput.value,{max:maximumDate});if(parsed.valid)dateInput.value=parsed.formatted;});
timeInput.addEventListener('blur',()=>{const parsed=parseBirthTime(timeInput.value);if(parsed.valid)timeInput.value=parsed.formatted;});
form.addEventListener('change',event=>{if(event.target.name!=='fold')return;generation++;chartController?.abort();chartController=null;hideResult();button.disabled=false;button.textContent='Megnézem a képletem →';$('#form-status').textContent='Az időszámítás megváltozott. Számold újra a képleted.';clearErrors();});

function renderTriad(reading){const container=$('#main-triad');container.replaceChildren();for(const item of reading.triad){const article=node('article','triad-card');const top=node('div','triad-top');top.append(node('span','',item.label),node('span','',degreeLabel(item.position.degree)));article.append(top,node('h3','',item.position.sign),node('p','triad-theme',item.theme),node('p','',item.text));if(item.houseText)article.append(node('p','house-note',item.houseText));container.append(article);}}
function tableRow(values){const tr=node('tr');values.forEach((value,index)=>{const cell=node(index===0?'th':'td','',String(value));if(index===0)cell.setAttribute('scope','row');tr.append(cell);});return tr;}
function renderChart(chart){
  const reading=buildReading(chart),input=chart.input;
  wheelCleanup?.();wheelCleanup=renderWheel(chart,$('#chart-wheel'));
  renderTriad(reading);
  const date=new Date(`${input.date}T12:00:00Z`).toLocaleDateString('hu-HU',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
  $('#result-birth').textContent=`${date} · ${input.time} · ${input.place.label}`;
  $('#synthesis-title').textContent=reading.synthesis.title;$('#synthesis-copy').textContent=reading.synthesis.text;$('#reflection-question').textContent=reading.synthesis.question;
  $('#node-title').textContent=reading.node.title;$('#node-copy').textContent=reading.node.text;
  const aspects=$('#aspects-reading');aspects.replaceChildren();
  if(reading.aspects.length){aspects.append(node('h3','aspects-heading','Két motívum találkozása'));const grid=node('div','aspect-list');for(const a of reading.aspects){const article=node('article','aspect-item');article.append(node('h4','',a.title),node('p','',a.text),node('p','aspect-orb',`A pontos fényszögtől való eltérés: ${degreeLabel(a.orb)}.`));grid.append(article);}aspects.append(grid);}
  const meta=[`${chart.engine.name} ${chart.engine.version}`,chart.engine.ephemeris,'trópusi, geocentrikus képlet',input.house_system_label||input.house_system,'valódi holdcsomópont',chart.engine.timezone_data,`${input.timezone||input.place.timezone} · ${input.utc_offset}`,`UTC: ${input.utc}`,`hely: ${input.place.latitude.toFixed(4)}°, ${input.place.longitude.toFixed(4)}°`];
  $('#calculation-meta').textContent=meta.join(' · ')+(chart.warnings?.length?' '+chart.warnings.join(' '):'');
  const positions=$('#positions-body');positions.replaceChildren();for(const p of chart.planets)positions.append(tableRow([p.name,p.sign,degreeLabel(p.degree),p.house??'—',p.retrograde?'Retrográd':'Direkt']));
  positions.append(tableRow(['Aszcendens',chart.angles.ascendant.sign,degreeLabel(chart.angles.ascendant.degree),'—','—']),tableRow(['MC',chart.angles.midheaven.sign,degreeLabel(chart.angles.midheaven.degree),'—','—']));
  const houses=$('#houses-body');houses.replaceChildren();for(const h of chart.houses)houses.append(tableRow([h.number,h.sign,degreeLabel(h.degree)]));
  $('#positions-details').open=false;result.hidden=false;result.setAttribute('aria-busy','false');$('#result-title').focus({preventScroll:true});result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}

function showServerError(error,identity){const container=$('#form-error');container.textContent=error.message||'A számítás nem sikerült. Kérlek, próbáld újra.';container.hidden=false;if(error.code==='ambiguous_time'&&Array.isArray(error.choices)){foldIdentity=identity;const options=$('#fold-options');options.replaceChildren();for(const choice of error.choices){const label=node('label'),radio=node('input');radio.type='radio';radio.name='fold';radio.value=String(choice.fold);label.append(radio,node('span','',choice.label));options.append(label);}$('#fold-choice').hidden=false;options.querySelector('input')?.focus();}else if(['invalid_time','invalid_datetime','nonexistent_time'].includes(error.code)){errorFor(timeInput,error.message);timeInput.focus();}else if(['invalid_date','date_range'].includes(error.code)){errorFor(dateInput,error.message);dateInput.focus();}else if(error.code==='invalid_place'){errorFor(placeInput,error.message);placeInput.focus();}else{container.tabIndex=-1;container.focus();}}

form.addEventListener('submit',async event=>{
  event.preventDefault();clearErrors();placePicker.close();
  let invalid=null;
  const birthDate=parseBirthDate(dateInput.value,{max:maximumDate}),birthTime=parseBirthTime(timeInput.value);
  if(!placePicker.selection){errorFor(placeInput,'Válassz egy települést a találati listából.');invalid=placeInput;}
  if(!birthTime.valid){errorFor(timeInput,'Érvényes, 24 órás időpont szükséges (00:00–23:59), például: 14:30.');invalid=timeInput;}
  if(!birthDate.valid){errorFor(dateInput,'1900 és a mai nap közötti, érvényes dátum szükséges. Például: 1990. 05. 21.');invalid=dateInput;}
  if(invalid){invalid.focus();return;}
  dateInput.value=birthDate.formatted;timeInput.value=birthTime.formatted;
  const payload={date:birthDate.iso,time:birthTime.iso,place_id:placePicker.selection.id,house_system:$('#house-system').value};
  const identity=JSON.stringify(payload);
  if(!$('#fold-choice').hidden&&foldIdentity===identity){const chosen=form.querySelector('input[name=fold]:checked');if(!chosen){$('#form-error').textContent='Válaszd ki az óraátállítás szerinti időpontot.';$('#form-error').hidden=false;form.querySelector('input[name=fold]')?.focus();return;}payload.fold=Number(chosen.value);}
  const thisGeneration=++generation;chartController?.abort();const controller=new AbortController();chartController=controller;
  button.disabled=true;button.textContent='A képleted készül…';$('#form-status').textContent='Az égi pozíciók kiszámítása folyamatban.';hideResult();
  try{const response=await fetch(`${apiBase}/chart`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal,cache:'no-store'});const chart=await response.json();if(thisGeneration!==generation)return;if(!response.ok){showServerError(chart.error||{},identity);$('#form-status').textContent='';return;}renderChart(chart);$('#form-status').textContent='Elkészült a képleted; az eredmény az űrlap alatt olvasható.';}
  catch(error){if(error.name!=='AbortError'&&thisGeneration===generation){showServerError({message:'A helyi számolószerver nem érhető el. Ellenőrizd, hogy fut-e, majd próbáld újra.'},identity);$('#form-status').textContent='';}}
  finally{if(thisGeneration===generation){button.disabled=false;button.textContent='Újraszámolom a képletem →';chartController=null;}}
});

$('#edit-data').addEventListener('click',()=>{dateInput.focus({preventScroll:true});form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});});
$('#clear-data').addEventListener('click',()=>{invalidate();form.reset();placePicker.reset({notify:false});showPlaceSelection(null);for(const selector of ['#main-triad','#positions-body','#houses-body','#result-birth','#synthesis-title','#synthesis-copy','#reflection-question','#node-title','#node-copy','#aspects-reading','#calculation-meta'])$(selector).replaceChildren();$('.form-lead').textContent=defaultFormLead;$('.step-number').textContent='01';$('#form-status').textContent='Az adatok és az eredmény törölve.';dateInput.focus();
  // Replace the POST navigation with a real GET so Reload cannot resubmit cleared data.
  if(receivedPrefill)window.location.replace(window.location.pathname);
});

fetch(`${apiBase}/status`,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(status=>{statusReady=status.ready;if(status.date_range?.max)maximumDate=status.date_range.max;if(!statusReady)throw new Error();}).catch(()=>{const error=$('#form-error');error.textContent='A számolószolgáltatás átmenetileg nem érhető el. Kérlek, próbáld újra rövidesen.';error.hidden=false;});

// POST prefill lives only in this response and the form, never in a URL or storage.
const defaultFormLead=$('.form-lead').textContent;
const prefillElement=$('#birth-prefill');
const receivedPrefill=Boolean(prefillElement);
let prefill=null;
try{prefill=prefillElement?JSON.parse(prefillElement.textContent):null;}catch{}
prefillElement?.remove();
if(prefill?.error){
  $('#form-error').textContent=prefill.error;$('#form-error').hidden=false;
  $('#form-error').tabIndex=-1;$('#form-error').focus();
}else{
  const initialPlace=prefill?.place||DEFAULT_BIRTH_PLACE;
  placePicker.select(initialPlace,{notify:false});showPlaceSelection(initialPlace);
  const initialDate=prefill?parseBirthDate(prefill.date,{max:maximumDate}):null;
  if(initialDate?.valid){
    dateInput.value=initialDate.formatted;
    $('.step-number').textContent='02';
    $('.form-lead').textContent='A dátumot és a születési helyet átvettük. Add meg a születési órát és percet, és elkészítjük a képletedet. Minden adatot módosíthatsz.';
    timeInput.focus();
  }
}
prefill=null;
attachBirthInputMask(dateInput,'date');
