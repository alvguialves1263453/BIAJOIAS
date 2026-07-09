import { data, upsertItem, genId, logMovimentacao } from '../store.js';
import { formatCurrency } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm } from '../modal.js';

window.openModal = openModal;
window.closeModal = closeModal;

export function popularSelectMaletaDevolucao() {
  var sel = document.getElementById('selectMaletaDevolucao');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione uma maleta</option>';
  for (var i = 0; i < data.maletas.length; i++) {
    var m = data.maletas[i];
    if (m.status !== 'Ativa') continue;
    var opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nome;
    sel.appendChild(opt);
  }
}
window.popularSelectMaletaDevolucao = popularSelectMaletaDevolucao;

export function carregarProdutosDevolucao() {
  var maletaId = document.getElementById('selectMaletaDevolucao').value;
  var container = document.getElementById('divProdutosDevolucao');
  if (!container) return;
  container.innerHTML = '';

  if (!maletaId) {
    container.innerHTML = '<p class="text-muted">Selecione uma maleta para carregar os produtos.</p>';
    return;
  }

  var temProdutos = false;
  var html = '';
  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i];
    if (p.maletaId !== maletaId) continue;
    if (p.status === 'Vendido' || p.status === 'Devolvido') continue;
    temProdutos = true;
    html += '<label class="checkbox-label">' +
      '<input type="checkbox" class="chk-produto-devolucao" value="' + p.id + '"> ' +
      p.codigo + ' - ' + p.nome + ' (' + formatCurrency(p.precoVenda) + ')' +
      '</label>';
  }

  if (!temProdutos) {
    container.innerHTML = '<p class="text-muted">Nenhum produto dispon\u00edvel para devolu\u00e7\u00e3o nesta maleta.</p>';
    return;
  }

  container.innerHTML = html;
}
window.carregarProdutosDevolucao = carregarProdutosDevolucao;

export async function confirmarDevolucao() {
  var maletaId = document.getElementById('selectMaletaDevolucao').value;
  if (!maletaId) { showToast('Selecione uma maleta.', 'error'); return; }

  var checks = document.querySelectorAll('.chk-produto-devolucao:checked');
  if (checks.length === 0) { showToast('Selecione ao menos um produto para devolver.', 'error'); return; }

  var c = await showConfirm('Confirmar devolu\u00e7\u00e3o de ' + checks.length + ' produto(s)?');
  if (!c) return;

  try {
    var produtoIds = [];
    for (var i = 0; i < checks.length; i++) {
      var prodId = checks[i].value;
      produtoIds.push(prodId);
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === prodId) {
          data.produtos[pi].status = 'Devolvido';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }

    var allDone = true;
    for (var pj = 0; pj < data.produtos.length; pj++) {
      if (data.produtos[pj].maletaId === maletaId && data.produtos[pj].status !== 'Vendido' && data.produtos[pj].status !== 'Devolvido') {
        allDone = false;
        break;
      }
    }

    if (allDone) {
      for (var mj = 0; mj < data.maletas.length; mj++) {
        if (data.maletas[mj].id === maletaId) {
          data.maletas[mj].status = 'Devolvida';
          await upsertItem('maletas', data.maletas[mj]);
          break;
        }
      }
    }

    var devolucao = {
      maletaId: maletaId,
      produtos: produtoIds,
      data: new Date().toISOString().split('T')[0]
    };
    await upsertItem('devolucoes', devolucao);

    logMovimentacao('devolucao_realizada', produtoIds.length + ' produto(s) devolvido(s) da maleta', { maletaId: maletaId, quantidade: produtoIds.length });

    carregarProdutosDevolucao();
    showToast('Devolu\u00e7\u00e3o registrada com sucesso!', 'success');
  } catch (e) {
    showToast('Erro ao registrar devolu\u00e7\u00e3o.', 'error');
    console.error(e);
  }
}
window.confirmarDevolucao = confirmarDevolucao;
