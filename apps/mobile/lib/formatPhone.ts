export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (input.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('222')) return `+${digits}`;
  return `+222${digits}`;
}
