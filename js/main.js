import { LS_KEY, AUTO_SEC, TICK_MS } from './config.js';
import { S, resetState }              from './state.js';
import { marketTick }                 from './market.js';
import { doTrade }                    from './trade.js';
import { askGemini, heuri }           from './ai.js';
import { initMarketTable, render }    from './render.js';

// ── Helpers ────────────────────────────────────────────────────
const fmt3 = n => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const esc  = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Journal ────────────────────────────────────────────────────
let jCount = 0;
function jlog(type, badge, main, why = '') {
  const body = document.getElementById('jbody');
  const el   = document.createElement('div');
  el.className = 'je';
  const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  el.innerHTML =
    `<span class="jt">${ts}</span>` +
    `<span class="jb ${type}">${esc(badge)}</span>` +
    `<div><div class="jm">${esc(main)}</div>` +
    `${why ? `<div class="jw">↳ ${esc(why)}</div>` : ''}</div>`;
  body.insertBefore(el, body.firstChild);
  if (++jCount > 200) body.removeChild(body.lastChild);
}

// ── Status helpers ─────────────────────────────────────────────
function setDot(s)   { document.getElementById('ai-dot').className = `ai-dot ${s}`; }
function setDBtn(on) { document.getElementById('btn-d').disabled = !on; }
function setCd(rem, total) {
  document.getElementById('cdn').textContent   = String(rem);
  document.getElementById('cdf').style.width   = total > 0 ? `${rem / total * 100}%` : '0%';
}

// ── Decision cycle ─────────────────────────────────────────────
let busy = false, warnShown = false;

async function decide() {
  if (busy) return;
  busy = true;
  const rt = document.getElementById('rtext');
  rt.className = 'rt thinking';
  rt.innerHTML = '<span class="blink">Analyse en cours</span>';
  setDBtn(false);
  setDot('busy');

  let result, fallback = false;
  try {
    result = await askGemini();
    setDot('ok');
  } catch (e) {
    fallback = true;
    result   = heuri();
    setDot('err');
    if (!warnShown) {
      warnShown = true;
      const msg = e.code === 'NO_KEY'
        ? 'Aucune clé API'
        : (e.message ?? 'Erreur API').slice(0, 70);
      jlog('warn', 'SYS', `${msg} — pilote heuristique actif`);
    }
  }

  rt.className   = `rt${fallback ? ' fallback' : ''}`;
  rt.textContent = result.reading || '—';

  let n = 0;
  for (const o of (result.orders ?? []).slice(0, 3)) {
    if (!o?.action || !o?.ticker) continue;
    const done = doTrade(o.action, o.ticker, Math.max(1, Math.floor(+o.shares || 1)));
    if (!done) continue;
    n++;
    const tot    = done.shares * done.p;
    const pnlStr = done.pnl != null
      ? (done.pnl >= 0 ? ` +$${done.pnl.toFixed(0)}` : ` -$${Math.abs(done.pnl).toFixed(0)}`)
      : '';
    jlog(
      o.action.toLowerCase(),
      `${o.action} ${o.ticker}`,
      `${done.shares}×$${done.p.toFixed(2)}=$${fmt3(tot)}${pnlStr}`,
      o.reason || '',
    );
  }
  if (!n && !fallback) jlog('hold', 'HOLD', 'Aucun ordre — portefeuille conservé');

  S.dec++;
  document.getElementById('dec-meta').textContent = `${S.dec} décision${S.dec !== 1 ? 's' : ''}`;
  render();
  busy = false;
  setDBtn(true);
}

// ── Auto pilot ─────────────────────────────────────────────────
let autoOn = false, cdTimer = null;

function toggleAuto() {
  autoOn = !autoOn;
  document.getElementById('cdw').style.display = autoOn ? 'flex' : 'none';
  document.getElementById('auto-btn').classList.toggle('on', autoOn);
  document.getElementById('auto-txt').textContent  = autoOn ? 'Auto actif'  : 'Mode Auto';
  document.getElementById('auto-pill').textContent = autoOn ? 'ON' : 'OFF';

  if (autoOn) {
    runAuto();
  } else {
    clearInterval(cdTimer);
    setCd(AUTO_SEC, AUTO_SEC);
  }
}

async function runAuto() {
  if (!autoOn) return;
  setCd(0, AUTO_SEC);
  await decide();
  if (!autoOn) return;
  let rem = AUTO_SEC;
  setCd(rem, rem);
  cdTimer = setInterval(() => {
    rem--;
    setCd(rem, AUTO_SEC);
    if (rem <= 0) { clearInterval(cdTimer); runAuto(); }
  }, 1_000);
}

// ── Reset ──────────────────────────────────────────────────────
function onReset() {
  clearInterval(cdTimer);
  if (autoOn) {
    autoOn = false;
    document.getElementById('cdw').style.display = 'none';
    document.getElementById('auto-btn').classList.remove('on');
    document.getElementById('auto-txt').textContent  = 'Mode Auto';
    document.getElementById('auto-pill').textContent = 'OFF';
  }
  busy = warnShown = false;
  resetState();
  document.getElementById('jbody').innerHTML     = '';
  document.getElementById('dec-meta').textContent = '0 décision';
  jCount = 0;
  const rt = document.getElementById('rtext');
  rt.className   = 'rt idle';
  rt.textContent = 'En attente de la première décision…';
  initMarketTable();
  render();
  jlog('info', 'SYS', 'Terminal réinitialisé — $100 000 disponibles');
}

// ── Config.json key loading ────────────────────────────────────
async function loadConfig() {
  try {
    const r = await fetch('config.json');
    if (!r.ok) return;
    const cfg = await r.json();
    if (cfg?.geminiApiKey) {
      document.getElementById('ainp').value = cfg.geminiApiKey;
      localStorage.setItem(LS_KEY, cfg.geminiApiKey);
    }
  } catch { /* config.json absent — fine */ }
}

// ── Boot ───────────────────────────────────────────────────────
async function boot() {
  await loadConfig();

  const stored = localStorage.getItem(LS_KEY);
  if (stored && !document.getElementById('ainp').value) {
    document.getElementById('ainp').value = stored;
  }

  document.getElementById('auto-btn').addEventListener('click', toggleAuto);
  document.getElementById('btn-d').addEventListener('click', () => { if (!autoOn) decide(); });
  document.getElementById('btn-rst').addEventListener('click', onReset);
  document.getElementById('ainp').addEventListener('input', e => {
    localStorage.setItem(LS_KEY, e.target.value.trim());
  });

  initMarketTable();
  render();
  setInterval(marketTick, TICK_MS);
  jlog('info', 'SYS', 'Paper Desk prêt — 50 titres · 7 secteurs · Gemini 2.0 Flash', '$100 000 fictifs · Mode Auto actif');
  toggleAuto();
}

boot();
