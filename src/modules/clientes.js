import { data, upsertItem, removeItem } from '../store.js'
import { formatCurrency, formatDate } from '../helpers.js'
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js'

window.openModal = openModal;
window.closeModal = closeModal;

export function renderClientes() {
  var search = (document.getElementById('searchCliente').value || '').toLowerCase();
  var grid = document.getElementById('gridClientes');
  var empty = document.getElementById('emptyClientes');
  if (!grid) return;
  grid.innerHTML = '';

  var filtered = [];
  for (var i = 0; i < data.clientes.length; i++) {
    var c = data.clientes[i];
    if (search && c.nome.toLowerCase().indexOf(search) === -1 && (c.telefone || '').toLowerCase().indexOf(search) === -1 && (c.instagram || '').toLowerCase().indexOf(search) === -1) continue;
    filtered.push(c);
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  for (var j = 0; j < filtered.length; j++) {
    var c2 = filtered[j];
    var totalGasto = 0;
    for (var k = 0; k < data.vendas.length; k++) {
      if (data.vendas[k].clienteId === c2.id && data.vendas[k].recebido) {
        totalGasto += data.vendas[k].valor - (data.vendas[k].desconto || 0);
      }
    }
    var numeroWhats = c2.whatsapp || c2.telefone || ''
    var initial = c2.nome ? c2.nome.charAt(0).toUpperCase() : '?';
    var card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML =
      '<div class="cliente-avatar" onclick="window.verCliente(\'' + c2.id + '\')">' + initial + '</div>' +
      '<div class="cliente-info">' +
      '<div class="cliente-nome" onclick="window.verCliente(\'' + c2.id + '\')">' + c2.nome + '</div>' +
      '<div class="cliente-contato">' + (numeroWhats || c2.instagram || '-') + '</div>' +
      '<div class="cliente-gasto">Total: ' + formatCurrency(totalGasto) + '</div>' +
      '</div>' +
      '<div class="cliente-actions">' +
      (numeroWhats ? '<button class="btn-icon whatsapp" onclick="event.stopPropagation();window.chamarWhatsapp(\'' + c2.id + '\')" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>' : '') +
      '<button class="btn-icon" onclick="window.editarCliente(\'' + c2.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
      '<button class="btn-icon danger" onclick="window.excluirCliente(\'' + c2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>';
    grid.appendChild(card);
  }
}
window.renderClientes = renderClientes;

window.chamarWhatsapp = function(id) {
  for (var i = 0; i < data.clientes.length; i++) {
    if (data.clientes[i].id === id) {
      var c = data.clientes[i]
      var num = c.whatsapp || c.telefone || ''
      if (!num) { showToast('Cliente n\u00e3o possui n\u00famero.', 'error'); return }
      var cleaned = num.replace(/\D/g, '')
      if (cleaned.charAt(0) === '0') cleaned = cleaned.slice(1)
      if (cleaned.indexOf('55') !== 0) cleaned = '55' + cleaned
      window.open('https://wa.me/' + cleaned, '_blank')
      return
    }
  }
}

export async function salvarCliente() {
  var editId = document.getElementById('clienteEditId').value;
  var nome = document.getElementById('clienteNome').value.trim();

  if (!nome) { showToast('O campo Nome \u00e9 obrigat\u00f3rio.', 'error'); return; }

  var obj = {
    nome: nome,
    telefone: document.getElementById('clienteTelefone').value.trim(),
    instagram: document.getElementById('clienteInstagram').value.trim(),

    observacoes: document.getElementById('clienteObservacoes').value.trim()
  };

  try {
    var saved;
    if (editId) {
      obj.id = editId;
      saved = await upsertItem('clientes', obj);
    } else {
      saved = await upsertItem('clientes', obj);
    }

    closeModal('modalCliente');
    resetClienteForm();
    renderClientes();
    if (!editId) showCelebration();

    if (!editId && saved) {
      var mvSel = document.getElementById('mvCliente');
      if (mvSel) {
        popularSelectCliente('mvCliente');
        mvSel.value = saved.id;
      }
    }
  } catch (e) {
    showToast('Erro ao salvar cliente.', 'error');
    console.error(e);
  }
}
window.salvarCliente = salvarCliente;

export function editarCliente(id) {
  for (var i = 0; i < data.clientes.length; i++) {
    if (data.clientes[i].id === id) {
      var c = data.clientes[i];
      document.getElementById('clienteEditId').value = c.id;
      document.getElementById('clienteNome').value = c.nome;
      document.getElementById('clienteTelefone').value = c.telefone || '';
      document.getElementById('clienteInstagram').value = c.instagram || '';

      document.getElementById('clienteObservacoes').value = c.observacoes || '';
      document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
      openModal('modalCliente');
      return;
    }
  }
}
window.editarCliente = editarCliente;

export async function excluirCliente(id) {
  var c = await showConfirm('Tem certeza que deseja excluir este cliente?');
  if (!c) return;
  try {
    await removeItem('clientes', id);
    renderClientes();
  } catch (e) {
    showToast('Erro ao excluir cliente.', 'error');
    console.error(e);
  }
}
window.excluirCliente = excluirCliente;

export function verCliente(id) {
  for (var i = 0; i < data.clientes.length; i++) {
    if (data.clientes[i].id === id) {
      var c = data.clientes[i];
      var body = document.getElementById('modalClienteViewBody');
      if (!body) return;

      var totalGasto = 0;
      var totalAberto = 0;
      var comprasHtml = '';
      for (var j = 0; j < data.vendas.length; j++) {
        var v = data.vendas[j];
        if (v.clienteId === c.id) {
          var total = v.valor - (v.desconto || 0);
          totalGasto += total;
          if (!v.recebido) totalAberto += total;

          var prodNome = '';
          for (var k = 0; k < data.produtos.length; k++) {
            if (data.produtos[k].id === v.produtoId) { prodNome = data.produtos[k].nome; break; }
          }

          var isCarne = v.formaPagamento === 'Carn\u00ea'
          var extraInfo = ''
          if (isCarne && v.carneParcelas) {
            var parc = parseInt(v.carneParcelas) || 1
            var valParcela = parc > 0 ? total / parc : total
            extraInfo =
              '<span class="cliente-carne-info">' +
              parc + 'x de ' + formatCurrency(valParcela) +
              (v.carneVencimento ? ' · 1\u00ba venc: ' + formatDate(v.carneVencimento) : '') +
              '</span>'
          }

          var recebidoTag = v.recebido
            ? '<span class="badge badge-success" style="font-size:10px">Pago</span>'
            : '<span class="badge badge-warning" style="font-size:10px">Pendente</span>'

          comprasHtml += '<div class="venda-card cliente-view-venda">' +
            '<div class="venda-icon" style="width:32px;height:32px;font-size:12px"><i class="fas fa-receipt"></i></div>' +
            '<div class="venda-info">' +
            '<strong style="font-size:13px">' + prodNome + '</strong>' +
            '<div class="venda-meta">' +
            '<span>' + formatDate(v.data) + '</span>' +
            '<span>' + (v.formaPagamento || '-') + '</span>' +
            '</div>' +
            extraInfo +
            '</div>' +
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0">' +
            '<span style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap">' + formatCurrency(total) + '</span>' +
            recebidoTag +
            '</div>' +
            '</div>'
        }
      }

      var numWhats = c.whatsapp || c.telefone || ''

      body.innerHTML =
        '<div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">' + c.nome + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">' + (c.telefone || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">WhatsApp</span><span class="detail-value">' + (c.whatsapp || '-') + '</span></div>' +
        (c.instagram ? '<div class="detail-row"><span class="detail-label">Instagram</span><span class="detail-value">' + c.instagram + '</span></div>' : '') +

        '<div class="detail-row" style="border-bottom:none"><span class="detail-label">Total Gasto</span><span class="detail-value" style="color:var(--rose);font-weight:700">' + formatCurrency(totalGasto) + '</span></div>' +
        (totalAberto > 0
          ? '<div class="detail-row" style="border-bottom:none"><span class="detail-label" style="color:var(--warning)">Em Aberto</span><span class="detail-value" style="color:var(--warning);font-weight:700">' + formatCurrency(totalAberto) + '</span></div>'
          : '') +
        (numWhats
          ? '<div style="padding:8px 0"><button class="btn-whatsapp-full" onclick="window.chamarWhatsapp(\'' + id + '\')"><i class="fab fa-whatsapp"></i> Chamar no WhatsApp</button></div>'
          : '') +
        (c.observacoes ? '<div class="detail-row"><span class="detail-label">Obs</span><span class="detail-value">' + c.observacoes + '</span></div>' : '') +
        '<div style="margin-top:16px;font-size:13px;font-weight:700;color:var(--text-secondary);margin-bottom:8px">Hist\u00f3rico de Compras</div>' +
        (comprasHtml || '<p style="color:var(--text-light);font-size:13px">Nenhuma compra encontrada.</p>');

      openModal('modalClienteView');
      return;
    }
  }
}
window.verCliente = verCliente;

export function resetClienteForm() {
  document.getElementById('clienteEditId').value = '';
  document.getElementById('clienteNome').value = '';
  document.getElementById('clienteTelefone').value = '';
  document.getElementById('clienteInstagram').value = '';
  document.getElementById('clienteObservacoes').value = '';
  document.getElementById('modalClienteTitle').textContent = 'Novo Cliente';
}
window.resetClienteForm = resetClienteForm;

export function popularSelectCliente(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione um cliente</option>';
  for (var i = 0; i < data.clientes.length; i++) {
    var c = data.clientes[i];
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome + ' (' + (c.telefone || c.instagram || '') + ')';
    sel.appendChild(opt);
  }
  var optNew = document.createElement('option');
  optNew.value = 'new';
  optNew.textContent = '+ Novo Cliente';
  sel.appendChild(optNew);
}
window.popularSelectCliente = popularSelectCliente;
