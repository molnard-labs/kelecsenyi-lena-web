(() => {
  const intro = document.querySelector('#intro');
  if (!intro) return;
  const meteors = [...intro.querySelectorAll('.celestial-meteor')];
  const title = intro.querySelector('h1');
  function updatePaths() {
    const w = intro.clientWidth, h = intro.clientHeight;
    // Keep every head above the name; the long tails follow behind/upwards.
    const titleTop = title ? title.getBoundingClientRect().top - intro.getBoundingClientRect().top : h * .45;
    const skyHeight = Math.max(0, Math.min(h * .34, titleTop - 36));
    // Curved top/side entries, ending before the title's protected area.
    const routes = [
      [.08,-.45,.05,.12,.16,.72,.40,.96],
      [1.18,.08,.95,.12,.84,.48,.63,.98],
      [.43,-.45,.48,.15,.75,.48,.92,.94],
      [-.18,.24,.10,.24,.27,.56,.53,.92],
      [.82,-.40,.78,.08,.59,.62,.35,.94]
    ];
    meteors.forEach((meteor, index) => {
      const coords = routes[index % routes.length].map((value, i) => (value * (i % 2 ? skyHeight : w)).toFixed(1));
      meteor.style.offsetPath = `path("M ${coords[0]} ${coords[1]} C ${coords.slice(2).join(' ')}")`;
    });
  }
  const resize = new ResizeObserver(updatePaths);
  resize.observe(intro);
  if (title) resize.observe(title);
  document.fonts?.ready.then(updatePaths);
  updatePaths();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = true;
  let suspended = true;
  let activeMeteor = null;
  let nextMeteor = 0;
  let quietTimer = null;
  let quietDeadline = 0;
  const quietGap = () => 8000 + Math.random() * 8000;
  let remainingQuiet = quietGap();

  function scheduleMeteor() {
    if (suspended || activeMeteor || quietTimer !== null || !meteors.length) return;
    quietDeadline = performance.now() + remainingQuiet;
    quietTimer = window.setTimeout(() => {
      quietTimer = null;
      remainingQuiet = 0;
      if (suspended || activeMeteor) return;
      activeMeteor = meteors[nextMeteor++ % meteors.length];
      activeMeteor.style.setProperty('--flight-duration', `${2200 + Math.random() * 600}ms`);
      activeMeteor.classList.add('is-active');
    }, remainingQuiet);
  }

  function finishMeteor(event) {
    if (event.target !== activeMeteor || event.animationName !== 'celestial-fall') return;
    activeMeteor.classList.remove('is-active');
    activeMeteor = null;
    remainingQuiet = quietGap();
    scheduleMeteor();
  }
  meteors.forEach(meteor => {
    meteor.addEventListener('animationend', finishMeteor);
    meteor.addEventListener('animationcancel', finishMeteor);
  });

  function sync() {
    const paused = !inView || document.hidden || reduced.matches;
    intro.toggleAttribute('data-motion-paused', paused);
    // Reduced motion removes the CSS animation, so clear its active state too.
    if (reduced.matches && activeMeteor) {
      activeMeteor.classList.remove('is-active');
      activeMeteor = null;
      remainingQuiet = quietGap();
    }
    if (paused === suspended) return;
    suspended = paused;
    if (suspended && quietTimer !== null) {
      window.clearTimeout(quietTimer);
      quietTimer = null;
      remainingQuiet = Math.max(0, quietDeadline - performance.now());
    } else if (!suspended) {
      // A paused flight resumes in CSS; only an idle sky needs a timer.
      scheduleMeteor();
    }
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  // The fixed header covers the final intro strip at the #hero anchor.
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, {
    rootMargin: '-80px 0px 0px 0px'
  }).observe(intro);
  sync();
})();
