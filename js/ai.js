import { GEMINI_MODEL, LS_KEY, MAX_BUY_PCT, TICKERS, INITIAL_CASH } from './config.js';
import { S, prices, hist } from './state.js';
import { total }            from './trade.js';

export function apiKey() {
  return document.getElementById('ainp').value.trim() || localStorage.getItem(LS_KEY) || '';
}

export function buildPrompt() {
  const tv  = total();
  const pnl = tv - INITIAL_CASH;

  const sectorPerf = {};
  for (const t of TICKERS) {
    const h  = hist[t.id], p = prices[t.id];
    const p5 = h[Math.max(0, h.length - 6)] ?? p;
    if (!sectorPerf[t.s]) sectorPerf[t.s] = { sum: 0, n: 0 };
    sectorPerf[t.s].sum += (p - p5) / p5 * 100;
    sectorPerf[t.s].n++;
  }
  const sectorLine = Object.entries(sectorPerf)
    .map(([s, v]) => `${s}:${(v.sum / v.n).toFixed(1)}%`)
    .join(' ');

  const snap = TICKERS.map(t => {
    const h  = hist[t.id], p = prices[t.id];
    const p1 = h[h.length - 2] ?? p;
    const p5 = h[Math.max(0, h.length - 6)] ?? p;
    const pos = S.pos[t.id];
    const held = pos?.shares
      ? ` HELD:${pos.shares}@${pos.avg.toFixed(1)} PNL:${((p - pos.avg) / pos.avg * 100).toFixed(1)}%`
      : '';
    return `${t.id} $${p.toFixed(2)} d1:${((p - p1) / p1 * 100).toFixed(1)}% d5:${((p - p5) / p5 * 100).toFixed(1)}%${held}`;
  }).join('\n');

  return `Trader algo marché FICTIF simulé. Argent 100% fictif.
PORTFOLIO: Cash=$${S.cash.toFixed(0)} Total=$${tv.toFixed(0)} PnL=${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)} (${(pnl / INITIAL_CASH * 100).toFixed(2)}%) Décisions:${S.dec}
SECTEURS (Δ5t moy): ${sectorLine}
TITRES (50):
${snap}
RÈGLES: max 3 ordres. BUY max ${(MAX_BUY_PCT * 100).toFixed(0)}% du cash. SELL max 100% pos. Ose des convictions, diversifie.
JSON pur uniquement:
{"reading":"2 phrases analyse style trader senior en français","orders":[{"action":"BUY","ticker":"APEX","shares":5,"reason":"motif"},…]}`;
}

async function fetchWithTimeout(url, opts, ms = 15_000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

export async function askGemini() {
  const key = apiKey();
  if (!key) throw Object.assign(new Error('Aucune clé API'), { code: 'NO_KEY' });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents:         [{ parts: [{ text: buildPrompt() }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 700, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  const m    = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Réponse JSON invalide');
  return JSON.parse(m[0]);
}

export function heuri() {
  const snap = TICKERS.map(t => {
    const h  = hist[t.id], p = prices[t.id];
    const p5 = h[Math.max(0, h.length - 6)] ?? p;
    const pos = S.pos[t.id];
    return { id: t.id, p, t5: (p - p5) / p5 * 100, sh: pos?.shares ?? 0, avg: pos?.avg ?? 0 };
  });

  const orders = [];
  const sorted = [...snap].sort((a, b) => b.t5 - a.t5);

  const buy = sorted.find(s => s.t5 > 0.4 && s.sh < 15);
  if (buy && S.cash > buy.p * 2) {
    const sh = Math.max(1, Math.floor(S.cash * MAX_BUY_PCT / buy.p));
    orders.push({ action: 'BUY', ticker: buy.id, shares: sh, reason: `momentum +${buy.t5.toFixed(1)}%` });
  }

  const loser = snap
    .filter(s => s.sh > 0)
    .sort((a, b) => (a.p - a.avg) / a.avg - (b.p - b.avg) / b.avg)[0];

  if (loser) {
    const pp = (loser.p - loser.avg) / loser.avg * 100;
    if (pp < -2.5 || loser.t5 < -0.8) {
      orders.push({ action: 'SELL', ticker: loser.id, shares: Math.ceil(loser.sh / 2), reason: `P&L ${pp.toFixed(1)}%` });
    }
  }

  const best = sorted[0];
  return {
    reading: `[Heuristique] ${best.t5 > 0.5
      ? `Force sur ${best.id} (+${best.t5.toFixed(1)}%).`
      : 'Marché neutre.'} ${orders.length ? 'Ajustement portefeuille.' : 'Conservation des positions.'}`,
    orders,
    _fallback: true,
  };
}
