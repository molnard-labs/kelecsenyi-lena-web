import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlacePicker,DEFAULT_BIRTH_PLACE} from '../astro-places.js';

const szeged={id:'715429',label:'Szeged, Magyarország',timezone:'Europe/Budapest'};

class Element extends EventTarget{
  constructor(tag='div'){
    super();this.tagName=tag;this.value='';this.textContent='';this.children=[];
    this.attributes=new Map();this.hidden=true;this.id='';this.className='';this.parentElement=null;
  }
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  removeAttribute(name){this.attributes.delete(name);}
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  replaceChildren(...children){for(const child of this.children)child.parentElement=null;this.children=[];this.append(...children);}
  contains(target){return this===target||this.children.some(child=>child.contains(target));}
  closest(selector){return this.className.split(' ').includes(selector.slice(1))?this:this.parentElement?.closest(selector)??null;}
  scrollIntoView(){}
}

function setup(t){
  const originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  const document=new EventTarget();document.createElement=tag=>new Element(tag);
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:document});
  t.after(()=>{if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else delete globalThis.document;});
  let nextTimer=0;
  const timers=new Map(),requests=[],changes=[],errors=[];
  t.mock.method(globalThis,'setTimeout',callback=>{const id=++nextTimer;timers.set(id,callback);return id;});
  t.mock.method(globalThis,'clearTimeout',id=>timers.delete(id));
  // Deliberately allow aborted requests to resolve: a response can already be in
  // flight when a newer query/selection wins, so abort alone is not sufficient.
  t.mock.method(globalThis,'fetch',(url,{signal})=>new Promise(resolve=>requests.push({url,signal,resolve})));
  const container=new Element();container.className='place-field';
  const input=new Element('input'),list=new Element('ul'),status=new Element();
  list.id='test-options';container.append(input,list,status);
  const picker=createPlacePicker({input,list,status,apiBase:'/api',setError:message=>errors.push(message),onChange:place=>changes.push(place)});
  function type(value){input.value=value;input.dispatchEvent(new Event('input'));}
  function startSearch(){
    assert.equal(timers.size,1,'only the latest debounced query should remain');
    const [id,callback]=timers.entries().next().value;timers.delete(id);
    return callback();
  }
  function respond(request,places){request.resolve({ok:true,json:async()=>({places})});}
  return {picker,input,list,status,requests,changes,errors,type,startSearch,respond};
}

test('Budapest is a canonical selected place, not just a visible default label',t=>{
  const {picker,input,list,status,changes}=setup(t);
  assert.deepEqual(DEFAULT_BIRTH_PLACE,{id:'3054643',label:'Budapest, Magyarország',timezone:'Europe/Budapest'});
  assert.equal(Object.isFrozen(DEFAULT_BIRTH_PLACE),true);
  picker.select(DEFAULT_BIRTH_PLACE);
  assert.equal(picker.selection,DEFAULT_BIRTH_PLACE);
  assert.equal(input.value,DEFAULT_BIRTH_PLACE.label);
  assert.equal(changes.at(-1),DEFAULT_BIRTH_PLACE);
  assert.equal(list.hidden,true);
  assert.equal(input.getAttribute('aria-expanded'),'false');
  assert.match(status.textContent,/Budapest/);
});

test('editing the city immediately removes the previous selection before lookup starts',t=>{
  const {picker,input,list,changes,requests,type}=setup(t);
  picker.select(DEFAULT_BIRTH_PLACE);
  type('Sze');
  assert.equal(picker.selection,null);
  assert.equal(changes.at(-1),null,'hidden place identifiers must be cleared immediately');
  assert.equal(input.value,'Sze');
  assert.equal(list.hidden,true);
  assert.equal(requests.length,0,'the selection is invalidated before the debounce completes');
});

test('history or autofill changing the visible label cannot reuse a stale place ID',t=>{
  const {picker,input}=setup(t);
  picker.select(DEFAULT_BIRTH_PLACE);
  input.value=szeged.label; // No input event, as with some history restoration.
  assert.equal(picker.selection,null);
});

test('late response from an older query cannot replace newer city suggestions',async t=>{
  const {input,list,requests,type,startSearch,respond}=setup(t);
  type('Bu');const first=startSearch();
  type('Sze');const second=startSearch();
  assert.equal(requests[0].signal.aborted,true);
  assert.equal(requests[1].url,'/api/places?q=Sze');
  respond(requests[1],[szeged]);await second;
  assert.equal(list.children[0].textContent,szeged.label);
  respond(requests[0],[DEFAULT_BIRTH_PLACE]);await first;
  assert.equal(input.value,'Sze');
  assert.equal(list.children.length,1);
  assert.equal(list.children[0].textContent,szeged.label);
  assert.equal(list.hidden,false);
});

test('late lookup cannot reopen suggestions or overwrite an explicitly selected city',async t=>{
  const {picker,input,list,status,requests,type,startSearch,respond}=setup(t);
  type('Bu');const pending=startSearch();
  picker.select(szeged);
  assert.equal(requests[0].signal.aborted,true);
  respond(requests[0],[DEFAULT_BIRTH_PLACE]);await pending;
  assert.equal(picker.selection,szeged);
  assert.equal(input.value,szeged.label);
  assert.equal(list.children.length,0);
  assert.equal(list.hidden,true);
  assert.equal(input.getAttribute('aria-expanded'),'false');
  assert.match(status.textContent,/Szeged/);
});

test('reset cancels an active request and keeps all place state empty after it resolves',async t=>{
  const {picker,input,list,status,requests,changes,type,startSearch,respond}=setup(t);
  picker.select(DEFAULT_BIRTH_PLACE);
  type('Sze');const pending=startSearch();
  picker.reset();
  assert.equal(requests[0].signal.aborted,true);
  respond(requests[0],[szeged]);await pending;
  assert.equal(picker.selection,null);
  assert.equal(input.value,'');
  assert.equal(changes.at(-1),null);
  assert.equal(status.textContent,'');
  assert.equal(list.children.length,0);
  assert.equal(list.hidden,true);
});
