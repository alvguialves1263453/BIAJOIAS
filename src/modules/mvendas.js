import { data, upsertItem, removeItem, genId, logMovimentacao } from '../store.js'
import { formatCurrency, formatDate, statusBadge } from '../helpers.js'
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js'
import { navigate } from '../router.js'
import { createAutocomplete } from '../components/autocomplete.js'

window.openModal = openModal;
window.closeModal = closeModal;

var mvAutocomplete = null

var mvMaletaId = null;

export function abrirVendasMaleta(maletaId) {
  mvMaletaId = maletaId;
  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === maletaId) {
      var titleEl = document.getElementById('mvMaletaTitle');
      if (titleEl) titleEl.textContent = data.maletas[i].nome;
      break;
    }
  }
  navigate('maleta-vendas');
  mvRenderCards();
  mvRenderVendidos();
  if (!mvAutocomplete) {
    mvAutocomplete = createAutocomplete({
      inputId: 'ac-mvCliente',
      hiddenId: 'mvCliente',
      items: data.clientes,
      displayField: 'nome',
      searchFields: ['nome', 'telefone', 'instagram'],
      onSelect: function(item) {
        document.getElementById('mvTelefone').value = item.telefone || ''
        document.getElementById('mvInstagram').value = item.instagram || ''
      },
      onClear: function() {
        document.getElementById('mvTelefone').value = ''
        document.getElementById('mvInstagram').value = ''
      }
    })
  } else {
    mvAutocomplete.refresh(data.clientes)
  }
  mvLimparSelecao();
}
window.abrirVendasMaleta = abrirVendasMaleta;

export function voltarMaletas() {
  mvMaletaId = null;
  navigate('maletas');
}
window.voltarMaletas = voltarMaletas;

export function mvToggleCard(produtoId, checkbox) {
  var card = checkbox.closest('.mv-card');
  if (checkbox.checked) {
    card.classList.add('selected');
  } else {
    card.classList.remove('selected');
  }
  mvAtualizarPainel();
}
window.mvToggleCard = mvToggleCard;

export function mvAtualizarPainel() {
  var checks = document.querySelectorAll('#mvGrid .mv-card-checkbox:checked');
  var count = checks.length;
  var panel = document.getElementById('mvPanel');
  var countEl = document.getElementById('mvSelectedCount');
  if (panel) panel.style.display = count > 0 ? '' : 'none';
  if (countEl) countEl.textContent = count + ' produto(s) selecionado(s)';

  var total = 0;
  for (var i = 0; i < checks.length; i++) {
    var card = checks[i].closest('.mv-card');
    if (card) total += parseFloat(card.dataset.preco) || 0;
  }

  document.getElementById('mvValorFinalInput').value = total;
  mvCalcularTotal();
}
window.mvAtualizarPainel = mvAtualizarPainel;

export function mvCalcularTotal() {
  var valorFinal = parseFloat(document.getElementById('mvValorFinalInput').value) || 0;
  var desconto = parseFloat(document.getElementById('mvDesconto').value) || 0;
  var total = valorFinal - desconto;
  if (total < 0) total = 0;
  document.getElementById('mvTotalFinal').textContent = formatCurrency(total);
  document.getElementById('mvTotalFinalInput').value = total;

  var btn = document.getElementById('mvFinalizarBtn');
  if (btn) btn.disabled = total <= 0;
}
window.mvCalcularTotal = mvCalcularTotal;

export function mvOnPagamentoChange() {
  var pag = document.getElementById('mvFormaPagamento').value;
  var parcelasGroup = document.getElementById('mvParcelasGroup');
  var trocoGroup = document.getElementById('mvTrocoGroup');
  var carneGroup = document.getElementById('mvCarneGroup');

  if (parcelasGroup) parcelasGroup.style.display = (pag === 'Cart\u00e3o de Cr\u00e9dito') ? '' : 'none';
  if (trocoGroup) trocoGroup.style.display = (pag === 'Dinheiro') ? '' : 'none';
  if (carneGroup) carneGroup.style.display = (pag === 'Carn\u00ea') ? '' : 'none';
}
window.mvOnPagamentoChange = mvOnPagamentoChange;

