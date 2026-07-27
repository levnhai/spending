export function formatVND(amount: number, isVisible: boolean = true): string {
  if (!isVisible) return '••••••••';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberWithSpaces(val: string | number): string {
  if (val === undefined || val === null || val === '') return '';
  const raw = String(val).replace(/\D/g, '');
  if (!raw) return '';
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function parseFormattedNumber(val: string | number): number {
  if (!val) return 0;
  const raw = String(val).replace(/\D/g, '');
  return raw ? Number(raw) : 0;
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateString: string | Date): string {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
