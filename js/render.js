import { TICKERS, SECTORS, INITIAL_CASH } from './config.js';
import { S, prices, hist }                from './state.js';
import { total }                           from './trade.js';

// DOM element cache — populated once by initMarketTable()
const TEL = {};

const fmt3 = n => Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const esc  = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function initMarketTable() {
  const body = document.getElementById('mkt-body');
  body.innerHTML = '';

  const bySector = {};
  for (const t of TICKERS) {
    if (!bySector[t.s]) bySector[t.s] = [];
    bySector[t.s].push(t);
  }

  for (const [sId, tickers] of Object.entries(bySector)) {
    const sec = SECTORS[sId];
    const sep = document.createElement('div');
    sep.className = 's-sep';
    sep.innerHTML = `<span class="s-dot" style="background:${sec.color}"></span>${esc(sec.label)}`;
    body.appendChild(sep);

    for (const t of tickers) {
      const row = document.createElement('div');
      row.id        = `tr-${t.id}`;
      row.className = 't-row';
      row.innerHTML =
        `<span class="t-s">${t.id}</span>` +
        `<span class="t-n">${esc(t.n)}</span>` +
        `<span class="t-p" id="tp-${t.id}">$${t.b.toFixed(2)}</span>` +
        `<span class="t-d" id="td-${t.id}">—</span>` +
        `<canvas id="ts-${t.id}" width="52" height="18"></canvas>` +
        `<span class="t-h" id="th-${t.id}"></span>`;
      body.appendChild(row);
    }
  }

  for (const t of TICKERS) {
    TEL[t.id] = {
      row:   document.getElementById(`tr-${t.id}`),
      price: document.getElementById(`tp-${t.id}`),
      d1:    document.getElementById(`td-${t.id}`),
      spark: document.getElementById(`ts-${t.id}`),
      held:  document.getElementById(`th-${t.id}`),
    };
  }
}

export function render() {
  const tv  = total();
  const pnl = tv - INITIAL_CASH;
  const pct = pnl / INITIAL_CASH * 100;
  const col = pnl > 0 ? 'var(--g+)' : pnl < 0 ? 'var(--g-)' : 'var(--t3)';
  const sig = pnl >= 0 ? '+' : '';

  // KPIs
  _setText('kv-tot', '$' + fmt3(tv), col);
  _setClass('kt-tot', `kpi-tr ${pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : 'neu'}`,
    `${sig}${pct.toFixed(2)}% depuis le début`);

  _setText('kv-pnl', `${pnl >= 0 ? '+' : '-'}$${fmt3(Math.abs(pnl))}`, col);
  _setClass('kt-pnl', `kpi-tr ${pnl > 0 ? 'pos' : pnl < 0 ? 'neg' : 'neu'}`,
    `${sig}${pct.toFixed(2)}% / $100 000 initial`);

  const openPos = Object.values(S.pos).filter(p => p.shares > 0).length;
  _setText('kv-pos', String(openPos));
  _setText('kt-pos', `sur 50 titres — tick ${S.tick}`);

  _setText('kv-dec', String(S.dec));
  const wins = S.trades.filter(t => t.pnl > 0).length;
  const nTr  = S.trades.length;
  _setText('kt-dec', nTr ? `taux de gain ${Math.round(wins / nTr * 100)}%` : 'taux de gain —');

  // Equity section
  _setText('eq-val', '$' + fmt3(tv));
  const eqPnl = document.getElementById('eq-pnl');
  eqPnl.textContent = `P&L : ${sig}$${fmt3(Math.abs(pnl))} (${sig}${pct.toFixed(2)}%)`;
  eqPnl.style.color = col;

  const badge = document.getElementById('eq-badge');
  badge.style.visibility = 'visible';
  badge.textContent = `${sig}${pct.toFixed(2)}%`;
  badge.className   = `eq-badge${pnl < 0 ? ' neg' : ''}`;
  _setText('eqf-r', `Tick ${S.tick}`);
  drawEq();

  // Topbar
  _setText('tb-tick', `Tick ${S.tick}`);
  _setText('tb-clk', new Date().toLocaleTimeString('fr-FR'));
  _setText('mtick', String(S.tick));

  let up = 0, dn = 0;
  for (const t of TICKERS) {
    const h  = hist[t.id];
    const p  = prices[t.id];
    const pv = h[h.length - 2] ?? p;
    if (p >= pv) up++; else dn++;
    _updateTicker(t, p, pv, h);
  }
  _setText('mup', String(up));
  _setText('mdn', String(dn));

  _renderHoldings(tv, openPos);
  _renderAlloc(tv);
  _renderRisk(tv);
}

