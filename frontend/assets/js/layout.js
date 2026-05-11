function markActiveNav() {
  const page = location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    if (link.dataset.page === page) {
      link.classList.add("active");
    }
  });
}

function injectHeaderBrand() {
  const header = document.getElementById("institution-header");
  if (!header) return;
  header.textContent = "Rajalakshmi Institute of Technogy | REWARE | Campus Cycle";
}

document.addEventListener("DOMContentLoaded", () => {
  markActiveNav();
  injectHeaderBrand();
});
