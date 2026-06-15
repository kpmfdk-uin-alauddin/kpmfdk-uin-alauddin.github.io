// App interactivity, Responsive Menu & Dynamic API Hydration
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
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

  // 2. Smooth scroll for anchor links
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

  // 3. Dynamic Site Settings Hydration (Navbar and Footer configuration)
  async function hydrateSiteSettings() {
    try {
      const res = await fetch('/api/site-settings');
      if (!res.ok) return;
      const settings = await res.json();
      
      // Hydrate Navbar brand
      document.querySelectorAll('.logo strong').forEach(el => el.textContent = settings.siteTitle);
      document.querySelectorAll('.logo .muted').forEach(el => el.textContent = settings.siteSub);
      if (settings.logo) {
        document.querySelectorAll('.logo img').forEach(img => {
          // Adjust logo prefix for subdirectories
          const path = location.pathname.toLowerCase();
          let prefix = './';
          if (path.includes('/akreditasi') || path.includes('/anggota') || path.includes('/laporan') || path.includes('/masuk') || path.includes('/settings') || path.includes('/dokumen')) {
            prefix = '../';
          }
          img.src = settings.logo.startsWith('./') ? prefix + settings.logo.substring(2) : settings.logo;
        });
      }
      
      // Hydrate Navbar menu links dynamically
      if (navMain) {
        const loginBtn = navMain.querySelector('.btn');
        const loginUrl = loginBtn ? loginBtn.getAttribute('href') : '../masuk/index.html';
        const loginText = loginBtn ? loginBtn.textContent : 'Masuk';
        
        navMain.innerHTML = '';
        
        const path = location.pathname.toLowerCase();
        let prefix = './';
        if (path.includes('/akreditasi') || path.includes('/anggota') || path.includes('/laporan') || path.includes('/masuk') || path.includes('/settings') || path.includes('/dokumen')) {
          prefix = '../';
        }
        
        settings.navLinks.forEach(link => {
          const a = document.createElement('a');
          a.className = 'nav-link';
          let targetUrl = link.url;
          if (targetUrl.startsWith('/')) {
            targetUrl = prefix + targetUrl.substring(1);
          }
          a.href = targetUrl;
          a.textContent = link.label;
          
          // Check active state
          const currentPath = location.pathname.toLowerCase();
          const linkUrl = new URL(a.href, window.location.href);
          const linkPath = linkUrl.pathname.toLowerCase();
          const isActive = currentPath === linkPath || 
                           (currentPath.endsWith('/') && linkPath.endsWith('index.html') && currentPath.replace(/\/$/, '') === linkPath.substring(0, linkPath.lastIndexOf('/'))) ||
                           (currentPath.includes('/anggota/') && linkPath.includes('/anggota/')) ||
                           (currentPath.includes('/akreditasi/') && linkPath.includes('/akreditasi/')) ||
                           (currentPath.includes('/laporan/') && linkPath.includes('/laporan/')) ||
                           (currentPath.includes('/dokumen/') && linkPath.includes('/dokumen/'));
          
          if (isActive) {
            a.classList.add('active');
          }
          navMain.appendChild(a);
        });
        
        // Re-append login button
        if (loginBtn) {
          const btn = document.createElement('a');
          btn.className = 'btn btn-secondary';
          btn.href = loginUrl;
          btn.textContent = loginText;
          navMain.appendChild(btn);
        }
      }
      
      // Hydrate Footer Address, Phone, Email & Copyright
      const footer = document.querySelector('.site-footer');
      if (footer && settings.footer) {
        const addressEl = footer.querySelector('.muted');
        if (addressEl) addressEl.textContent = settings.footer.address;
        
        const contactEl = footer.querySelector('.mt-2');
        if (contactEl) {
          contactEl.innerHTML = `
            <strong>Telepon:</strong> <span class="muted">${settings.footer.phone}</span><br/>
            <strong>Email:</strong> <span class="muted">${settings.footer.email}</span>
          `;
        }
        
        const copyrightEl = footer.querySelector('.text-right-mobile .muted');
        if (copyrightEl) {
          copyrightEl.innerHTML = settings.footer.copyright;
        }
      }
      
    } catch (err) {
      console.warn('Fallback to static HTML layout elements: ', err);
    }
  }

  // 4. Hero Slider Engine (Homepage only)
  async function initHeroSlider() {
    const hero = document.getElementById('heroSlider');
    const heroContent = document.getElementById('heroContent');
    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');
    const dotsContainer = document.getElementById('sliderDots');
    
    // Only run on home page
    const path = location.pathname.toLowerCase();
    if (!hero || !heroContent || path.includes('/berita-') || path.includes('/akreditasi') || path.includes('/anggota') || path.includes('/laporan') || path.includes('/masuk') || path.includes('/settings') || path.includes('/dokumen')) {
      return;
    }
    
    try {
      const res = await fetch('/api/slides');
      if (!res.ok) return;
      const slides = await res.json();
      if (slides.length === 0) return;
      
      let index = 0;
      let sliderInterval = null;
      
      // Initial style override for fade effect
      heroContent.style.transition = 'opacity 0.4s ease-in-out';
      hero.style.transition = 'background-image 0.8s ease-in-out';
      
      // Generate dot indicators dynamically
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.className = 'slider-dot' + (idx === 0 ? ' active' : '');
          dot.setAttribute('aria-label', `Slide ${idx + 1}`);
          dot.addEventListener('click', () => {
            navigateSlider(() => {
              index = idx;
            });
          });
          dotsContainer.appendChild(dot);
        });
      }
      
      function updateDots(idx) {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, dIdx) => {
          if (dIdx === idx) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
      
      function showSlide(idx) {
        const slide = slides[idx];
        heroContent.style.opacity = 0;
        updateDots(idx);
        
        setTimeout(() => {
          hero.style.backgroundImage = `url('${slide.image}')`;
          heroContent.innerHTML = `
            <span class="badge badge-secondary mb-2">Penjaminan Mutu Internal</span>
            <h1>${slide.title}</h1>
            <p class="lead">${slide.lead}</p>
            <div class="actions">
              <a class="btn btn-secondary shadow" href="${slide.buttonLink}">${slide.buttonText}</a>
            </div>
          `;
          heroContent.style.opacity = 1;
        }, 400);
      }
      
      // Helper function to manage manual interactions
      function navigateSlider(actionFn) {
        actionFn();
        showSlide(index);
        resetTimer();
      }
      
      function startTimer() {
        sliderInterval = setInterval(() => {
          index = (index + 1) % slides.length;
          showSlide(index);
        }, 6000);
      }
      
      function resetTimer() {
        if (sliderInterval) {
          clearInterval(sliderInterval);
        }
        startTimer();
      }
      
      // Hook up navigation buttons
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          navigateSlider(() => {
            index = (index - 1 + slides.length) % slides.length;
          });
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          navigateSlider(() => {
            index = (index + 1) % slides.length;
          });
        });
      }
      
      // Load initial slide immediately
      showSlide(0);
      startTimer();
      
    } catch (err) {
      console.warn('Slider engine offline, static fallback loaded: ', err);
    }
  }

  // 5. News Hydration (Homepage only)
  async function hydrateNews() {
    const newsContainer = document.getElementById('dynamicNewsGrid');
    const sidebarList = document.getElementById('sidebarNewsList');
    
    // Only run on homepage
    const path = location.pathname.toLowerCase();
    if (!newsContainer || path.includes('/berita-') || path.includes('/akreditasi') || path.includes('/anggota') || path.includes('/laporan') || path.includes('/masuk') || path.includes('/settings') || path.includes('/dokumen')) {
      return;
    }
    
    try {
      const res = await fetch('/api/news');
      if (!res.ok) return;
      const news = await res.json();
      if (news.length === 0) return;
      
      // Hydrate Main Grid
      newsContainer.innerHTML = '';
      news.forEach(item => {
        const a = document.createElement('a');
        a.href = item.link;
        a.className = 'block mb-3 hover-lift card p-0 overflow-hidden';
        a.style.color = 'inherit';
        
        a.innerHTML = `
          <article>
            <img src="${item.image}" alt="${item.title}" style="width:100%; height:320px; object-fit:cover;"/>
            <div class="p-3">
              <span class="badge ${item.badge || 'badge-success'} mb-2">${item.category}</span>
              <h3 class="mb-1">${item.title}</h3>
              <p class="muted text-sm mb-0">${item.summary}</p>
            </div>
          </article>
        `;
        newsContainer.appendChild(a);
      });
      
      // Hydrate Sidebar List
      if (sidebarList) {
        sidebarList.innerHTML = '';
        news.slice(0, 5).forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="${item.link}">${item.title}</a>`;
          sidebarList.appendChild(li);
        });
        
        // Add link back to home
        const liBack = document.createElement('li');
        liBack.innerHTML = `<a href="./index.html">Kembali ke Beranda</a>`;
        sidebarList.appendChild(liBack);
      }
      
    } catch (err) {
      console.warn('News API offline: ', err);
    }
  }

  // Run Hydrations
  hydrateSiteSettings();
  initHeroSlider();
  hydrateNews();

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
    form.addEventListener('submit', function(e) {
      if (e.defaultPrevented) return;
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
      let relativePrefix = '../';
      if (path.includes('/anggota') || path.includes('/akreditasi') || path.includes('/laporan') || path.includes('/masuk') || path.includes('/settings') || path.includes('/dokumen')) {
        relativePrefix = '../';
      }
      if (path.split('/').filter(Boolean).length > 2) {
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
      } else if (path.includes('/dokumen/') && !path.endsWith('/dokumen/index.html')) {
        breadcrumb.innerHTML = `
          <a href="${relativePrefix}index.html">Beranda</a>
          <span class="breadcrumb-separator">/</span>
          <a href="${relativePrefix}dokumen/index.html">Dokumen</a>
          <span class="breadcrumb-separator">/</span>
          <span>${title}</span>
        `;
      }
    }
  };
  
  generateBreadcrumb();
});