// ── Private helpers ───────────────────────────────────────────

function _setText(id, text, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (color !== undefined) el.style.color = color;
}

function _setClass(id, cls, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className   = cls;
  el.textContent = text;
}

function _updateTicker(t, p, pv, h) {
  const el = TEL[t.id];
  if (!el?.price) return;

  const up  = p >= pv;
  const pct = ((p - pv) / pv * 100).toFixed(2);
  const now = '$' + p.toFixed(2);

  if (el.price.textContent && el.price.textContent !== now) {
    el.row.classList.remove('fu', 'fd');
    void el.row.offsetWidth;
    el.row.classList.add(up ? 'fu' : 'fd');
  }
  el.price.textContent = now;
  el.d1.textContent    = `${up ? '+' : ''}${pct}%`;
  el.d1.className      = `t-d ${up ? 'up' : 'dn'}`;
  drawSpark(t.id, h, up);

  const pos = S.pos[t.id];
  if (pos?.shares > 0) {
    el.held.style.visibility = 'visible';
    el.held.textContent      = String(pos.shares);
    el.row.classList.add('held');
  } else {
    el.held.style.visibility = 'hidden';
    el.row.classList.remove('held');
  }
}

function _renderHoldings(tv, openPos) {
  const row = document.getElementById('hold-row');
  row.innerHTML = '';

  const cash = document.createElement('div');
  cash.className = 'hc cash';
  cash.innerHTML =
    `<div class="hc-s">CASH</div>` +
    `<div class="hc-v">$${fmt3(S.cash)}</div>` +
    `<div class="hc-sub">${(S.cash / tv * 100).toFixed(1)}% du portefeuille</div>`;
  row.appendChild(cash);

  for (const [id, pos] of Object.entries(S.pos)) {
    if (!pos.shares) continue;
    const p   = prices[id];
    const val = p * pos.shares;
    const pnl = (p - pos.avg) / pos.avg * 100;
    const c   = document.createElement('div');
    c.className = 'hc';
    c.innerHTML =
      `<div class="hc-s">${id}</div>` +
      `<div class="hc-v">$${fmt3(val)}</div>` +
      `<div class="hc-sub">${pos.shares} × $${pos.avg.toFixed(2)}</div>` +
      `<div class="hc-pnl" style="color:${pnl >= 0 ? 'var(--g+)' : 'var(--g-)'}">` +
      `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%</div>`;
    row.appendChild(c);
  }

  _setText('hold-meta', openPos
    ? `${openPos} position${openPos > 1 ? 's' : ''} ouverte${openPos > 1 ? 's' : ''}`
    : 'cash uniquement');
}

