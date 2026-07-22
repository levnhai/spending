export function formatVND(amount: number, isVisible: boolean = true): string {
  if (!isVisible) return '••••••••';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
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
