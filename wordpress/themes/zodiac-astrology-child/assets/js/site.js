document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-phone-reveal]").forEach(button => {
    button.hidden = false;
    button.addEventListener("click", () => {
      const payload = button.dataset.phoneReveal || "";
      if (!/^(?:[0-9a-f]{2}){5,64}$/.test(payload)) return;
      const phone = payload.match(/../g).map(byte => String.fromCharCode(parseInt(byte, 16) ^ 83)).join("");
      const dial = phone.replace(/[^0-9+]/g, "");
      if (!/^\+?[0-9]{5,18}$/.test(dial)) return;
      const link = document.createElement("a");
      link.className = "phone-reveal-link";
      link.href = "tel:" + dial;
      link.textContent = phone;
      button.replaceWith(link);
      link.focus();
    }, { once: true });
  });

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