export function mvOnClienteChange() {
  var sel = document.getElementById('mvCliente');
  if (!sel) return;
  var val = sel.value;
  if (val === 'new') {
    if (window.resetClienteForm) window.resetClienteForm();
    openModal('modalCliente');
    return;
  }
  for (var i = 0; i < data.clientes.length; i++) {
    if (data.clientes[i].id === val) {
      var c = data.clientes[i];
      document.getElementById('mvTelefone').value = c.telefone || '';
      document.getElementById('mvInstagram').value = c.instagram || '';
      return;
    }
  }
  document.getElementById('mvTelefone').value = '';
  document.getElementById('mvInstagram').value = '';
}
window.mvOnClienteChange = mvOnClienteChange;

export function mvCalcularTroco() {
  var total = parseFloat(document.getElementById('mvTotalFinalInput').value) || 0;
  var pago = parseFloat(document.getElementById('mvTrocoPago').value) || 0;
  var troco = pago - total;
  var el = document.getElementById('mvTrocoResult');
  if (el) el.textContent = troco >= 0 ? formatCurrency(troco) : 'Valor insuficiente';
}
window.mvCalcularTroco = mvCalcularTroco;

export function mvLimparSelecao() {
  var checks = document.querySelectorAll('#mvGrid .mv-card-checkbox:checked');
  for (var i = 0; i < checks.length; i++) {
    checks[i].checked = false;
    var card = checks[i].closest('.mv-card');
    if (card) card.classList.remove('selected');
  }

  var panel = document.getElementById('mvPanel');
  if (panel) panel.style.display = 'none';
  document.getElementById('mvSelectedCount').textContent = '';
  document.getElementById('mvValorFinalInput').value = 0;
  document.getElementById('mvDesconto').value = '0';
  document.getElementById('mvTotalFinal').textContent = formatCurrency(0);
  document.getElementById('mvTotalFinalInput').value = 0;
  document.getElementById('mvFormaPagamento').value = '';
  document.getElementById('mvTelefone').value = '';
  document.getElementById('mvInstagram').value = '';
  document.getElementById('mvObservacao').value = '';
  if (mvAutocomplete) mvAutocomplete.clear();

  var parcelasGroup = document.getElementById('mvParcelasGroup');
  var trocoGroup = document.getElementById('mvTrocoGroup');
  var carneGroup = document.getElementById('mvCarneGroup');
  if (parcelasGroup) parcelasGroup.style.display = 'none';
  if (trocoGroup) trocoGroup.style.display = 'none';
  if (carneGroup) carneGroup.style.display = 'none';

  var btn = document.getElementById('mvFinalizarBtn');
  if (btn) btn.disabled = true;
}
window.mvLimparSelecao = mvLimparSelecao;

