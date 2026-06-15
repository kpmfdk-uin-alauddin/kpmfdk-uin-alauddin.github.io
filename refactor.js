const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const htmlFiles = [];

function findHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git') continue;
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath);
    } else if (filePath.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }
}

findHtmlFiles(rootDir);


const standardHeader = `<header class="site-header">
  <div class="container flex flex-wrap items-center justify-between">
    <a href="/index.html" class="logo flex items-center gap-1" style="text-decoration:none; color:inherit;">
      <img src="/assets/logosementarakessos.png" alt="Logo UINAM" style="height:48px;object-fit:contain"/>
      <div>
        <strong class="text-lg">KPM</strong>
        <div class="muted text-sm">Fakultas Dakwah &amp; Komunikasi</div>
      </div>
    </a>
    <button id="menuToggle" class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>
    <nav id="navMain" class="nav-main ml-auto">
      <a href="/index.html" class="nav-link">Beranda</a>
      <a href="/anggota/index.html" class="nav-link">Anggota</a>
      <a href="/akreditasi/index.html" class="nav-link">Akreditasi</a>
      <a href="/laporan/index.html" class="nav-link">Laporan</a>
      <a href="/masuk/index.html" class="btn">Masuk</a>
    </nav>
  </div>
</header>`;


const standardFooter = `<footer class="site-footer">
  <div class="container flex flex-wrap justify-between gap-4">
    <div style="max-width:480px;">
      <strong class="text-lg block mb-1">Fakultas Dakwah dan Komunikasi &mdash; UIN Alauddin Makassar</strong>
      <div class="muted">Kampus II: Jalan H. M. Yasin Limpo No. 36 Romang Polong, Somba Opu, Gowa, Sulawesi Selatan</div>
      <div class="mt-2 text-sm">
        <strong>Telepon:</strong> <span class="muted">+62 853-4131-6921</span><br/>
        <strong>Email:</strong> <span class="muted">kpm.fdk@uin-alauddin.ac.id</span>
      </div>
    </div>
    <div class="text-right-mobile mt-2" style="display: flex; flex-direction: column; align-items: flex-end;">
      <strong class="text-lg block">KPM FDK UINAM</strong>
      <div class="muted text-sm mb-1">Dibuat oleh Ariel Usman &copy; 2026</div>
      <div class="social-links flex gap-2 items-center mt-1" style="gap: 0.75rem; display: flex; justify-content: flex-end;">
        <a href="https://instagram.com/arielrcun" target="_blank" title="Instagram" class="social-icon" style="color: inherit; display: inline-flex; align-items: center; transition: all 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </a>
        <a href="https://www.youtube.com/@arielrifkycahyadi1353" target="_blank" title="YouTube" class="social-icon" style="color: inherit; display: inline-flex; align-items: center; transition: all 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
        </a>
        <a href="https://arielrifkycahyadi.github.io/" target="_blank" title="Portfolio" class="social-icon" style="color: inherit; display: inline-flex; align-items: center; transition: all 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </a>
      </div>
    </div>
  </div>
  <div class="container">
    <hr class="footer-divider" />
    <div class="text-center text-xs muted">
      &copy; 2026 Komite Penjaminan Mutu FDK UIN Alauddin Makassar. Hak Cipta Dilindungi Undang-Undang.
    </div>
  </div>
</footer>`;


const standardHead = `<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Komite Penjaminan Mutu (KPM) Fakultas Dakwah & Komunikasi UIN Alauddin Makassar" />
    <meta name="author" content="Ariel Usman" />
    <link rel="stylesheet" href="/assets/tailwhip.css" />
    <link rel="stylesheet" href="/assets/styles.css" />
    <link rel="stylesheet" href="/assets/front.css" />`;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  if (content.match(/<header/i) && content.match(/<\/header>/i)) {
    content = content.replace(/<header[\s\S]*?<\/header>/gi, standardHeader.trim());
  }

  if (content.match(/<footer/i) && content.match(/<\/footer>/i)) {
    content = content.replace(/<footer[\s\S]*?<\/footer>/gi, standardFooter.trim());
  }

  if (content.includes('<title>') || content.includes('<TITLE>')) {
    const titleMatch = content.match(/<title>.*?<\/title>/i);
    const title = titleMatch ? titleMatch[0] : '<title>KPM | Fakultas Dakwah &amp; Komunikasi</title>';
    content = content.replace(/<head>[\s\S]*?<\/head>/i, '<head>\n    ' + standardHead.trim() + '\n    ' + title + '\n  </head>');
  }

  if (!content.includes('app.js')) {
    const bodyMatch = content.match(/<\/body>/i);
    if (bodyMatch) {
      content = content.replace(/<\/body>/i, '    <script src="/assets/app.js"></script>\n  </body>');
    }
  }

  const depth = path.relative(rootDir, path.dirname(file)).split(path.sep).filter(p => p !== '').length;
  const relativePrefix = depth === 0 ? './' : '../'.repeat(depth);

  content = content.replace(/href="\//g, 'href="' + relativePrefix);
  content = content.replace(/src="\//g, 'src="' + relativePrefix);

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated: ' + path.relative(rootDir, file));
});