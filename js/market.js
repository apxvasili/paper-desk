import { TICKERS, HIST_LEN, EQ_LEN } from './config.js';
import { S, prices, hist, trnd }      from './state.js';
import { total }                       from './trade.js';

export function marketTick() {
  S.tick++;
  for (const t of TICKERS) {
    if (Math.random() < 0.015) trnd[t.id] = (Math.random() - 0.5) * 0.003;
    const vol   = 0.006 + Math.random() * 0.005;
    const shock = Math.random() < 0.008 ? (Math.random() - 0.5) * 0.04 : 0;
    prices[t.id] = Math.max(
      0.01,
      +(prices[t.id] * (1 + (Math.random() - 0.5) * 2 * vol + trnd[t.id] + shock)).toFixed(2),
    );
    const h = hist[t.id];
    h.push(prices[t.id]);
    if (h.length > HIST_LEN) h.shift();
  }
  S.eqH.push(total());
  if (S.eqH.length > EQ_LEN) S.eqH.shift();
}