export async function mvFinalizarVenda() {
  var checks = document.querySelectorAll('#mvGrid .mv-card-checkbox:checked');
  if (checks.length === 0) { showToast('Selecione ao menos um produto.', 'error'); return; }

  var clienteId = document.getElementById('mvCliente').value;
  if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }

  var formaPagamento = document.getElementById('mvFormaPagamento').value;
  if (!formaPagamento) { showToast('Selecione a forma de pagamento.', 'error'); return; }

  var descontoTotal = parseFloat(document.getElementById('mvDesconto').value) || 0;
  var observacao = document.getElementById('mvObservacao').value.trim();
  var telefone = document.getElementById('mvTelefone').value.trim();
  var instagram = document.getElementById('mvInstagram').value.trim();
  var parcelas = parseInt(document.getElementById('mvParcelas').value) || 1;
  var carneParcelas = document.getElementById('mvCarneParcelas').value
  var carneVencimento = document.getElementById('mvCarneVencimento').value

  var today = new Date();
  var y = today.getFullYear();
  var m = String(today.getMonth() + 1).padStart(2, '0');
  var d = String(today.getDate()).padStart(2, '0');
  var dataStr = y + '-' + m + '-' + d;

  var items = [];
  var totalValor = 0;
  for (var ci = 0; ci < checks.length; ci++) {
    var card = checks[ci].closest('.mv-card');
    var preco = parseFloat(card.dataset.preco) || 0;
    var prodId = card.dataset.produtoId;
    totalValor += preco;
    items.push({ id: prodId, preco: preco });
  }

  try {
    var remainingDesconto = descontoTotal;
    for (var pj = 0; pj < items.length; pj++) {
      var item = items[pj];
      var descItem = pj < items.length - 1
        ? Math.round((descontoTotal * (item.preco / totalValor)) * 100) / 100
        : Math.round(remainingDesconto * 100) / 100;
      remainingDesconto -= descItem;

      var vendaObj = {
        produtoId: item.id,
        clienteId: clienteId,
        telefone: telefone,
        instagram: instagram,
        valor: item.preco,
        desconto: descItem,
        formaPagamento: formaPagamento,
        parcelas: parcelas,
        entrada: 0,
        data: dataStr,
        observacao: observacao,
        recebido: true,
        carneParcelas: carneParcelas,
        carneVencimento: carneVencimento
      };

      await upsertItem('vendas', vendaObj);

      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === item.id && data.produtos[pi].status === 'Dispon\u00edvel') {
          data.produtos[pi].status = 'Vendido';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }

    var mvCliNome = '';
    for (var mci = 0; mci < data.clientes.length; mci++) {
      if (data.clientes[mci].id === clienteId) { mvCliNome = data.clientes[mci].nome; break; }
    }
    logMovimentacao('venda_criada', 'Venda de ' + items.length + ' item(ns) · ' + mvCliNome + ' · ' + formaPagamento, { clienteId: clienteId, quantidade: items.length, formaPagamento: formaPagamento, maletaId: mvMaletaId });

    mvLimparSelecao();
    mvRenderCards();
    mvRenderVendidos();
    showToast('Venda(s) finalizada(s) com sucesso!', 'success');
    showCelebration();
  } catch (e) {
    showToast('Erro ao finalizar venda.', 'error');
    console.error(e);
  }
}
window.mvFinalizarVenda = mvFinalizarVenda;

export function mvRenderVendidos() {
  var container = document.getElementById('mvVendidosGrid');
  if (!container) return;
  container.innerHTML = '';

  var maletaVendas = [];
  for (var i = 0; i < data.vendas.length; i++) {
    var v = data.vendas[i];
    for (var j = 0; j < data.produtos.length; j++) {
      if (data.produtos[j].id === v.produtoId && data.produtos[j].maletaId === mvMaletaId) {
        var produto = data.produtos[j];
        var cliNome = v.clienteNome || '';
        if (!cliNome) {
          for (var k = 0; k < data.clientes.length; k++) {
            if (data.clientes[k].id === v.clienteId) { cliNome = data.clientes[k].nome; break; }
          }
        }
        maletaVendas.push({ venda: v, produto: produto, cliente: cliNome });
        break;
      }
    }
  }

  if (maletaVendas.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:13px;padding:16px 0;text-align:center">Nenhuma venda realizada nesta maleta.</p>';
    return;
  }

  for (var l = 0; l < maletaVendas.length; l++) {
    var mv = maletaVendas[l];
    var card = document.createElement('div');
    card.className = 'mv-vendido-card';
    card.innerHTML =
      '<div class="mv-vendido-header">' +
      '<strong>' + mv.produto.nome + '</strong>' +
      '<div class="mv-vendido-info"><span>' + mv.cliente + '</span><span>' + formatDate(mv.venda.data) + '</span></div>' +
      '</div>' +
      '<div class="mv-vendido-preco">' + formatCurrency(mv.venda.valor - (mv.venda.desconto || 0)) + '</div>' +
      '<button class="btn-icon" onclick="window.mvVerDetalhe(\'' + mv.venda.id + '\')" title="Detalhes"><i class="fas fa-eye"></i></button>';
    container.appendChild(card);
  }
}
window.mvRenderVendidos = mvRenderVendidos;

