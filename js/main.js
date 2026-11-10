/* =====================================================
 * 星座小站 · 页面交互逻辑
 * ===================================================== */

/* ---------- 工具 ---------- */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const signByKey = k => SIGNS.find(s => s.key === k);
const ELEMENT_NAME = { fire: '火象', earth: '土象', air: '风象', water: '水象' };
const elementName = k => ELEMENT_NAME[k] || '';

function isValidDate(m, d, y) {
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const maxDays = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d > maxDays[m]) return false;
  if (y != null && Number.isInteger(y) && y > 0) {
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
      return false;
    }
  }
  return true;
}

/* 按月 / 日判断所属星座（摩羯座跨年特殊处理） */
function getSignByDate(m, d) {
  if (!isValidDate(m, d)) return null;
  for (const s of SIGNS) {
    const [sm, sd] = s.start, [em, ed] = s.end;
    if (sm <= em) {
      if ((m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em)) return s;
    } else {
      if ((m === sm && d >= sd) || (m === em && d <= ed)) return s;
    }
  }
  return null;
}

function levelOf(score) {
  if (score >= 90) return { name: '天作之合', cls: 'lv5' };
  if (score >= 80) return { name: '心有灵犀', cls: 'lv4' };
  if (score >= 70) return { name: '值得经营', cls: 'lv3' };
  if (score >= 60) return { name: '需要磨合', cls: 'lv2' };
  return { name: '挑战满满', cls: 'lv1' };
}

function compatOf(a, b) {
  const [x, y] = [a, b].sort();
  const pair = COMPAT[x + '-' + y] || { score: 70, text: '命中注定，慢慢了解。' };
  const lv = levelOf(pair.score);
  return { score: pair.score, text: pair.text, level: lv.name, cls: lv.cls };
}

/* ---------- Toast / 复制 ---------- */

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    toast('已复制，去分享吧！');
  } catch (e) {
    toast('复制失败，请手动复制');
  }
  ta.remove();
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast('已复制，去分享吧！')).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

