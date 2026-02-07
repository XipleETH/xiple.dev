const textMap = {
  en: {
    tagline: "Chadcoder",
    projects_title: "Projects",
    darkest_desc: "controller vibrations for darkest dungeon",
    lookback_desc: "traders' social app",
    reddit_build_title: "6FPS (Building)",
    reddit_build_desc: "Collaborative animations",
    bhastic_build_title: "bhastic (Building)",
    bhastic_build_desc: "Sounds to haptics."
  },
  es: {
    tagline: "Chadcoder",
    projects_title: "Proyectos",
    darkest_desc: "vibraciones de control para darkest dungeon",
    lookback_desc: "app social para traders",
    reddit_build_title: "6FPS (En desarrollo)",
    reddit_build_desc: "Animaciones colaborativas",
    bhastic_build_title: "bhastic (En desarrollo)",
    bhastic_build_desc: "Sounds to haptics."
  }
};

const i18nNodes = document.querySelectorAll("[data-i18n]");
const langButtons = document.querySelectorAll(".lang-btn");

const applyLanguage = (lang) => {
  const dict = textMap[lang] || textMap.en;
  document.documentElement.lang = lang;

  i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) {
      node.textContent = dict[key];
    }
  });

  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
};

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.dataset.lang || "en");
  });
});

applyLanguage("en");

const projectsContainer = document.querySelector(".projects");
const projectItems = projectsContainer
  ? Array.from(projectsContainer.querySelectorAll(".project-item"))
  : [];
const platformButtons = Array.from(document.querySelectorAll(".platform-chip[data-platform]"));
let selectedPlatform = "";

const hasSelectedPlatform = (projectNode) => {
  const tags = (projectNode.dataset.platforms || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return selectedPlatform !== "" && tags.includes(selectedPlatform);
};

const applyProjectOrdering = () => {
  if (!projectsContainer || projectItems.length === 0) {
    return;
  }

  const orderedProjects =
    selectedPlatform === ""
      ? projectItems
      : [
          ...projectItems.filter((node) => hasSelectedPlatform(node)),
          ...projectItems.filter((node) => !hasSelectedPlatform(node))
        ];

  orderedProjects.forEach((node) => {
    projectsContainer.appendChild(node);
  });

  platformButtons.forEach((button) => {
    const tag = (button.dataset.platform || "").toLowerCase();
    const active = selectedPlatform === tag;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
};

platformButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tag = (button.dataset.platform || "").toLowerCase();
    if (!tag) {
      return;
    }
    selectedPlatform = selectedPlatform === tag ? "" : tag;
    applyProjectOrdering();
  });
});

applyProjectOrdering();

const revealNodes = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("in"));
}
