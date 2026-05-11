function setupTransitions() {
  const transition = document.createElement("div");
  transition.className = "page-transition";
  document.body.appendChild(transition);

  document.querySelectorAll("a[data-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
      transition.classList.add("active");
      setTimeout(() => { window.location.href = href; }, 260);
    });
  });
}

document.addEventListener("DOMContentLoaded", setupTransitions);
