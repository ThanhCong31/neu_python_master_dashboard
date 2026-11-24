const integer = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
export function numberText(value: number | null | undefined, digits = 0) {
  return value == null || !Number.isFinite(value) ? '—' : (digits === 0 ? integer : new Intl.NumberFormat('vi-VN',{maximumFractionDigits:digits})).format(value);
}
export function percentText(value: number | null | undefined, digits=1) { return value == null || !Number.isFinite(value) ? '—' : `${numberText(value*100,digits)}%`; }
export function moneyText(value: number | null | undefined) { return value == null || !Number.isFinite(value) ? '—' : `${numberText(value)} ₫`; }
export function compactMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e9) return `${numberText(value/1e9,2)} tỷ ₫`;
  if (Math.abs(value) >= 1e6) return `${numberText(value/1e6,2)} triệu ₫`;
  return moneyText(value);
}
export function dateText(value: string) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value); return m ? `${m[3]}/${m[2]}/${m[1]}` : value; }
