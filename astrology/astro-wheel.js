import {pointForLongitude,circularMidpoint,arrangePlanetLabels} from './astro-wheel-geometry.js';
import {degreeLabel} from './astro-interpretation.js';

const NS='http://www.w3.org/2000/svg';
const SIGNS=['Kos','Bika','Ikrek','Rák','Oroszlán','Szűz','Mérleg','Skorpió','Nyilas','Bak','Vízöntő','Halak'];
const SYMBOLS={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',north_node:'☊',south_node:'☋',chiron:'⚷'};
const CATEGORIES={conjunction:'Együttállás',harmonious:'Harmonikus',dynamic:'Feszültségi'};
let serial=0;

function html(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}
function svg(tag,attributes={},text){const element=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));if(text!==undefined)element.textContent=text;return element;}
function category(angle){return angle===0?'conjunction':angle===60||angle===120?'harmonious':'dynamic';}
function drawLine(parent,a,b,attributes){parent.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,...attributes}));}
function textAt(parent,point,text,attributes={}){parent.append(svg('text',{x:point.x,y:point.y,'text-anchor':'middle',...attributes},text));}
function ringSector(ascendant,start,end,inner,outer){
  const a=pointForLongitude(start,ascendant,outer),b=pointForLongitude(end,ascendant,outer),c=pointForLongitude(end,ascendant,inner),d=pointForLongitude(start,ascendant,inner);
  return `M${a.x},${a.y} A${outer},${outer} 0 0 0 ${b.x},${b.y} L${c.x},${c.y} A${inner},${inner} 0 0 1 ${d.x},${d.y} Z`;
}

/** A static data diagram: only label positions move, all astronomical marks
 * and aspect endpoints retain the original computed ecliptic longitudes. */
