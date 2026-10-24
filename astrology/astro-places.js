// Both entry points use the same canonical atlas selection, never free-text coordinates.
export const DEFAULT_BIRTH_PLACE=Object.freeze({id:'3054643',label:'Budapest, Magyarország',timezone:'Europe/Budapest'});

export function createPlacePicker({input,list,status,apiBase,setError,onChange=()=>{}}){
  let selected=null,places=[],activeIndex=-1,timer=null,controller=null,sequence=0;
  const container=input.closest('.place-field');
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');activeIndex=-1;}
  function cancel(){clearTimeout(timer);controller?.abort();controller=null;sequence++;}
  function clearOptions(){places=[];list.replaceChildren();close();}
  function select(place,{notify=true}={}){
    cancel();clearOptions();selected=place;input.value=place.label;
    if(notify)onChange(place);
    setError('');status.textContent=`Kiválasztva: ${place.label}`;
  }
  function reset({notify=true,clearInput=true}={}){
    cancel();clearOptions();selected=null;if(clearInput)input.value='';status.textContent='';
    if(notify)onChange(null);
    setError('');
  }
  function highlight(index){
    if(!places.length)return;
    activeIndex=(index+places.length)%places.length;
    [...list.children].forEach((item,i)=>item.setAttribute('aria-selected',String(i===activeIndex)));
    input.setAttribute('aria-activedescendant',`${list.id}-${activeIndex}`);
    list.children[activeIndex]?.scrollIntoView({block:'nearest'});
  }
  function show(items){
    places=items;activeIndex=-1;list.replaceChildren();input.removeAttribute('aria-activedescendant');
    for(const [index,place] of items.entries()){
      const item=document.createElement('li');item.textContent=place.label;item.id=`${list.id}-${index}`;
      item.setAttribute('role','option');item.setAttribute('aria-selected','false');
      const timezone=document.createElement('small');timezone.textContent=place.timezone;item.append(timezone);
      item.addEventListener('mousedown',event=>event.preventDefault());
      item.addEventListener('click',()=>select(place));list.append(item);
    }
    list.hidden=!items.length;input.setAttribute('aria-expanded',String(Boolean(items.length)));
    status.textContent=items.length?`${items.length} találat. A nyílbillentyűkkel választhatsz.`:'Nincs találat. Próbáld a település mai nevét vagy ékezet nélküli alakját.';
    if(!items.length)setError('Nem található ilyen település. Próbáld más névalakkal.');
  }
  input.addEventListener('input',()=>{
    cancel();clearOptions();selected=null;onChange(null);setError('');
    const query=input.value.trim(),current=sequence;
    if(query.length<2){status.textContent='Írj be legalább két karaktert.';return;}
    status.textContent='Települések keresése…';
    timer=setTimeout(async()=>{
      controller=new AbortController();
      try{
        const response=await fetch(`${apiBase}/places?q=${encodeURIComponent(query)}`,{signal:controller.signal,cache:'no-store'});
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload.places))throw new Error('Place search failed');
        if(current===sequence)show(payload.places);
      }catch(error){
        if(error.name!=='AbortError'&&current===sequence){close();setError('A helykereső nem érhető el. Próbáld újra rövidesen.');status.textContent='A keresés nem sikerült.';}
      }
    },200);
  });
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      if(places.length){event.preventDefault();list.hidden=false;input.setAttribute('aria-expanded','true');highlight(activeIndex<0?(event.key==='ArrowDown'?0:places.length-1):activeIndex+(event.key==='ArrowDown'?1:-1));}
    }else if(event.key==='Enter'&&!list.hidden&&activeIndex>=0){event.preventDefault();select(places[activeIndex]);}
    else if(event.key==='Escape'||event.key==='Tab')close();
  });
  document.addEventListener('click',event=>{if(!container?.contains(event.target))close();});
  // Autofill/history restoration may change the visible value without an input event.
  return {get selection(){return selected?.label===input.value?selected:null;},select,reset,close};
}
