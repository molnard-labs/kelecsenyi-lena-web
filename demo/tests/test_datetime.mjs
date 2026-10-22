import test from 'node:test';
import assert from 'node:assert/strict';
import {attachBirthInputMask,editBirthInput,formatBirthDigits,localTodayISO,parseBirthDate,parseBirthTime} from '../astro-datetime.js';

const date=value=>parseBirthDate(value,{max:'2026-10-22'});

test('Hungarian dates keep year, month and day, independent of browser locale',()=>{
  for(const value of ['1990. 05. 21.','1990.05.21','1990. 5. 21.',' 1990. 05. 21. ','1990-05-21','19900521']){
    assert.deepEqual(date(value),{valid:true,iso:'1990-05-21',formatted:'1990. 05. 21.'});
  }
  assert.equal(date('05/21/1990').valid,false,'ambiguous month-first notation must not be inferred');
  assert.equal(date('21. 05. 1990.').valid,false,'year must be first');
});

test('Gregorian leap years and actual month lengths are validated',()=>{
  for(const value of ['2000. 02. 29.','2024. 02. 29.','1904. 02. 29.','2001. 04. 30.'])assert.equal(date(value).valid,true,value);
  for(const value of ['1900. 02. 29.','2001. 02. 29.','2024. 02. 30.','2001. 04. 31.','2001. 00. 01.','2001. 13. 01.','2001. 01. 00.']){
    assert.deepEqual(date(value),{valid:false,reason:'calendar'},value);
  }
});

test('supported birth-date boundaries are inclusive and future dates rejected',()=>{
  assert.equal(date('1900. 01. 01.').valid,true);
  assert.equal(date('2026. 10. 22.').valid,true);
  assert.deepEqual(date('1899. 12. 31.'),{valid:false,reason:'range'});
  assert.deepEqual(date('2026. 10. 23.'),{valid:false,reason:'range'});
  assert.equal(parseBirthDate('1999. 01. 01.',{min:'2000-01-01',max:'2001-12-31'}).valid,false);
  assert.equal(localTodayISO(new Date(2026,0,2,23,59)),'2026-01-02');
});

test('dates reject partial, extra and malformed input without normalizing it',()=>{
  assert.deepEqual(date(''),{valid:false,reason:'empty'});
  for(const value of ['2000','2000. 1.','2000010','2000.01.01.2','2000-01-01T12:00','2e3.01.01.','<2000.01.01.>'])assert.equal(date(value).valid,false,value);
});

test('24-hour times accept normal and compact input with required minutes',()=>{
  for(const [input,expected] of [['0:00','00:00'],['00:00','00:00'],['23:59','23:59'],['9:05','09:05'],['9:5','09:05'],['930','09:30'],['0930','09:30'],[' 14:30 ','14:30'],['14 : 30','14:30']]){
    assert.deepEqual(parseBirthTime(input),{valid:true,iso:expected,formatted:expected});
  }
});

test('times reject overflow, missing minutes and locale-dependent AM/PM',()=>{
  assert.deepEqual(parseBirthTime(''),{valid:false,reason:'empty'});
  for(const value of ['24:00','23:60','25:30','2460','999'])assert.deepEqual(parseBirthTime(value),{valid:false,reason:'range'},value);
  for(const value of ['9','09','9:','14:30:00','2:30 PM','14.30','-1:30','1e2','14:30x'])assert.equal(parseBirthTime(value).valid,false,value);
});

function edit(value,start,inputType,data='',end=start,kind='date'){
  return editBirthInput({value,start,end,inputType,data},kind);
}

test('typing only numbers inserts date dots and time colon immediately at group boundaries',()=>{
  let current={value:'',start:0};
  const dates=['1','19','199','1990. ','1990. 0','1990. 05. ','1990. 05. 2','1990. 05. 21.'];
  for(const [i,digit] of [...'19900521'].entries()){
    current=edit(current.value,current.start,'insertText',digit);
    assert.equal(current.value,dates[i]);
    assert.equal(current.start,current.value.length,'caret passes generated punctuation');
  }
  current={value:'',start:0};
  for(const [digit,expected] of [['1','1'],['4','14:'],['3','14:3'],['0','14:30']]){
    current=edit(current.value,current.start,'insertText',digit,current.start,'time');
    assert.equal(current.value,expected);
  }
});

test('backspace and forward delete cross generated separators and remove a digit',()=>{
  assert.deepEqual(edit('1990. ',6,'deleteContentBackward'),{value:'199',start:3,end:3,changed:true});
  assert.deepEqual(edit('14:',3,'deleteContentBackward','',3,'time'),{value:'1',start:1,end:1,changed:true});
  assert.deepEqual(edit('14:30',2,'deleteContentForward','',2,'time'),{value:'14:0',start:3,end:3,changed:true});
  assert.deepEqual(edit('1990. 05. 21.',4,'deleteContentForward'),{value:'1990. 52. 1',start:6,end:6,changed:true});
  assert.equal(edit('1990. 05. 21.',0,'deleteContentBackward').changed,false);
});

