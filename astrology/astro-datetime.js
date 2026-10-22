// Calendar-only parsing keeps the entered local birth time independent of browser locale.
const pad=value=>String(value).padStart(2,'0');
export function localTodayISO(now=new Date()){
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
function invalid(reason){return {valid:false,reason};}

export function parseBirthDate(value,{min='1900-01-01',max=localTodayISO()}={}){
  const text=String(value??'').trim();
  if(!text)return invalid('empty');
  // Hungarian year-first notation, pasted ISO dates, or eight numeric keystrokes.
  const parts=text.match(/^(\d{4})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?$/)
    ||text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    ||text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if(!parts)return invalid('format');
  const year=Number(parts[1]),month=Number(parts[2]),day=Number(parts[3]);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1])return invalid('calendar');
  const iso=`${parts[1]}-${pad(month)}-${pad(day)}`;
  if(iso<min||iso>max)return invalid('range');
  return {valid:true,iso,formatted:`${parts[1]}. ${pad(month)}. ${pad(day)}.`};
}

export function parseBirthTime(value){
  const text=String(value??'').trim();
  if(!text)return invalid('empty');
  const parts=text.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/)
    ||text.match(/^(\d{1,2})(\d{2})$/);
  if(!parts)return invalid('format');
  const hour=Number(parts[1]),minute=Number(parts[2]);
  if(hour>23||minute>59)return invalid('range');
  const formatted=`${pad(hour)}:${pad(minute)}`;
  return {valid:true,iso:formatted,formatted};
}

const maskLimits={date:8,time:4};
const asciiDigits=value=>String(value??'').replace(/[０-９]/g,character=>String(character.charCodeAt(0)-0xff10));
const digitCount=value=>(String(value).match(/\d/g)||[]).length;
function maskLimit(kind){if(!(kind in maskLimits))throw new TypeError('Unknown birth-input mask');return maskLimits[kind];}

// The value contains only entered digits and the punctuation for completed groups.
// The empty field keeps its readable ÉÉÉÉ. HH. NN. / ÓÓ:PP placeholder.
export function formatBirthDigits(value,kind){
  const digits=asciiDigits(value).replace(/\D/g,'').slice(0,maskLimit(kind));
  if(kind==='time')return digits.length<2?digits:`${digits.slice(0,2)}:${digits.slice(2)}`;
  if(digits.length<4)return digits;
  let formatted=`${digits.slice(0,4)}. ${digits.slice(4,6)}`;
  if(digits.length>=6)formatted+=`. ${digits.slice(6,8)}`;
  if(digits.length===8)formatted+='.';
  return formatted;
}

function pastedDigits(value,kind){
  const text=asciiDigits(value).trim();
  if(!text)return '';
  // Recognize complete year-first dates and 24-hour times before removing their
  // separators. A pasted one-digit month/hour gets its explicit leading zero.
  const parts=kind==='date'
    ?text.match(/^(\d{4})(?:\s*\.\s*|-)(\d{1,2})(?:\s*\.\s*|-)(\d{1,2})\s*\.?$/)
    :text.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
  if(parts)return kind==='date'?`${parts[1]}${pad(parts[2])}${pad(parts[3])}`:`${pad(parts[1])}${pad(parts[2])}`;
  const partial=kind==='date'?/^\d{0,4}(?:\. ?\d{0,2}(?:\. ?\d{0,2}\.?)?)?$/:/^\d{0,2}:\d{0,2}$/;
  if(partial.test(text))return text.replace(/\D/g,'');
  if(!/^\d+$/.test(text))return null;
  if(text.length>maskLimit(kind))return null;
  return kind==='time'&&text.length===3?`0${text}`:text;
}

function caretAfterDigits(value,count){
  if(count<=0)return 0;
  let seen=0,index=0;
  for(;index<value.length;index++)if(/\d/.test(value[index])&&++seen===count){index++;break;}
  while(index<value.length&&!/\d/.test(value[index]))index++;
  return index;
}

