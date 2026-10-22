document.addEventListener("DOMContentLoaded", () => {
  const intro = document.querySelector("#intro");
  const header = document.querySelector("#masthead");
  if (!intro || !header) return;

  const sync = () => {
    const visible = intro.getBoundingClientRect().bottom <= 80;
    document.body.classList.toggle("intro-passed", visible);
    header.inert = !visible;
    header.setAttribute("aria-hidden", String(!visible));
  };

  // Match the 72px header offset used by the intro's #hero link.
  new IntersectionObserver(sync, {
    rootMargin: "-80px 0px 0px 0px",
    threshold: 0
  }).observe(intro);
  window.addEventListener("pageshow", sync);
  sync();
});