test('middle digit replacement keeps the other fields and advances across punctuation',()=>{
  assert.deepEqual(edit('1990. 05. 21.',6,'insertText','12',8),{value:'1990. 12. 21.',start:10,end:10,changed:true});
  assert.deepEqual(edit('14:30',0,'insertText','09',2,'time'),{value:'09:30',start:3,end:3,changed:true});
  assert.deepEqual(edit('1990. 05. 21.',10,'insertFromPaste','07',12),{value:'1990. 05. 07.',start:13,end:13,changed:true});
  assert.deepEqual(edit('1990. 05. 21.',0,'deleteByCut','',13),{value:'',start:0,end:0,changed:true});
});

test('full selection accepts Hungarian, ISO and compact paste, including one-digit fields',()=>{
  for(const pasted of ['2000-02-29','2000. 02. 29.','20000229','2000. 2. 29.']){
    assert.deepEqual(edit('1990. 05. 21.',0,'insertFromPaste',pasted,13),{value:'2000. 02. 29.',start:13,end:13,changed:true});
  }
  for(const pasted of ['09:05','9:5','0905','905']){
    assert.deepEqual(edit('14:30',0,'insertFromPaste',pasted,5,'time'),{value:'09:05',start:5,end:5,changed:true});
  }
});

test('mask ignores extra typing and rejects malformed or overlong paste instead of truncating it',()=>{
  const unchanged={value:'14:30',start:5,end:5,changed:false};
  assert.deepEqual(edit('14:30',5,'insertText','9',5,'time'),unchanged);
  for(const value of ['14:30:00','143000','2:30 PM'])assert.equal(edit('14:30',0,'insertFromPaste',value,5,'time').changed,false,value);
  for(const value of ['01/02/2000','2000-01-01T12:00','200001011'])assert.equal(edit('',0,'insertFromPaste',value).changed,false,value);
  assert.equal(edit('1990. ',6,'insertText','.').changed,false,'users need not type the punctuation');
});

test('live formatting preserves invalid values so strict validation still rejects them',()=>{
  for(const [value,reason] of [['19000229','calendar'],['20261340','calendar'],['20261023','range']]){
    const masked=edit('',0,'insertFromPaste',value).value;
    assert.deepEqual(date(masked),{valid:false,reason});
  }
  for(const value of ['2400','2360'])assert.deepEqual(parseBirthTime(edit('',0,'insertFromPaste',value,0,'time').value),{valid:false,reason:'range'});
  assert.equal(date(formatBirthDigits('2000010','date')).valid,false);
  assert.equal(parseBirthTime(formatBirthDigits('14','time')).valid,false);
});

class MaskInput extends EventTarget{
  constructor(){super();this.value='';this.defaultValue='';this.selectionStart=0;this.selectionEnd=0;this.form=new EventTarget();}
  setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}
  before(inputType,data=''){
    const event=new Event('beforeinput',{cancelable:true});Object.assign(event,{inputType,data});this.dispatchEvent(event);return event;
  }
}

test('DOM adapter emits one input event per changed edit for stale-result invalidation',()=>{
  const input=new MaskInput();attachBirthInputMask(input,'time');
  let events=0;input.addEventListener('input',()=>events++);
  input.before('insertText','1');input.before('insertText','4');
  assert.equal(input.value,'14:');assert.equal(input.selectionStart,3);assert.equal(events,2);
  input.before('insertText',':');assert.equal(events,2,'ignored punctuation does not invalidate again');
  input.before('deleteContentBackward');assert.equal(input.value,'1');assert.equal(events,3);
});

test('composition is left intact until completion, then full-width digits receive the same mask',()=>{
  const input=new MaskInput();attachBirthInputMask(input,'date');
  input.dispatchEvent(new Event('compositionstart'));
  assert.equal(input.before('insertText','１').defaultPrevented,false);
  input.value='１９９０';input.setSelectionRange(4,4);input.dispatchEvent(new Event('input'));
  assert.equal(input.value,'１９９０');
  input.dispatchEvent(new Event('compositionend'));
  assert.equal(input.value,'1990. ');assert.equal(input.selectionStart,6);
  input.before('insertText','０５');assert.equal(input.value,'1990. 05. ');
});

test('native input fallback and reset keep later edits consistent',()=>{
  const input=new MaskInput();attachBirthInputMask(input,'date');
  input.value='2000-02-29';input.setSelectionRange(10,10);input.dispatchEvent(new Event('input'));
  assert.equal(input.value,'2000. 02. 29.');
  input.form.dispatchEvent(new Event('reset'));input.value='';input.setSelectionRange(0,0);
  input.before('insertText','2');assert.equal(input.value,'2');
  input.value='2x';input.setSelectionRange(2,2);input.dispatchEvent(new Event('input'));
  assert.equal(input.value,'2','unsupported native text is removed without changing the prior digits');
});