function _renderAlloc(tv) {
  const bySec = { CASH: S.cash };
  for (const [id, pos] of Object.entries(S.pos)) {
    if (!pos.shares) continue;
    const t = TICKERS.find(t => t.id === id);
    if (!t) continue;
    bySec[t.s] = (bySec[t.s] || 0) + prices[id] * pos.shares;
  }

  const total2 = Object.values(bySec).reduce((a, b) => a + b, 0) || 1;
  const items  = Object.entries(bySec).sort((a, b) => b[1] - a[1]);
  const list   = document.getElementById('alloc-list');
  list.innerHTML = '';

  for (const [s, v] of items) {
    const pct   = v / total2 * 100;
    const sec   = SECTORS[s] || { label: s, color: 'rgba(255,255,255,.3)' };
    const label = s === 'CASH' ? 'Cash' : sec.label;
    const color = s === 'CASH' ? 'rgba(255,255,255,.25)' : sec.color;
    const div   = document.createElement('div');
    div.className = 'alloc-item';
    div.innerHTML =
      `<span class="alloc-nm">${esc(label)}</span>` +
      `<div class="alloc-bg"><div class="alloc-bar" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>` +
      `<span class="alloc-pct">${pct.toFixed(0)}%</span>`;
    list.appendChild(div);
  }

  _setText('alloc-meta', `${items.length} classe${items.length > 1 ? 's' : ''}`);
}

function _renderRisk(tv) {
  const wins = S.trades.filter(t => t.pnl > 0).length;
  const n    = S.trades.length;
  _setText('r-win',  n ? `${Math.round(wins / n * 100)}%` : '—');
  _setText('r-tr',   String(n));
  _setText('r-cash', `${(S.cash / tv * 100).toFixed(0)}%`);

  let peak = S.eqH[0] ?? INITIAL_CASH, dd = 0;
  for (const v of S.eqH) {
    if (v > peak) peak = v;
    const d = (peak - v) / peak;
    if (d > dd) dd = d;
  }
  _setText('r-dd', dd > 0.0001 ? `-${(dd * 100).toFixed(1)}%` : '—');
}

function drawEq() {
  const c   = document.getElementById('eq-canvas');
  c.width   = c.parentElement.clientWidth;
  const ctx = c.getContext('2d');
  const w   = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);

  const arr = S.eqH;
  if (arr.length < 2) return;

  const mn  = Math.min(...arr);
  const mx  = Math.max(...arr);
  const rng = Math.max(mx - mn, INITIAL_CASH * 0.005);
  const pad = 8;
  const xOf = i => (i / (arr.length - 1)) * w;
  const yOf = v => h - pad - ((v - mn) / rng) * (h - pad * 2);

  // baseline at initial capital
  ctx.strokeStyle = 'rgba(255,255,255,.07)';
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, yOf(INITIAL_CASH));
  ctx.lineTo(w, yOf(INITIAL_CASH));
  ctx.stroke();
  ctx.setLineDash([]);

  const last = arr[arr.length - 1];
  const up   = last >= INITIAL_CASH;
  const col  = up ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)';
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, up ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.beginPath();
  arr.forEach((v, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, xOf(i), yOf(v)));
  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = col;
  ctx.shadowBlur  = 6;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // live dot
  ctx.beginPath();
  ctx.arc(xOf(arr.length - 1), yOf(last), 3, 0, Math.PI * 2);
  ctx.fillStyle   = col;
  ctx.shadowColor = col;
  ctx.shadowBlur  = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSpark(id, h, up) {
  const c = TEL[id]?.spark;
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, hh = c.height;
  ctx.clearRect(0, 0, w, hh);
  if (h.length < 2) return;

  const mn  = Math.min(...h), mx = Math.max(...h), rng = mx - mn || 1;
  const col = up ? '#22c55e' : '#ef4444';

  ctx.strokeStyle = col;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = col;
  ctx.shadowBlur  = 3;
  ctx.beginPath();
  h.forEach((v, i) => {
    const x = (i / (h.length - 1)) * w;
    const y = hh - ((v - mn) / rng) * (hh - 2) - 1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.lineTo(w, hh); ctx.lineTo(0, hh); ctx.closePath();
  ctx.fillStyle = up ? 'rgba(34,197,94,.07)' : 'rgba(239,68,68,.07)';
  ctx.fill();
}
