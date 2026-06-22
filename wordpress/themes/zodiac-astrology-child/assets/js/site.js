document.addEventListener("DOMContentLoaded", () => {
  const intro = document.querySelector("#intro");

  if (intro) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("intro-passed", !entry.isIntersecting);
      },
      { threshold: 0.08 }
    );
    observer.observe(intro);

    window.addEventListener("pageshow", () => {
      document.body.classList.toggle(
        "intro-passed",
        window.scrollY > window.innerHeight * 0.8
      );
    });
  }
});
