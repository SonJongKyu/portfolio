// 현재 연도
document.getElementById("year").textContent = new Date().getFullYear();

/* ========= 간단 Markdown → HTML 변환기 ========= */
function simpleMarkdownToHtml(md) {
  const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // 코드블록 보존
  const blocks = [];
  md = md.replace(/```([\s\S]*?)```/g, (_, code) => {
    blocks.push(code);
    return `\uE000BLOCK${blocks.length-1}\uE000`;
  });

  // 인라인코드
  md = md.replace(/`([^`]+)`/g, (_, code) => `<code>${esc(code)}</code>`);

  // 헤딩
  md = md.replace(/^######\s?(.*)$/gm, "<h6>$1</h6>")
         .replace(/^#####\s?(.*)$/gm, "<h5>$1</h5>")
         .replace(/^####\s?(.*)$/gm, "<h4>$1</h4>")
         .replace(/^###\s?(.*)$/gm, "<h3>$1</h3>")
         .replace(/^##\s?(.*)$/gm, "<h2>$1</h2>")
         .replace(/^#\s?(.*)$/gm, "<h1>$1</h1>");

  // 굵게/기울임
  md = md.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  md = md.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // 링크
  md = md.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                  '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // 목록 (간단 처리)
  md = md.replace(/(^|\n)(\d+\.)\s+(.+)(?=\n|$)/g, "$1<ol>\n<li>$3</li>\n</ol>");
  md = md.replace(/(^|\n)[-\*]\s+(.+)(?=\n|$)/g, "$1<ul>\n<li>$2</li>\n</ul>");
  md = md.replace(/<\/(ul|ol)>\s*<\1>/g, ""); // 연속 병합

  // 문단
  md = md.replace(/(^|\n)(?!<h\d>|<ul>|<ol>|<li>|<\/ul>|<\/ol>|<pre>|<p>|<blockquote>)([^\n]+)(?=\n|$)/g,
    (m, nl, text) => {
      const t = text.trim();
      if (!t) return m;
      if (/^</.test(t)) return `${nl}${t}`;
      return `${nl}<p>${t}</p>`;
    }
  );

  // 코드블록 복원
  md = md.replace(/\uE000BLOCK(\d+)\uE000/g, (_, i) =>
    `<pre><code>${esc(blocks[Number(i)])}</code></pre>`
  );

  return md;
}

/* ========= README Modal (GitHub Raw 불러와서 렌더) ========= */
(function () {
  const modal = document.getElementById('readmeModal');
  if (!modal) return;

  const titleEl   = document.getElementById('readmeTitle');
  const loadingEl = document.getElementById('readmeLoading');
  const contentEl = document.getElementById('readmeContent');

  function openModal(title) {
    titleEl.textContent = title || 'README';
    contentEl.innerHTML = '';
    loadingEl.style.display = 'block';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    contentEl.innerHTML = '';
    loadingEl.style.display = 'none';
  }

  // 닫기(백드롭/버튼/ESC)
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  // README 버튼 클릭 -> Raw URL fetch
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-readme');
    if (!btn) return;
    e.preventDefault();

    const title = btn.dataset.readmeTitle || 'README';
    const url   = btn.dataset.readmeUrl;
    if (!url) {
      alert('README URL이 설정되지 않았습니다.');
      return;
    }

    openModal(title);
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const md = await res.text();
      const html = simpleMarkdownToHtml(md);
      contentEl.innerHTML = html;
    } catch (err) {
      contentEl.innerHTML = `<p style="color:#b91c1c;">README를 불러오지 못했습니다. (${String(err)})</p>`;
    } finally {
      loadingEl.style.display = 'none';
    }
  });
})();

/* ========= 이미지 갤러리 모달 ========= */
(function () {
  const modal = document.getElementById('galleryModal');
  if (!modal) return;

  const titleEl   = document.getElementById('galleryTitle');
  const imgEl     = document.getElementById('galleryImage');
  const counterEl = document.getElementById('galleryCounter');

  const prevBtn = modal.querySelector('.gallery-nav.prev');
  const nextBtn = modal.querySelector('.gallery-nav.next');

  let images = [];
  let idx = 0;

  function update() {
    if (!images.length) return;
    imgEl.src = images[idx];
    counterEl.textContent = `${idx + 1} / ${images.length}`;
  }

  function openGallery(title, imgs, startIndex = 0) {
    images = imgs.filter(Boolean);
    idx = Math.min(Math.max(0, startIndex), images.length - 1);
    titleEl.textContent = title || '이미지';
    update();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGallery() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    images = [];
    idx = 0;
    imgEl.src = '';
  }

  function next() {
    if (!images.length) return;
    idx = (idx + 1) % images.length;
    update();
  }
  function prev() {
    if (!images.length) return;
    idx = (idx - 1 + images.length) % images.length;
    update();
  }

  // 버튼/백드롭/ESC 제어
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-gallery]')) closeGallery();
  });
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  // 이미지 버튼 클릭 핸들러 (여러 장 처리)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-image');
    if (!btn) return;
    e.preventDefault();

    const title = btn.dataset.galleryTitle || '이미지';
    const raw = (btn.dataset.images || '').trim();
    if (!raw) {
      alert('이미지 경로가 설정되지 않았습니다.');
      return;
    }
    const imgs = raw.split(',').map(s => s.trim()).filter(Boolean);
    openGallery(title, imgs, 0);
  });
})();