/* ---------- 主题切换 ---------- */

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('zs-theme'); } catch (e) {}
  const theme = saved === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  $('#themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('zs-theme', next); } catch (e) {}
  $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

/* ---------- Tab 切换 ---------- */

function initTabs() {
  $$('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b === btn));
    $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + btn.dataset.tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
}

/* ---------- 星座查询 ---------- */

function signCardHTML(s) {
  return `<button class="sign-card" data-key="${s.key}">
    <span class="sign-symbol">${s.symbol}</span>
    <span class="sign-name">${s.name}</span>
    <span class="sign-date">${s.dateText}</span>
    <span class="tag tag-${s.element}">${elementName(s.element)}星座</span>
  </button>`;
}

function renderSignGrid() {
  $('#signGrid').innerHTML = SIGNS.map(signCardHTML).join('');
  $$('#signGrid .sign-card').forEach(c =>
    c.addEventListener('click', () => openModal(c.dataset.key))
  );
}

function renderDetail(s) {
  return `
  <div class="detail-head">
    <span class="detail-symbol">${s.symbol}</span>
    <div>
      <h3>${s.name} <small>${s.en}</small></h3>
      <p class="muted">${s.dateText}</p>
    </div>
  </div>
  <div class="tag-row">
    <span class="tag tag-${s.element}">${elementName(s.element)}星座</span>
    <span class="tag">${s.mode}</span>
    <span class="tag">守护星：${s.ruler}</span>
  </div>
  <p class="detail-summary">${s.summary}</p>
  <div class="detail-grid">
    <div><h4>✨ 性格关键词</h4><div class="tag-row">${s.traits.map(t => `<span class="tag">${t}</span>`).join('')}</div></div>
    <div><h4>👍 优点</h4><p>${s.pros}</p></div>
    <div><h4>⚠️ 小缺点</h4><p>${s.cons}</p></div>
    <div><h4>🍀 幸运档案</h4><p>幸运色：${s.lucky.color}<br>幸运数字：${s.lucky.numbers.join('、')}<br>幸运宝石：${s.lucky.gem}</p></div>
  </div>`;
}

function openModal(key) {
  const s = signByKey(key);
  if (!s) return;
  $('#modalBody').innerHTML = renderDetail(s);
  $('#modal').classList.add('open');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.remove('open');
  $('#modal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function initModal() {
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

/* ---------- 按生日查星座 ---------- */

function initBirthday() {
  $('#birthdayInput').addEventListener('change', e => {
    const v = e.target.value;
    const box = $('#birthdayResult');
    if (!v) { box.innerHTML = ''; box.classList.remove('show'); return; }
    const parts = v.split('-').map(Number);
    if (parts.length < 3 || !isValidDate(parts[1], parts[2], parts[0])) {
      box.innerHTML = '<p class="muted">未能识别该日期，请检查输入。</p>';
      box.classList.add('show');
      return;
    }
    const s = getSignByDate(parts[1], parts[2]);
    if (!s) {
      box.innerHTML = '<p class="muted">未能识别该日期，请检查输入。</p>';
      box.classList.add('show');
      return;
    }
    box.innerHTML = `
      <div class="bday-card">
        <span class="bday-symbol">${s.symbol}</span>
        <div class="bday-info">
          <div class="bday-name">${s.name} <small>${s.en}</small></div>
          <div class="muted small">${s.dateText} · ${elementName(s.element)}星座 · 守护星 ${s.ruler}</div>
        </div>
        <button class="btn btn-ghost" id="bdayMore">查看详情</button>
      </div>`;
    box.classList.add('show');
    $('#bdayMore').addEventListener('click', () => openModal(s.key));
  });
}

/* ---------- 星座配对 ---------- */

let pickA = null, pickB = null;

function renderPicker(sel, onPick) {
  const box = $(sel);
  box.innerHTML = SIGNS.map(s =>
    `<button class="chip" data-key="${s.key}"><span>${s.symbol}</span>${s.name}</button>`
  ).join('');
  $$('.chip', box).forEach(ch => ch.addEventListener('click', () => {
    $$('.chip', box).forEach(c => c.classList.remove('selected'));
    ch.classList.add('selected');
    onPick(ch.dataset.key);
  }));
}

function renderCompatResult() {
  const box = $('#compatResult');
  if (!pickA || !pickB) {
    box.innerHTML = '<p class="muted center-text">请先在上方选好两个星座再开始配对哦～</p>';
    box.classList.add('show');
    return;
  }
  const A = signByKey(pickA), B = signByKey(pickB);
  const r = compatOf(pickA, pickB);
  box.innerHTML = `
    <div class="compat-head">
      <div class="compat-sign"><span class="big-symbol">${A.symbol}</span><span>${A.name}</span></div>
      <div class="heart">❤</div>
      <div class="compat-sign"><span class="big-symbol">${B.symbol}</span><span>${B.name}</span></div>
    </div>
    <div class="score-ring" style="--score:${r.score}">
      <span class="score-num">${r.score}</span>
      <small>${r.level}</small>
    </div>
    <p class="compat-text">${r.text}</p>
    <div class="center"><button class="btn btn-ghost" id="copyCompat">复制结果分享</button></div>`;
  box.classList.add('show');
  $('#copyCompat').addEventListener('click', () => {
    copyText(`【星座配对】${A.name} ❤ ${B.name}：匹配指数 ${r.score} 分（${r.level}）。${r.text} —— 来自星座小站`);
  });
}

function initCompat() {
  renderPicker('#compatPickA', k => { pickA = k; });
  renderPicker('#compatPickB', k => { pickB = k; });
  $('#compatGo').addEventListener('click', renderCompatResult);
}

/* ---------- 今日运势 ---------- */

function fillSignSelect(sel) {
  $(sel).innerHTML = SIGNS.map(s => `<option value="${s.key}">${s.symbol} ${s.name}</option>`).join('');
}

function barHTML(label, val, text) {
  return `<div class="f-bar">
    <div class="f-bar-head"><span>${label}</span><b>${val}</b></div>
    <div class="f-track"><div class="f-fill" style="width:${val}%"></div></div>
    <p class="muted small">${text}</p>
  </div>`;
}

function renderFortune() {
  const key = $('#fortuneSign').value || 'aries';
  const f = dailyFortune(key);
  const s = signByKey(key);
  $('#fortuneDate').textContent = `${f.date} · ${s.symbol} ${s.name}`;
  $('#fortuneResult').innerHTML = `
    <div class="f-overall">综合运势 <b>${f.overall}</b><span class="muted"> / 100</span></div>
    ${barHTML('💕 爱情', f.love, f.texts.love)}
    ${barHTML('💼 事业', f.career, f.texts.career)}
    ${barHTML('💰 财运', f.money, f.texts.money)}
    ${barHTML('🌿 健康', f.health, f.texts.health)}
    <div class="f-extra">幸运色 <b>${f.color}</b> · 幸运数字 <b>${f.number}</b></div>
    <p class="f-advice">💡 ${f.advice}</p>
    <p class="muted small">结果按日期生成：同一天所有人相同，明天自动更新。</p>`;
  $('#fortuneResult').classList.add('show');
}

function initFortune() {
  fillSignSelect('#fortuneSign');
  $('#fortuneSign').addEventListener('change', renderFortune);
  renderFortune();
}

/* ---------- 配对排行榜 ---------- */

function renderRank() {
  const key = $('#rankSign').value || 'aries';
  const list = SIGNS
    .filter(s => s.key !== key)
    .map(s => Object.assign({ s: s }, compatOf(key, s.key)))
    .sort((a, b) => b.score - a.score);
  $('#rankList').innerHTML = list.map((it, i) => `
    <div class="rank-row">
      <span class="rank-no${i < 3 ? ' top' : ''}">${i + 1}</span>
      <span class="rank-sign">${it.s.symbol} ${it.s.name}</span>
      <div class="rank-track"><div class="rank-fill" style="width:${it.score}%"></div></div>
      <b class="rank-score">${it.score}</b>
      <span class="tag lv ${it.cls}">${it.level}</span>
    </div>`).join('');
}

function initRank() {
  fillSignSelect('#rankSign');
  $('#rankSign').addEventListener('change', renderRank);
  renderRank();
}

/* ---------- 星座百科 ---------- */

function wikiSignTags(keys) {
  return keys.map(k => {
    const s = signByKey(k);
    return `<span class="tag tag-${s.element}">${s.symbol} ${s.name}</span>`;
  }).join('');
}

function renderWiki() {
  $('#wikiElements').innerHTML = Object.entries(ELEMENTS).map(([k, e]) => `
    <div class="wiki-card">
      <div class="wiki-head">${e.emoji} ${e.name}星座</div>
      <p class="muted">${e.desc}</p>
      <div class="tag-row">${wikiSignTags(e.signs)}</div>
    </div>`).join('');

  $('#wikiPolarity').innerHTML = Object.entries(POLARITY).map(([name, p]) => `
    <div class="wiki-card">
      <div class="wiki-head">${name}</div>
      <p class="muted">${p.desc}</p>
      <div class="tag-row">${wikiSignTags(p.signs)}</div>
    </div>`).join('');

  $('#wikiModes').innerHTML = Object.entries(MODES).map(([name, m]) => `
    <div class="wiki-card">
      <div class="wiki-head">${name}</div>
      <p class="muted">${m.desc}</p>
      <div class="tag-row">${wikiSignTags(m.signs)}</div>
    </div>`).join('');
}

/* ---------- 初始化 ---------- */

initTheme();
initTabs();
renderSignGrid();
initModal();
initBirthday();
initCompat();
initFortune();
initRank();
renderWiki();
$('#themeToggle').addEventListener('click', toggleTheme);