export function renderWheel(chart,host){
  const uid=`natal-wheel-${++serial}`,ascendant=chart.angles.ascendant.longitude;
  const planets=new Map(chart.planets.map(planet=>[planet.key,planet]));
  const panel=html('section','natal-wheel');panel.setAttribute('aria-labelledby',`${uid}-heading`);
  const heading=html('div','wheel-heading'),headingText=html('div');
  headingText.append(html('p','eyebrow','Az ég a születésedkor'));
  const title=html('h3','','A születési képleted');title.id=`${uid}-heading`;headingText.append(title);
  const toolbar=html('div','wheel-toolbar');toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Képletábra nagyítása');
  const zoomOut=html('button','wheel-zoom-button','−'),zoomIn=html('button','wheel-zoom-button','+'),resetZoom=html('button','wheel-fit-button','Teljes ábra'),zoomStatus=html('span','wheel-zoom-status','100%');
  zoomOut.type=zoomIn.type=resetZoom.type='button';zoomOut.setAttribute('aria-label','Képletábra kicsinyítése');zoomIn.setAttribute('aria-label','Képletábra nagyítása');zoomStatus.setAttribute('aria-live','polite');toolbar.append(zoomOut,zoomStatus,zoomIn,resetZoom);heading.append(headingText,toolbar);panel.append(heading);
  const layout=html('div','wheel-layout'),drawingColumn=html('div','wheel-drawing-column'),stage=html('div','wheel-viewport');
  stage.setAttribute('aria-label','Nagyítható születési képlet');
  const drawing=svg('svg',{viewBox:'0 0 900 900',class:'wheel-svg',role:'group','aria-labelledby':`${uid}-svg-title`,'aria-describedby':`${uid}-svg-description`});
  drawing.append(svg('title',{id:`${uid}-svg-title`},'Születési képlet: bolygók, házak és fényszögek'),svg('desc',{id:`${uid}-svg-description`},`Az aszcendens bal oldalon, ${chart.angles.ascendant.sign} ${degreeLabel(chart.angles.ascendant.degree)}. ${chart.input.house_system_label} házrendszer, ${chart.planets.length} égitest és képletpont, ${chart.aspects.length} főfényszög. A jelölések kiválaszthatók; a pontos adatok a képlet alatti táblázatban is olvashatók.`));
  const background=svg('g',{'aria-hidden':'true'});
  background.append(svg('circle',{cx:450,cy:450,r:391,class:'wheel-paper'}));
  for(let index=0;index<12;index++){
    background.append(svg('path',{d:ringSector(ascendant,index*30,(index+1)*30,333,391),class:`wheel-sign-sector wheel-element-${index%4}`}));
    const mid=pointForLongitude(index*30+15,ascendant,361);
    textAt(background,{x:mid.x,y:mid.y+4},String.fromCodePoint(0x2648+index)+'\uFE0E',{class:'wheel-sign-symbol'});
    textAt(background,{x:mid.x,y:mid.y+23},SIGNS[index],{class:'wheel-sign-name'});
    drawLine(background,pointForLongitude(index*30,ascendant,333),pointForLongitude(index*30,ascendant,391),{class:'wheel-sign-divider'});
  }
  for(const radius of [391,333,318,245,192])background.append(svg('circle',{cx:450,cy:450,r:radius,class:'wheel-ring'}));
  for(let degree=0;degree<360;degree++){
    const major=degree%30===0,five=degree%5===0;
    drawLine(background,pointForLongitude(degree,ascendant,318),pointForLongitude(degree,ascendant,major?332:five?328:323),{class:major?'wheel-tick is-sign-boundary':five?'wheel-tick is-five':'wheel-tick'});
  }
  for(const [index,house] of chart.houses.entries()){
    const next=chart.houses[(index+1)%chart.houses.length];
    drawLine(background,pointForLongitude(house.longitude,ascendant,192),pointForLongitude(house.longitude,ascendant,318),{class:'wheel-house-line','data-house':house.number,'data-longitude':house.longitude});
    const position=pointForLongitude(circularMidpoint(house.longitude,next.longitude),ascendant,216);
    textAt(background,{x:position.x,y:position.y+6},String(house.number),{class:'wheel-house-number'});
  }
  drawing.append(background);
  const aspectLayer=svg('g',{class:'wheel-aspect-layer','aria-hidden':'true'}),aspectElements=[];
  for(const aspect of chart.aspects){
    const a=planets.get(aspect.a),b=planets.get(aspect.b);if(!a||!b)continue;
    const p=pointForLongitude(a.longitude,ascendant,190),q=pointForLongitude(b.longitude,ascendant,190),kind=category(aspect.angle);
    const line=svg('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:`wheel-aspect wheel-aspect-${kind}`,'data-a':a.key,'data-b':b.key,'data-angle':aspect.angle,'data-orb':aspect.orb});
    line.append(svg('title',{},`${a.name} – ${b.name}: ${aspect.name}, eltérés ${degreeLabel(aspect.orb)}`));aspectLayer.append(line);aspectElements.push({line,aspect,kind});
    for(const point of [p,q])aspectLayer.append(svg('circle',{cx:point.x,cy:point.y,r:2,class:`wheel-aspect-endpoint wheel-aspect-${kind}`,'data-category':kind,'data-a':a.key,'data-b':b.key}));
  }
  drawing.append(aspectLayer);
  const axes=svg('g',{'aria-hidden':'true'});
  for(const [label,longitude] of [['ASC',ascendant],['DSC',(ascendant+180)%360],['MC',chart.angles.midheaven.longitude],['IC',(chart.angles.midheaven.longitude+180)%360]]){
    drawLine(axes,pointForLongitude(longitude,ascendant,193),pointForLongitude(longitude,ascendant,400),{class:`wheel-axis ${label==='ASC'||label==='MC'?'is-primary':''}`});
    const point=pointForLongitude(longitude,ascendant,423);
    textAt(axes,{x:Math.max(26,Math.min(874,point.x)),y:Math.max(24,Math.min(880,point.y+5))},label,{class:'wheel-axis-label'});
  }
  drawing.append(axes);
  const markers=svg('g',{class:'wheel-marker-layer'}),planetElements=[];
  for(const planet of arrangePlanetLabels(chart.planets,11)){
    const actual=pointForLongitude(planet.longitude,ascendant,314),elbow=pointForLongitude(planet.displayLongitude,ascendant,301),position=pointForLongitude(planet.displayLongitude,ascendant,276);
    const connector=svg('path',{d:`M${actual.x},${actual.y} L${elbow.x},${elbow.y} L${position.x},${position.y}`,class:'wheel-planet-leader','aria-hidden':'true'});
    const mark=svg('circle',{cx:actual.x,cy:actual.y,r:2.8,class:'wheel-actual-position','data-longitude':planet.longitude,'data-key':planet.key,'aria-hidden':'true'});
    const group=svg('g',{class:'wheel-planet',transform:`translate(${position.x} ${position.y})`,role:'button',tabindex:0,'aria-pressed':'false','aria-label':`${planet.name}, ${planet.sign} ${degreeLabel(planet.degree)}, ${planet.house}. ház${planet.retrograde?', retrográd':''}`,'data-key':planet.key,'data-longitude':planet.longitude,'data-display-longitude':planet.displayLongitude});
    group.append(svg('title',{},`${planet.name} · ${planet.sign} ${degreeLabel(planet.degree)} · ${planet.house}. ház`),svg('circle',{r:25,class:'wheel-planet-backdrop'}),svg('text',{x:0,y:5,'text-anchor':'middle',class:'wheel-planet-symbol'},(SYMBOLS[planet.key]||planet.name.slice(0,2))+'\uFE0E'),svg('text',{x:0,y:25,'text-anchor':'middle',class:'wheel-planet-degree'},degreeLabel(planet.degree)));
    if(planet.retrograde)group.append(svg('text',{x:19,y:-14,'text-anchor':'middle',class:'wheel-retrograde'},'R'));
    markers.append(connector,mark,group);planetElements.push({group,connector,mark,planet});
  }
  drawing.append(markers);stage.append(drawing);drawingColumn.append(stage,html('p','wheel-chart-hint','A pöttyök a pontos pozíciókat mutatják. Nagyítás után az ábra görgethető; a bolygójelölésekre kattintva részleteket látsz.'));
  const sidebar=html('aside','wheel-sidebar'),control=html('div','wheel-body-control'),selectLabel=html('label','','Mit néznél meg közelebbről?'),select=html('select','wheel-body-select');
  select.id=`${uid}-planet`;selectLabel.htmlFor=select.id;const all=html('option','','Teljes képlet');all.value='';select.append(all);
  for(const planet of chart.planets){const option=html('option','',planet.name);option.value=planet.key;select.append(option);}control.append(selectLabel,select);sidebar.append(control);
  const inspector=html('div','wheel-inspector');inspector.setAttribute('aria-live','polite');inspector.setAttribute('aria-atomic','true');sidebar.append(inspector);
  const legend=html('fieldset','wheel-legend');legend.append(html('legend','','Fényszögek megjelenítése'));
  const filters=new Map(),counts={conjunction:0,harmonious:0,dynamic:0};for(const aspect of chart.aspects)counts[category(aspect.angle)]++;
  for(const [kind,label] of Object.entries(CATEGORIES)){const row=html('label','wheel-legend-item'),checkbox=html('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.value=kind;checkbox.setAttribute('aria-label',`${label} fényszögek`);row.append(checkbox,html('span',`wheel-swatch wheel-swatch-${kind}`),html('span','',label),html('span','wheel-legend-count',String(counts[kind])));legend.append(row);filters.set(kind,checkbox);}
  sidebar.append(legend,html('p','wheel-explanation','Kívül a tizenkét állatövi jegy, belül a számozott házak. A színes vonalak a bolygók közötti főfényszögeket kapcsolják össze.'));
  layout.append(drawingColumn,sidebar);panel.append(layout);host.replaceChildren(panel);

  let selected='',zoom=1;
  function refreshHighlight(){
    for(const {line,aspect,kind} of aspectElements){line.toggleAttribute('hidden',!filters.get(kind).checked);line.classList.toggle('is-muted',Boolean(selected)&&aspect.a!==selected&&aspect.b!==selected);line.classList.toggle('is-highlighted',Boolean(selected)&&(aspect.a===selected||aspect.b===selected));}
    for(const endpoint of aspectLayer.querySelectorAll('.wheel-aspect-endpoint')){endpoint.style.display=filters.get(endpoint.getAttribute('data-category')).checked?'':'none';endpoint.classList.toggle('is-muted',Boolean(selected)&&endpoint.getAttribute('data-a')!==selected&&endpoint.getAttribute('data-b')!==selected);}
    for(const {group,connector,mark,planet} of planetElements){const active=selected===planet.key;group.classList.toggle('is-selected',active);group.setAttribute('aria-pressed',String(active));connector.classList.toggle('is-selected',active);mark.classList.toggle('is-selected',active);}
  }
  function showDetails(key){
    selected=key;select.value=key;inspector.replaceChildren();const planet=planets.get(key);
    if(!planet){
      inspector.append(html('p','eyebrow','Egy pillanat, sok összefüggés'),html('h4','wheel-detail-title','A képleted egésze'),html('p','wheel-overview',`${chart.planets.length} égitest és képletpont, 12 ház, ${chart.aspects.length} főfényszög.`));
      const facts=html('dl','wheel-facts');for(const [term,value] of [['Aszcendens',`${chart.angles.ascendant.sign} ${degreeLabel(chart.angles.ascendant.degree)}`],['Házrendszer',chart.input.house_system_label],['Állatöv','Trópusi']])facts.append(html('dt','',term),html('dd','',value));inspector.append(facts);
    }else{
      const name=html('h4','wheel-detail-title'),symbol=html('span','wheel-inline-symbol',(SYMBOLS[planet.key]||'')+'\uFE0E');symbol.setAttribute('aria-hidden','true');name.append(symbol,document.createTextNode(planet.name));
      inspector.append(html('p','eyebrow','A kiválasztott képletpont'),name,html('p','wheel-detail-position',`${planet.sign} ${degreeLabel(planet.degree)}`));
      const facts=html('dl','wheel-facts');facts.append(html('dt','','Ház'),html('dd','',`${planet.house}. ház`),html('dt','','Mozgás'),html('dd','',planet.retrograde?'Retrográd':'Direkt'));inspector.append(facts);
      const connections=chart.aspects.filter(aspect=>aspect.a===key||aspect.b===key);
      if(connections.length){inspector.append(html('p','wheel-connections-title','Kapcsolódó fényszögek'));const list=html('ul','wheel-connections');for(const aspect of connections){const other=planets.get(aspect.a===key?aspect.b:aspect.a);const item=html('li');item.append(html('span',`wheel-swatch wheel-swatch-${category(aspect.angle)}`),html('span','',`${other.name} · ${aspect.name.toLocaleLowerCase('hu-HU')}`),html('small','',`Eltérés: ${degreeLabel(aspect.orb)}`));list.append(item);}inspector.append(list);}
      else inspector.append(html('p','wheel-empty-aspects','A beállított főfényszögek között ehhez a ponthoz nincs kapcsolat.'));
    }
    refreshHighlight();
  }
  function setZoom(value){zoom=Math.max(1,Math.min(2.5,Math.round(value*10)/10));drawing.style.width=`${zoom*100}%`;zoomStatus.textContent=`${Math.round(zoom*100)}%`;zoomOut.disabled=zoom===1;zoomIn.disabled=zoom===2.5;resetZoom.disabled=zoom===1;if(zoom===1){stage.scrollLeft=0;stage.scrollTop=0;}}
  for(const {group,planet} of planetElements){group.addEventListener('click',()=>showDetails(selected===planet.key?'':planet.key));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showDetails(selected===planet.key?'':planet.key);}});}
  select.addEventListener('change',()=>showDetails(select.value));for(const checkbox of filters.values())checkbox.addEventListener('change',refreshHighlight);
  zoomIn.addEventListener('click',()=>setZoom(zoom+.5));zoomOut.addEventListener('click',()=>setZoom(zoom-.5));resetZoom.addEventListener('click',()=>setZoom(1));
  setZoom(1);showDetails('');
  return ()=>host.replaceChildren();
}
