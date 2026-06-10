// App interactivity
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navMain = document.getElementById('navMain');

  if (menuToggle && navMain) {
    menuToggle.addEventListener('click', () => {
      navMain.classList.toggle('open');
      const isExpanded = navMain.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Dashboard Data if exists
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.nav-link').forEach(a => {
        a.style.display = a.textContent.toLowerCase().includes(q) ? 'block' : 'none';
      });
    });
  }
});
