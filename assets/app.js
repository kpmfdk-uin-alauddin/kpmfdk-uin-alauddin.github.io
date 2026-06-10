// App interactivity & Responsive Menu Behaviors
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navMain = document.getElementById('navMain');

  if (menuToggle && navMain) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMain.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-main .nav-link, .nav-main .btn').forEach(link => {
      link.addEventListener('click', () => {
        navMain.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '&#9776;';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMain.contains(e.target) && !menuToggle.contains(e.target)) {
        navMain.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '&#9776;';
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Active nav link highlighting (robust for server and file:// protocols)
  const currentPath = location.pathname.toLowerCase();
  document.querySelectorAll('.nav-link').forEach(link => {
    try {
      const linkUrl = new URL(link.href, window.location.href);
      const linkPath = linkUrl.pathname.toLowerCase();
      
      // Check if current path matches or contains link path (for sub-pages)
      const isActive = currentPath === linkPath || 
                       (currentPath.endsWith('/') && linkPath.endsWith('index.html') && currentPath.replace(/\/$/, '') === linkPath.substring(0, linkPath.lastIndexOf('/'))) ||
                       (currentPath.includes('/anggota/') && linkPath.includes('/anggota/')) ||
                       (currentPath.includes('/akreditasi/') && linkPath.includes('/akreditasi/')) ||
                       (currentPath.includes('/laporan/') && linkPath.includes('/laporan/'));

      if (isActive) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    } catch (err) {
      // Fallback
    }
  });

  // Dashboard Data searchable list
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('[data-searchable]').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Image lazy loading and placeholder enhancement
  document.querySelectorAll('img').forEach(img => {
    if (img.src) {
      img.addEventListener('error', () => {
        img.style.background = '#e2e8f0';
        img.style.display = 'flex';
        img.style.alignItems = 'center';
        img.style.justifyContent = 'center';
        img.alt = 'Gambar tidak dapat dimuat';
      });
    }
  });

  // Add loading animation to forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      const btn = this.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Memproses...`;
      }
    });
  });

  // Accessibility: Add focus indicators on keyboard usage
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('show-focus-outline');
    }
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('show-focus-outline');
  });

  // Breadcrumb auto-generation from page title
  const generateBreadcrumb = () => {
    const title = document.title.split('|')[0].trim();
    const path = location.pathname.toLowerCase();
    const breadcrumb = document.querySelector('.breadcrumb');
    
    if (breadcrumb && title !== 'KPM') {
      // Determine directory depth
      let relativePrefix = '../';
      if (path.includes('/anggota/') || path.includes('/akreditasi/') || path.includes('/laporan/') || path.includes('/masuk/') || path.includes('/settings/')) {
        relativePrefix = '../';
      }
      if (path.split('/').filter(Boolean).length > 2) {
        // Nested subpages within directories
        relativePrefix = '../../';
      }

      breadcrumb.innerHTML = `
        <a href="${relativePrefix}index.html">Beranda</a>
        <span class="breadcrumb-separator">/</span>
        <span>${title}</span>
      `;
      
      if (path.includes('/anggota/') && !path.endsWith('/anggota/index.html')) {
        breadcrumb.innerHTML = `
          <a href="${relativePrefix}index.html">Beranda</a>
          <span class="breadcrumb-separator">/</span>
          <a href="${relativePrefix}anggota/index.html">Anggota</a>
          <span class="breadcrumb-separator">/</span>
          <span>${title}</span>
        `;
      } else if (path.includes('/akreditasi/') && !path.endsWith('/akreditasi/index.html')) {
        breadcrumb.innerHTML = `
          <a href="${relativePrefix}index.html">Beranda</a>
          <span class="breadcrumb-separator">/</span>
          <a href="${relativePrefix}akreditasi/index.html">Akreditasi</a>
          <span class="breadcrumb-separator">/</span>
          <span>${title}</span>
        `;
      } else if (path.includes('/laporan/') && !path.endsWith('/laporan/index.html')) {
        breadcrumb.innerHTML = `
          <a href="${relativePrefix}index.html">Beranda</a>
          <span class="breadcrumb-separator">/</span>
          <a href="${relativePrefix}laporan/index.html">Laporan</a>
          <span class="breadcrumb-separator">/</span>
          <span>${title}</span>
        `;
      }
    }
  };
  
  generateBreadcrumb();
});
