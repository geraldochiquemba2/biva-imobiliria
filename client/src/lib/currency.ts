export function formatAOA(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Kz 0,00';
  
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function parseAOA(formatted: string): number {
  const cleaned = formatted.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
