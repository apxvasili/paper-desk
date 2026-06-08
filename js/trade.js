import { MAX_BUY_PCT } from './config.js';
import { S, prices }   from './state.js';

export function total() {
  let v = S.cash;
  for (const [id, pos] of Object.entries(S.pos)) {
    if (pos.shares > 0) v += prices[id] * pos.shares;
  }
  return v;
}

export function doTrade(action, tid, shares) {
  const p = prices[tid];
  if (!p || shares < 1) return null;

  if (action === 'BUY') {
    const maxShares = Math.floor(
      Math.min(shares, S.cash / p, (S.cash * MAX_BUY_PCT) / p),
    );
    if (maxShares < 1) return null;
    S.cash -= p * maxShares;
    if (!S.pos[tid]) S.pos[tid] = { shares: 0, avg: 0 };
    const pos = S.pos[tid];
    pos.avg    = (pos.shares * pos.avg + maxShares * p) / (pos.shares + maxShares);
    pos.shares += maxShares;
    return { action, tid, shares: maxShares, p };
  }

  if (action === 'SELL') {
    const pos = S.pos[tid];
    if (!pos?.shares) return null;
    const n   = Math.min(shares, pos.shares);
    const pnl = (p - pos.avg) * n;
    S.trades.push({ action, tid, shares: n, price: p, pnl });
    S.cash    += p * n;
    pos.shares -= n;
    if (pos.shares <= 0) delete S.pos[tid];
    return { action, tid, shares: n, p, pnl };
  }

  return null;
}
