// Reveal contact details only after a deliberate click.
document.querySelectorAll('[data-phone-reveal]').forEach(button=>{
  button.hidden=false;
  button.addEventListener('click',()=>{
    const payload=button.dataset.phoneReveal||'';
    if(!/^(?:[0-9a-f]{2}){5,64}$/.test(payload))return;
    const phone=payload.match(/../g).map(byte=>String.fromCharCode(parseInt(byte,16)^83)).join('');
    const dial=phone.replace(/[^0-9+]/g,'');
    if(!/^\+?[0-9]{5,18}$/.test(dial))return;
    const link=document.createElement('a');
    link.className='phone-reveal-link';
    link.href='tel:'+dial;
    link.textContent=phone;
    button.replaceWith(link);
    link.focus();
  },{once:true});
});

// Keep the visually hidden original navigation out of the keyboard sequence.
(() => {
  const header=document.querySelector('#masthead');
  const intro=document.querySelector('#intro');
  if(!header||!intro)return;
  const sync=()=>{
    const visible=document.body.classList.contains('intro-passed');
    header.inert=!visible;
    header.setAttribute('aria-hidden',String(!visible));
  };
  // Reveal the original header once the intro has left its 72px header area.
  // This also works for the #hero skip link, which has scroll-margin-top:72px.
  new IntersectionObserver(()=>{
    document.body.classList.toggle('intro-passed',intro.getBoundingClientRect().bottom<=80);
    sync();
  },{rootMargin:'-80px 0px 0px 0px',threshold:0}).observe(intro);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  sync();
})();
