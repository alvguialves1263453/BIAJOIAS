export function formatCurrency(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d) {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export function daysUntil(d) {
  if (!d) return null;
  const target = new Date(d + 'T23:59:59');
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const badgeClasses = {
  'Ativa': 'success',
  'Finalizada': 'secondary',
  'Disponível': 'success',
  'Vendido': 'danger',
  'Reservado': 'warning',
  'Ativa': 'success',
};

export function statusBadge(st) {
  const cls = badgeClasses[st] || 'secondary';
  return '<span class="badge badge-' + cls + '">' + st + '</span>';
}
