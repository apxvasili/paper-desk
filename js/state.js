import { INITIAL_CASH, TICKERS } from './config.js';

function mkPortfolio() {
  return {
    cash:   INITIAL_CASH,
    pos:    {},
    trades: [],
    eqH:    [INITIAL_CASH],
    tick:   0,
    dec:    0,
  };
}

// All exports are mutable objects — mutated in place so every importer
// always holds the current value without re-importing.
export const S      = mkPortfolio();
export const prices = Object.fromEntries(TICKERS.map(t => [t.id, t.b]));
export const hist   = Object.fromEntries(TICKERS.map(t => [t.id, Array(6).fill(t.b)]));
export const trnd   = Object.fromEntries(TICKERS.map(t => [t.id, (Math.random() - 0.5) * 0.0015]));

export function resetState() {
  Object.assign(S, mkPortfolio());
  for (const t of TICKERS) {
    prices[t.id] = t.b;
    hist[t.id]   = Array(6).fill(t.b);
    trnd[t.id]   = (Math.random() - 0.5) * 0.0015;
  }
}