export function mvVerDetalhe(vendaId) {
  for (var i = 0; i < data.vendas.length; i++) {
    if (data.vendas[i].id === vendaId) {
      var v = data.vendas[i];
      var prodNome = '';
      var cliNome = '';
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === v.produtoId) { prodNome = data.produtos[j].nome; break; }
      }
      for (var k = 0; k < data.clientes.length; k++) {
        if (data.clientes[k].id === v.clienteId) { cliNome = data.clientes[k].nome; break; }
      }
      var body = document.getElementById('modalMvDetalheBody');
      if (!body) return;
      body.innerHTML =
        '<div class="detail-row"><span class="detail-label">Produto</span><span class="detail-value">' + prodNome + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Cliente</span><span class="detail-value">' + cliNome + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">' + (v.telefone || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Instagram</span><span class="detail-value">' + (v.instagram || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Valor</span><span class="detail-value">' + formatCurrency(v.valor) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Desconto</span><span class="detail-value">' + (v.desconto ? formatCurrency(v.desconto) : '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Total</span><span class="detail-value" style="color:var(--rose);font-weight:700">' + formatCurrency(v.valor - (v.desconto || 0)) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Pagamento</span><span class="detail-value">' + (v.formaPagamento || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Data</span><span class="detail-value">' + formatDate(v.data) + '</span></div>' +
        (v.observacao ? '<div class="detail-row"><span class="detail-label">Obs</span><span class="detail-value">' + v.observacao + '</span></div>' : '') +
        '<div style="margin-top:16px">' +
        '<button class="btn-danger btn-full" onclick="window.mvCancelarVenda(\'' + v.id + '\')"><i class="fas fa-ban"></i> Cancelar Venda</button>' +
        '</div>';
      openModal('modalMvDetalhe');
      return;
    }
  }
}
window.mvVerDetalhe = mvVerDetalhe;

export async function mvCancelarVenda(vendaId) {
  var c = await showConfirm('Tem certeza que deseja cancelar esta venda?');
  if (!c) return;
  try {
    var prodId = null;
    for (var i = 0; i < data.vendas.length; i++) {
      if (data.vendas[i].id === vendaId) { prodId = data.vendas[i].produtoId; break; }
    }
    await removeItem('vendas', vendaId);
    if (prodId) {
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === prodId) {
          data.produtos[pi].status = 'Dispon\u00edvel';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }
    logMovimentacao('venda_cancelada', 'Venda cancelada (maleta)', { vendaId: vendaId });
    closeModal('modalMvDetalhe');
    mvRenderVendidos();
    mvRenderCards();
    showToast('Venda cancelada com sucesso.', 'success');
  } catch (e) {
    showToast('Erro ao cancelar venda.', 'error');
    console.error(e);
  }
}
window.mvCancelarVenda = mvCancelarVenda;

export function mvRenderCards() {
  var grid = document.getElementById('mvGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i];
    if (p.maletaId !== mvMaletaId || p.status !== 'Dispon\u00edvel') continue;

    var card = document.createElement('div');
    card.className = 'mv-card';
    card.dataset.produtoId = p.id;
    card.dataset.preco = p.precoVenda;

    var fotoHtml = p.fotoUrl
      ? '<img src="' + p.fotoUrl + '" alt="' + p.nome + '" class="mv-card-img">'
      : '<div class="mv-card-icon"><i class="fas fa-gem"></i></div>';

    card.innerHTML =
      '<label class="mv-card-checkbox-label">' +
      '<input type="checkbox" class="mv-card-checkbox" onchange="window.mvToggleCard(\'' + p.id + '\', this)">' +
      '<span class="mv-checkmark">\u2713</span>' +
      '</label>' +
      fotoHtml +
      '<div class="mv-card-body">' +
      '<strong>' + p.nome + '</strong>' +
      '<span class="mv-card-codigo">' + p.codigo + '</span>' +
      '<span class="mv-card-categoria">' + (p.categoria || '') + (p.tamanho ? ' · Tam. ' + p.tamanho : '') + '</span>' +
      '<span class="mv-card-preco">' + formatCurrency(p.precoVenda) + '</span>' +
      '</div>' +
      '<div class="mv-card-status">' + statusBadge(p.status) + '</div>';

    grid.appendChild(card);
  }

  if (grid.children.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-light);font-size:13px;text-align:center;padding:24px 0;grid-column:1/-1">Nenhum produto dispon\u00edvel nesta maleta.</p>';
  }
}
window.mvRenderCards = mvRenderCards;
