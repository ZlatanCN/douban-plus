const startStickyReveal = (
  stickyNav: HTMLElement,
  win: Window = window
): void => {
  const reveal = (): void => {
    const y = win.scrollY || win.pageYOffset || 0;
    stickyNav.classList.toggle("is-visible", y > 300);
  };
  win.addEventListener("scroll", reveal, { passive: true });
  reveal();
};

const trackActiveSection = (
  nav: HTMLElement,
  doc: Document = document,
  win: Window = window
): void => {
  const links = nav.querySelectorAll<HTMLAnchorElement>(
    ".atv-stickynav-jumps a"
  );
  if (links.length === 0) {
    return;
  }

  const sectionIds: string[] = [];
  for (const link of links) {
    const id = link.getAttribute("href")?.slice(1);
    if (id) {
      sectionIds.push(id);
    }
  }

  const observer = new IntersectionObserver(
    () => {
      let activeId = "";
      let bestScore = -Infinity;

      for (const id of sectionIds) {
        const sectionEl = doc.querySelector(`#${id}`);
        if (!sectionEl) {
          continue;
        }

        const rect = sectionEl.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, 56);
        const visibleBottom = Math.min(rect.bottom, win.innerHeight * 0.55);
        const visible = Math.max(0, visibleBottom - visibleTop);

        if (visible > bestScore) {
          bestScore = visible;
          activeId = id;
        }
      }

      for (const link of links) {
        link.classList.toggle(
          "is-active",
          link.getAttribute("href") === `#${activeId}`
        );
      }
    },
    { threshold: [0, 0.25, 0.5] }
  );

  for (const id of sectionIds) {
    const sectionEl = doc.querySelector(`#${id}`);
    if (sectionEl) {
      observer.observe(sectionEl);
    }
  }
};

export { startStickyReveal, trackActiveSection };
