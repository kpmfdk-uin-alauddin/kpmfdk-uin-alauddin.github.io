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


\nconst standardFooter = `<footer class="site-footer">
  <div class="container flex flex-wrap justify-between gap-4">
    <div style="max-width:400px;">
      <strong class="text-lg">Dakwah dan Komunikasi &#8212; UIN Alauddin Makassar</strong>
      <div class="muted mt-1">Jalan H. M. Yasin Limpo No. 36 Romang Polong, Gowa, Sulawesi Selatan</div>
      <div class="mt-2">Tel: <span class="muted">085343803672</span><br/>Email: <span class="muted">kpi.fdk@uin-alauddin.ac.id</span></div>
    </div>
    <div class="text-right">
      <strong class="text-lg">KPM UINAM</strong>
      <div class="muted mt-1">Dibuat oleh Ariel Usman &copy; 2026</div>
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

  if (content.match(/<footer/i) && content.match(/<\/footer>/i) {
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