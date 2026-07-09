import { data, upsertItem, removeItem, genId, logMovimentacao } from '../store.js';
import { formatDate, daysUntil } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { createAutocomplete } from '../components/autocomplete.js';

window.openModal = openModal;
window.closeModal = closeModal;

export var reservaAutocomplete = null

export function initReservaAutocomplete() {
  var el = document.getElementById('ac-reservaCliente')
  if (!el) return
  reservaAutocomplete = createAutocomplete({
    inputId: 'ac-reservaCliente',
    hiddenId: 'reservaCliente',
    items: data.clientes,
    displayField: 'nome',
    searchFields: ['nome', 'telefone', 'instagram']
  })
}

export function resetReservaForm() {
  document.getElementById('reservaEditId').value = '';
  document.getElementById('reservaProduto').value = '';
  if (reservaAutocomplete) reservaAutocomplete.clear();
  document.getElementById('reservaDataReserva').value = '';
  document.getElementById('reservaDataExpiracao').value = '';
  document.getElementById('reservaStatus').value = 'Ativa';
  document.getElementById('modalReservaTitle').textContent = 'Nova Reserva';
}
window.resetReservaForm = resetReservaForm;

export async function renderReservas() {
  var autoExpired = false;
  for (var i = 0; i < data.reservas.length; i++) {
    var r = data.reservas[i];
    if (r.status === 'Ativa' && r.dataExpiracao) {
      var days = daysUntil(r.dataExpiracao);
      if (days !== null && days < 0) {
        r.status = 'Expirada';
        for (var pi = 0; pi < data.produtos.length; pi++) {
          if (data.produtos[pi].id === r.produtoId && data.produtos[pi].status === 'Reservado') {
            data.produtos[pi].status = 'Dispon\u00edvel';
            try { await upsertItem('produtos', data.produtos[pi]); } catch (e) { }
            break;
          }
        }
        try { await upsertItem('reservas', r); } catch (e) { }
      }
    }
  }

  var search = (document.getElementById('searchReserva').value || '').toLowerCase();
  var container = document.getElementById('listaReservas');
  var empty = document.getElementById('emptyReservas');
  if (!container) return;
  container.innerHTML = '';

  var filtered = [];
  for (var j = 0; j < data.reservas.length; j++) {
    var r2 = data.reservas[j];
    if (search) {
      var matched = false;
      for (var si = 0; si < data.produtos.length; si++) {
        if (data.produtos[si].id === r2.produtoId && data.produtos[si].nome.toLowerCase().indexOf(search) > -1) { matched = true; break; }
      }
      if (!matched) {
        for (var si2 = 0; si2 < data.clientes.length; si2++) {
          if (data.clientes[si2].id === r2.clienteId && data.clientes[si2].nome.toLowerCase().indexOf(search) > -1) { matched = true; break; }
        }
      }
      if (!matched) continue;
    }
    filtered.push(r2);
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  var statusIcons = { 'Ativa':'clock','Expirada':'times-circle','Cancelada':'ban','Convertida':'check-circle' };
  var statusColors = { 'Ativa':'pending','Expirada':'','Cancelada':'','Convertida':'sold' };

  for (var k = 0; k < filtered.length; k++) {
    var r3 = filtered[k];
    var prodNome = '';
    for (var a = 0; a < data.produtos.length; a++) {
      if (data.produtos[a].id === r3.produtoId) { prodNome = data.produtos[a].nome; break; }
    }
    var cliNome = '';
    for (var b = 0; b < data.clientes.length; b++) {
      if (data.clientes[b].id === r3.clienteId) { cliNome = data.clientes[b].nome; break; }
    }

    var card = document.createElement('div');
    card.className = 'venda-card';
    card.onclick = function() { window.editarReserva(this.dataset.reservaId) };
    card.dataset.reservaId = r3.id;

    var icon = statusIcons[r3.status] || 'clock';
    var colorClass = statusColors[r3.status] || '';

    card.innerHTML =
      '<div class="venda-icon ' + colorClass + '"><i class="fas fa-' + icon + '"></i></div>' +
      '<div class="venda-info">' +
      '<strong>' + prodNome + '</strong>' +
      '<span>' + cliNome + '</span>' +
      '<div class="venda-meta">' +
      '<span>' + formatDate(r3.dataReserva) + ' \u2192 ' + formatDate(r3.dataExpiracao) + '</span>' +
      '</div></div>' +
      '<div class="venda-valor">' +
      '<span class="badge badge-' + (r3.status === 'Ativa' ? 'warning' : r3.status === 'Convertida' ? 'success' : 'neutral') + '">' + r3.status + '</span>' +
      '<button class="btn-icon danger" onclick="event.stopPropagation();window.excluirReserva(\'' + r3.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>';

    container.appendChild(card);
  }
}
window.renderReservas = renderReservas;

export async function salvarReserva() {
  var editId = document.getElementById('reservaEditId').value;
  var produtoId = document.getElementById('reservaProduto').value;
  var clienteId = document.getElementById('reservaCliente').value;

  if (!produtoId) { showToast('Selecione um produto.', 'error'); return; }
  if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }

  var obj = {
    produtoId: produtoId,
    clienteId: clienteId,
    dataReserva: document.getElementById('reservaDataReserva').value,
    dataExpiracao: document.getElementById('reservaDataExpiracao').value,
    status: document.getElementById('reservaStatus').value
  };

  try {
    if (editId) {
      obj.id = editId;
      await upsertItem('reservas', obj);
    } else {
      await upsertItem('reservas', obj);
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === produtoId && data.produtos[pi].status === 'Dispon\u00edvel') {
          data.produtos[pi].status = 'Reservado';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }
    if (!editId) {
      logMovimentacao('reserva_criada', 'Reserva criada', { reservaId: obj.id, produtoId: produtoId, clienteId: clienteId });
    } else {
      var resStatus = document.getElementById('reservaStatus').value;
      if (resStatus === 'Convertida') {
        logMovimentacao('reserva_convertida', 'Reserva convertida em venda', { reservaId: editId });
      } else if (resStatus === 'Cancelada') {
        logMovimentacao('reserva_cancelada', 'Reserva cancelada', { reservaId: editId });
      }
    }
    closeModal('modalReserva');
    resetReservaForm();
    renderReservas();
    if (!editId) showCelebration();
  } catch (e) {
    showToast('Erro ao salvar reserva.', 'error');
    console.error(e);
  }
}
window.salvarReserva = salvarReserva;

