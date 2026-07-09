import { data } from '../store.js';
import { formatDate } from '../helpers.js';

var ICON_MAP = {
  venda_criada: { icon: 'fa-shopping-cart', color: 'var(--success)' },
  venda_cancelada: { icon: 'fa-ban', color: 'var(--danger)' },
  maleta_criada: { icon: 'fa-suitcase', color: 'var(--rose)' },
  maleta_finalizada: { icon: 'fa-check-circle', color: 'var(--info)' },
  maleta_devolvida: { icon: 'fa-undo', color: 'var(--warning)' },
  reposicao_realizada: { icon: 'fa-truck-loading', color: 'var(--warning)' },
  reposicao_excluida: { icon: 'fa-trash', color: 'var(--danger)' },
  produto_adicionado: { icon: 'fa-gem', color: 'var(--rose)' },
  reserva_criada: { icon: 'fa-calendar-plus', color: 'var(--warning)' },
  reserva_convertida: { icon: 'fa-check-circle', color: 'var(--success)' },
  reserva_cancelada: { icon: 'fa-calendar-times', color: 'var(--danger)' },
  reserva_excluida: { icon: 'fa-calendar-times', color: 'var(--danger)' },
  devolucao_realizada: { icon: 'fa-undo-alt', color: 'var(--warning)' }
};

function getIcon(tipo) {
  return ICON_MAP[tipo] || { icon: 'fa-clock', color: 'var(--text-secondary)' };
}

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  try {
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var ano = d.getFullYear();
    var hora = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return dia + '/' + mes + '/' + ano + ' ' + hora + ':' + min;
  } catch (e) {
    return isoStr;
  }
}

export function renderHistorico() {
  var container = document.getElementById('listaHistorico');
  var empty = document.getElementById('emptyHistorico');
  if (!container) return;
  container.innerHTML = '';

  if (data.movimentacoes.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  var sorted = data.movimentacoes.slice().sort(function(a, b) {
    return (b.criado_em || '').localeCompare(a.criado_em || '');
  });

  for (var i = 0; i < sorted.length; i++) {
    var m = sorted[i];
    var info = getIcon(m.tipo);
    var cor = info.color;

    var card = document.createElement('div');
    card.className = 'hist-card';

    card.innerHTML =
      '<div class="hist-dot" style="background:' + cor + '">' +
      '<i class="fas ' + info.icon + '"></i>' +
      '</div>' +
      '<div class="hist-content">' +
      '<div class="hist-desc">' + m.descricao + '</div>' +
      '<div class="hist-time">' + formatDateTime(m.criado_em) + '</div>' +
      '</div>';

    container.appendChild(card);
  }
}
window.renderHistorico = renderHistorico;
