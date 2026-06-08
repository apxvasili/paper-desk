export const INITIAL_CASH = 100_000;
export const TICK_MS      = 1100;
export const AUTO_SEC     = 9;
export const HIST_LEN     = 50;
export const EQ_LEN       = 200;
export const MAX_BUY_PCT  = 0.12;
export const GEMINI_MODEL = 'gemini-2.0-flash';
export const LS_KEY       = 'pd_gemini_v4';

export const SECTORS = {
  TECH: { label: 'Technologie',   color: '#60a5fa' },
  CYBR: { label: 'Cybersécurité', color: '#a78bfa' },
  NRGY: { label: 'Énergie',       color: '#fbbf24' },
  FIN:  { label: 'Finance',       color: '#34d399' },
  HLTH: { label: 'Santé',         color: '#f87171' },
  CONS: { label: 'Consommation',  color: '#fb923c' },
  IND:  { label: 'Industrie',     color: '#94a3b8' },
};

export const TICKERS = [
  // TECH (10)
  { id: 'APEX', s: 'TECH', n: 'Apex Dynamics',      b: 142.50 },
  { id: 'NOVA', s: 'TECH', n: 'Nova Systems',        b:  87.20 },
  { id: 'FLUX', s: 'TECH', n: 'Flux Technologies',   b: 215.80 },
  { id: 'CORE', s: 'TECH', n: 'CoreTech Inc.',        b:  63.40 },
  { id: 'ZETA', s: 'TECH', n: 'Zeta Networks',        b: 308.00 },
  { id: 'BYTE', s: 'TECH', n: 'Byte Solutions',       b:  52.30 },
  { id: 'SYNC', s: 'TECH', n: 'Sync Cloud',           b: 178.90 },
  { id: 'VECT', s: 'TECH', n: 'Vector Labs',           b:  94.60 },
  { id: 'NODE', s: 'TECH', n: 'Node Systems',          b: 125.40 },
  { id: 'ARCH', s: 'TECH', n: 'Arch Computing',        b: 267.80 },
  // CYBR (5)
  { id: 'GRID', s: 'CYBR', n: 'GridSec Corp.',         b:  88.50 },
  { id: 'NEON', s: 'CYBR', n: 'Neon Security',         b: 156.70 },
  { id: 'CPHR', s: 'CYBR', n: 'Cipher Defense',        b: 203.40 },
  { id: 'SHLD', s: 'CYBR', n: 'Shield Networks',       b: 112.30 },
  { id: 'GARD', s: 'CYBR', n: 'Guard Systems',         b:  76.80 },
  // NRGY (10)
  { id: 'SOLA', s: 'NRGY', n: 'Solaris Power',         b:  48.20 },
  { id: 'ATOM', s: 'NRGY', n: 'Atom Energy',           b: 189.60 },
  { id: 'SPRK', s: 'NRGY', n: 'Spark Industries',      b:  72.40 },
  { id: 'HYDR', s: 'NRGY', n: 'Hydra Resources',       b:  34.90 },
  { id: 'VOLT', s: 'NRGY', n: 'Volt Industries',       b: 178.60 },
  { id: 'FUSE', s: 'NRGY', n: 'Fuse Energy',           b:  61.30 },
  { id: 'GLOW', s: 'NRGY', n: 'Glow Solar',            b:  29.70 },
  { id: 'WIND', s: 'NRGY', n: 'Wind Capital',          b:  55.10 },
  { id: 'DARK', s: 'NRGY', n: 'Dark Matter Power',     b: 421.50 },
  { id: 'FUZE', s: 'NRGY', n: 'Fuze Clean Energy',     b:  38.60 },
  // FIN (8)
  { id: 'MINT', s: 'FIN',  n: 'Mint Financial',        b: 143.20 },
  { id: 'VLLT', s: 'FIN',  n: 'Vault Capital',         b: 287.50 },
  { id: 'YELD', s: 'FIN',  n: 'Yield Partners',        b:  67.80 },
  { id: 'RIDG', s: 'FIN',  n: 'Ridge Asset Mgmt.',     b: 198.40 },
  { id: 'TRST', s: 'FIN',  n: 'TrustBank Corp.',       b: 312.60 },
  { id: 'LEDG', s: 'FIN',  n: 'Ledger Finance',        b:  89.30 },
  { id: 'CAPE', s: 'FIN',  n: 'Cape Investment',       b: 154.70 },
  { id: 'NEXS', s: 'FIN',  n: 'Nexus Capital',         b: 156.30 },
  // HLTH (7)
  { id: 'HLXB', s: 'HLTH', n: 'Helix Bio',             b:  44.90 },
  { id: 'CURE', s: 'HLTH', n: 'Cure Therapeutics',     b: 231.80 },
  { id: 'GENE', s: 'HLTH', n: 'Gene Dynamics',         b: 178.30 },
  { id: 'CELL', s: 'HLTH', n: 'Cell Research',         b:  92.40 },
  { id: 'DOSE', s: 'HLTH', n: 'Dose Pharma',           b: 134.60 },
  { id: 'SERA', s: 'HLTH', n: 'Sera Biotech',          b:  67.20 },
  { id: 'PULS', s: 'HLTH', n: 'Pulse Medical',         b: 198.70 },
  // CONS (7)
  { id: 'LUXE', s: 'CONS', n: 'Luxe Brands',           b: 389.50 },
  { id: 'PRSM', s: 'CONS', n: 'Prism Media',           b:  99.10 },
  { id: 'ORIN', s: 'CONS', n: 'Orion Ventures',        b: 523.70 },
  { id: 'FOMA', s: 'CONS', n: 'Forma Group',           b:  78.40 },
  { id: 'BLOM', s: 'CONS', n: 'Bloom Consumer',        b: 112.30 },
  { id: 'CRFT', s: 'CONS', n: 'Craft Industries',      b: 234.80 },
  { id: 'PVOT', s: 'CONS', n: 'Pivot Retail',          b:  58.90 },
  // IND (3)
  { id: 'FORG', s: 'IND',  n: 'Forge Manufacturing',   b: 167.40 },
  { id: 'AXLE', s: 'IND',  n: 'Axle Robotics',         b: 289.60 },
  { id: 'STEL', s: 'IND',  n: 'Steel Dynamics',        b:  72.80 },
];
