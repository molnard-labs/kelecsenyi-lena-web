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