export function editarReserva(id) {
  for (var i = 0; i < data.reservas.length; i++) {
    if (data.reservas[i].id === id) {
      var r = data.reservas[i];
      document.getElementById('reservaEditId').value = r.id;
      document.getElementById('reservaProduto').value = r.produtoId;
      if (reservaAutocomplete) reservaAutocomplete.setValue(r.clienteId);
      document.getElementById('reservaDataReserva').value = r.dataReserva || '';
      document.getElementById('reservaDataExpiracao').value = r.dataExpiracao || '';
      document.getElementById('reservaStatus').value = r.status || 'Ativa';
      document.getElementById('modalReservaTitle').textContent = 'Editar Reserva';
      openModal('modalReserva');
      return;
    }
  }
}
window.editarReserva = editarReserva;

export async function excluirReserva(id) {
  var c = await showConfirm('Tem certeza que deseja excluir esta reserva?');
  if (!c) return;
  try {
    var prodId = null;
    for (var i = 0; i < data.reservas.length; i++) {
      if (data.reservas[i].id === id) { prodId = data.reservas[i].produtoId; break; }
    }
    await removeItem('reservas', id);
    if (prodId) {
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === prodId && data.produtos[pi].status === 'Reservado') {
          data.produtos[pi].status = 'Dispon\u00edvel';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }
    logMovimentacao('reserva_excluida', 'Reserva excluída', { reservaId: id });
    renderReservas();
  } catch (e) {
    showToast('Erro ao excluir reserva.', 'error');
    console.error(e);
  }
}
window.excluirReserva = excluirReserva;
