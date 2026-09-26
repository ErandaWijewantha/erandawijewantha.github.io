(() => {
  const root = document.documentElement;

  // Theme toggle (initial theme is set inline in <head> to avoid a flash).
  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // Mobile drawer
  const drawer = document.querySelector(".drawer");
  const toggle = document.querySelector(".menu-toggle");
  const setDrawer = (open) => {
    drawer.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    (open ? drawer.querySelector(".drawer-close") : toggle).focus();
  };
  toggle?.addEventListener("click", () => setDrawer(true));
  drawer?.addEventListener("click", (e) => {
    if (e.target === drawer || e.target.closest(".drawer-close") || e.target.closest("a")) setDrawer(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer && !drawer.hidden) setDrawer(false); });

  // Category / tag filters (projects & blog pages) — client-side so they work on a static host.
  document.querySelectorAll("[data-filter-for]").forEach((group) => {
    const grid = document.getElementById(group.dataset.filterFor);
    const buttons = [...group.querySelectorAll("[data-filter]")];
    const apply = (value) => {
      buttons.forEach((b) => {
        const on = b.dataset.filter === value;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      grid.querySelectorAll("[data-cat]").forEach((card) => { card.hidden = !!value && card.dataset.cat !== value; });
    };
    buttons.forEach((b) => b.addEventListener("click", () => {
      apply(b.dataset.filter);
      const url = new URL(location.href);
      b.dataset.filter ? url.searchParams.set("filter", b.dataset.filter) : url.searchParams.delete("filter");
      history.replaceState(null, "", url);
    }));
    const initial = new URLSearchParams(location.search).get("filter");
    if (initial && buttons.some((b) => b.dataset.filter === initial)) apply(initial);
  });

  // Contact form: prefill subject from ?subject=, submit to Formspree without leaving the page.
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const subject = new URLSearchParams(location.search).get("subject");
    if (subject) form.querySelector("[data-subject]").value = subject;
    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      button.disabled = true;
      status.hidden = false;
      status.className = "form-status";
      status.textContent = "Sending…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.classList.add("ok");
        status.textContent = "Thanks! Your message has been sent. I’ll get back to you soon.";
      } catch (err) {
        status.classList.add("error");
        status.textContent = "Sorry, the message couldn’t be sent. Please email me directly instead.";
      } finally {
        button.disabled = false;
      }
    });
  }

  // Reveal-on-scroll
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const els = document.querySelectorAll(".section > *, .section-block > *, .cta");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }
})();
