import { data, upsertItem, removeItem, genId, logMovimentacao } from '../store.js';
import { formatDate, daysUntil, statusBadge } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { navigate } from '../router.js';

window.openModal = openModal;
window.closeModal = closeModal;

var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export function renderMaletas() {
  var search = (document.getElementById('searchMaleta').value || '').toLowerCase();
  var container = document.getElementById('maletaMonthGroups');
  var empty = document.getElementById('emptyMaletas');
  container.innerHTML = '';

  var filtered = [];
  for (var i = 0; i < data.maletas.length; i++) {
    var m = data.maletas[i];
    if (search && m.nome.toLowerCase().indexOf(search) === -1) continue;
    filtered.push(m);
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.sort(function(a, b) { return (b.dataRecebimento || '').localeCompare(a.dataRecebimento || ''); });

  var groups = {};
  for (var j = 0; j < filtered.length; j++) {
    var m2 = filtered[j];
    var date = m2.dataRecebimento ? new Date(m2.dataRecebimento + 'T00:00:00') : null;
    var key = date ? MONTHS[date.getMonth()] + ' ' + date.getFullYear() : 'Sem data';
    if (!groups[key]) groups[key] = [];
    groups[key].push(m2);
  }

  for (var g in groups) {
    var groupDiv = document.createElement('div');
    groupDiv.className = 'maleta-month-group';
    groupDiv.innerHTML = '<h3 class="maleta-month-title">' + g + '</h3><div class="maleta-card-grid">';
    var cardsHtml = '';
    for (var k = 0; k < groups[g].length; k++) {
      var m3 = groups[g][k];
      var dataInicio = m3.dataRecebimento ? formatDate(m3.dataRecebimento) : '-';
      var dataFim = m3.dataLimite ? formatDate(m3.dataLimite) : '-';
      var origem = m3.origem || 'Sem origem';
      var diasInfo = '';
      if (m3.status === 'Ativa' && m3.dataLimite) {
        var diff = daysUntil(m3.dataLimite);
        if (diff !== null && diff >= 0) {
          diasInfo = diff <= 15
            ? '<span class="maleta-card-urgente"><i class="fas fa-exclamation-circle"></i> ' + diff + ' dias</span>'
            : '<span class="maleta-card-prazo"><i class="fas fa-clock"></i> ' + diff + ' dias</span>';
        }
      }
      cardsHtml +=
        '<div class="maleta-card" onclick="window.abrirMaleta(\'' + m3.id + '\')">' +
        '<div class="maleta-card-top">' +
        '<div class="maleta-card-icon"><i class="fas fa-suitcase"></i></div>' +
        '<div class="maleta-card-badge">' + statusBadge(m3.status) + '</div>' +
        '</div>' +
        '<div class="maleta-card-body">' +
        '<div class="maleta-card-nome">' + m3.nome + '</div>' +
        '<div class="maleta-card-origem">' + origem + '</div>' +
        '<div class="maleta-card-datas"><i class="fas fa-calendar-alt"></i> ' + dataInicio + ' \u2192 ' + dataFim + '</div>' +
        '</div>' +
        '<div class="maleta-card-footer">' +
        '<div>' + (diasInfo || '<span class="maleta-card-prazo">' + m3.status + '</span>') + '</div>' +
        '<div class="maleta-card-actions" onclick="event.stopPropagation()">' +
        '<button class="btn-icon" onclick="window.abrirMaleta(\'' + m3.id + '\')" title="Abrir"><i class="fas fa-folder-open"></i></button>' +
        '<button class="btn-icon rose" onclick="window.abrirVendasMaleta(\'' + m3.id + '\')" title="Vender"><i class="fas fa-shopping-cart"></i></button>' +
        '<button class="btn-icon" onclick="window.editarMaleta(\'' + m3.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon danger" onclick="window.excluirMaleta(\'' + m3.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</div>' +
        '</div></div>';
    }
    groupDiv.innerHTML += cardsHtml + '</div></div>';
    container.appendChild(groupDiv);
  }
}
window.renderMaletas = renderMaletas;

export async function salvarMaleta() {
  var editId = document.getElementById('maletaEditId').value;
  var nome = document.getElementById('maletaNome').value.trim();

  if (!nome) { showToast('O campo Nome \u00e9 obrigat\u00f3rio.', 'error'); return; }

  var obj = {
    nome: nome,
    origem: document.getElementById('maletaOrigem').value.trim(),
    dataRecebimento: document.getElementById('maletaDataRecebimento').value,
    dataLimite: document.getElementById('maletaDataLimite').value,
    status: document.getElementById('maletaStatus').value,
    observacoes: document.getElementById('maletaObservacoes').value.trim()
  };

  try {
    if (editId) {
      obj.id = editId;
    }
    await upsertItem('maletas', obj);

    if (!editId) {
      logMovimentacao('maleta_criada', 'Maleta "' + nome + '" recebida', { maletaId: obj.id, nome: nome });
    } else if (obj.status === 'Finalizada') {
      logMovimentacao('maleta_finalizada', 'Maleta "' + nome + '" finalizada', { maletaId: editId, nome: nome });
    } else if (obj.status === 'Devolvida') {
      logMovimentacao('maleta_devolvida', 'Maleta "' + nome + '" devolvida', { maletaId: editId, nome: nome });
    }

    closeModal('modalMaleta');
    resetMaletaForm();
    renderMaletas();
    if (!editId) showCelebration();
  } catch (e) {
    showToast('Erro ao salvar maleta.', 'error');
    console.error(e);
  }
}
window.salvarMaleta = salvarMaleta;

export function editarMaleta(id) {
  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === id) {
      var m = data.maletas[i];
      document.getElementById('maletaEditId').value = m.id;
      document.getElementById('maletaNome').value = m.nome;
      document.getElementById('maletaOrigem').value = m.origem || '';
      document.getElementById('maletaDataRecebimento').value = m.dataRecebimento || '';
      document.getElementById('maletaDataLimite').value = m.dataLimite || '';
      document.getElementById('maletaStatus').value = m.status || 'Ativa';
      document.getElementById('maletaObservacoes').value = m.observacoes || '';
      document.getElementById('modalMaletaTitle').textContent = 'Editar Maleta';
      openModal('modalMaleta');
      return;
    }
  }
}
window.editarMaleta = editarMaleta;