// Pure edit operations let keyboard, paste and mobile beforeinput share exactly
// the same digit positions. Generated dots/spaces/colon are never editable data.
export function editBirthInput({value='',start=value.length,end=start,inputType='insertText',data=''},kind){
  const limit=maskLimit(kind),digits=asciiDigits(value).replace(/\D/g,'').slice(0,limit);
  start=Math.max(0,Math.min(value.length,start));end=Math.max(start,Math.min(value.length,end));
  let from=digitCount(value.slice(0,start)),to=digitCount(value.slice(0,end)),insert='';
  if(inputType.startsWith('delete')){
    if(from===to&&start===end){
      if(inputType==='deleteContentBackward')from=Math.max(0,from-1);
      else if(inputType==='deleteContentForward')to=Math.min(digits.length,to+1);
    }
  }else if(inputType.startsWith('insert')){
    const isPaste=inputType==='insertFromPaste'||inputType==='insertReplacementText';
    insert=isPaste?pastedDigits(data,kind):asciiDigits(data).replace(/\D/g,'');
    if(insert===null||(!insert&&String(data)))return {value,start,end,changed:false};
    const available=limit-(digits.length-(to-from));
    // Do not silently turn an overlong pasted birth time/date into a valid one.
    if(isPaste&&insert.length>available)return {value,start,end,changed:false};
    insert=insert.slice(0,Math.max(0,available));
    if(!insert&&from===to)return {value,start,end,changed:false};
  }else return {value,start,end,changed:false};
  const next=formatBirthDigits(digits.slice(0,from)+insert+digits.slice(to),kind);
  const caret=caretAfterDigits(next,from+insert.length);
  return {value:next,start:caret,end:caret,changed:next!==value};
}

export function attachBirthInputMask(input,kind){
  maskLimit(kind);
  let composing=false,internal=false,lastValue=input.value;
  const state=()=>({value:input.value,start:input.selectionStart??input.value.length,end:input.selectionEnd??input.value.length});
  function apply(edit,emit=true){
    input.value=edit.value;lastValue=edit.value;
    input.setSelectionRange(edit.start,edit.end);
    if(edit.changed&&emit){internal=true;try{input.dispatchEvent(new Event('input',{bubbles:true}));}finally{internal=false;}}
  }
  function normalize(){
    if(internal||composing)return;
    const current=state(),entered=asciiDigits(current.value),rawDigits=entered.replace(/\D/g,'');
    const digits=entered===formatBirthDigits(rawDigits,kind)?rawDigits:pastedDigits(entered,kind);
    if(digits===null){apply({value:lastValue,start:Math.min(current.start,lastValue.length),end:Math.min(current.start,lastValue.length),changed:false},false);return;}
    const value=formatBirthDigits(digits,kind);
    const caret=current.start===current.value.length?value.length:caretAfterDigits(value,digitCount(current.value.slice(0,current.start)));
    apply({value,start:caret,end:caret,changed:value!==current.value},false);
  }
  input.addEventListener('beforeinput',event=>{
    if(composing||event.isComposing||!event.cancelable)return;
    const type=event.inputType;
    if(!['insertText','insertReplacementText','deleteContentBackward','deleteContentForward','deleteByCut','deleteByDrag'].includes(type))return;
    event.preventDefault();apply(editBirthInput({...state(),inputType:type,data:event.data??''},kind));
  });
  input.addEventListener('paste',event=>{
    if(!event.clipboardData)return;
    event.preventDefault();apply(editBirthInput({...state(),inputType:'insertFromPaste',data:event.clipboardData.getData('text/plain')},kind));
  });
  input.addEventListener('input',normalize);
  input.addEventListener('compositionstart',()=>{composing=true;});
  input.addEventListener('compositionend',()=>{composing=false;normalize();});
  // A form reset restores the original empty value without firing input.
  input.form?.addEventListener('reset',()=>{lastValue=input.defaultValue;});
}