export async function excluirMaleta(id) {
  var produtosNaMaleta = [];
  for (var i = 0; i < data.produtos.length; i++) {
    if (data.produtos[i].maletaId === id) {
      produtosNaMaleta.push(data.produtos[i]);
    }
  }
  var qtd = produtosNaMaleta.length;
  var msg = qtd > 0
    ? 'Voc\u00ea vai apagar ' + qtd + ' produto' + (qtd > 1 ? 's' : '') + ' que possui na maleta. Deseja continuar?'
    : 'Tem certeza que deseja excluir esta maleta?';
  var c = await showConfirm(msg);
  if (!c) return;
  try {
    for (var j = 0; j < produtosNaMaleta.length; j++) {
      await removeItem('produtos', produtosNaMaleta[j].id);
    }
    await removeItem('maletas', id);
    renderMaletas();
  } catch (e) {
    showToast('Erro ao excluir maleta.', 'error');
    console.error(e);
  }
}
window.excluirMaleta = excluirMaleta;

export function abrirMaleta(id) {
  window._currentMaletaId = id;
  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === id) {
      document.getElementById('mdMaletaNome').textContent = data.maletas[i].nome;
      break;
    }
  }
  navigate('maleta-detail');
  if (window.renderProdutosDaMaleta) window.renderProdutosDaMaleta();
}
window.abrirMaleta = abrirMaleta;

export function voltarParaMaletas() {
  window._currentMaletaId = null;
  navigate('maletas');
}
window.voltarParaMaletas = voltarParaMaletas;

export function resetMaletaForm() {
  document.getElementById('maletaEditId').value = '';
  document.getElementById('maletaNome').value = '';
  document.getElementById('maletaOrigem').value = '';
  document.getElementById('maletaDataRecebimento').value = '';
  document.getElementById('maletaDataLimite').value = '';
  document.getElementById('maletaStatus').value = 'Ativa';
  document.getElementById('maletaObservacoes').value = '';
  document.getElementById('modalMaletaTitle').textContent = 'Nova Maleta';
}
window.resetMaletaForm = resetMaletaForm;
