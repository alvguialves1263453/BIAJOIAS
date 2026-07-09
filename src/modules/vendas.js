import { data, upsertItem, removeItem, genId, logMovimentacao } from '../store.js';
import { formatCurrency, formatDate } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { createAutocomplete } from '../components/autocomplete.js';

window.openModal = openModal;
window.closeModal = closeModal;

export var vendaAutocomplete = null
export var reservaAutocomplete = null
var _vendaSelected = []
var _vendaStepMaletaId = null

export function popularSelectCliente(selectId) {
  var hiddenId = selectId
  var inputId = 'ac-' + selectId
  var el = document.getElementById(inputId)
  if (!el) return
  var ac = createAutocomplete({
    inputId: inputId,
    hiddenId: hiddenId,
    items: data.clientes,
    displayField: 'nome',
    searchFields: ['nome', 'telefone', 'instagram']
  })
  if (selectId === 'vendaCliente') vendaAutocomplete = ac
  if (selectId === 'reservaCliente') reservaAutocomplete = ac
  return ac
}
window.popularSelectCliente = popularSelectCliente

export function popularSelectProduto(selectId, onlyDisponiveis) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione um produto</option>';
  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i];
    if (onlyDisponiveis && p.status !== 'Dispon\u00edvel') continue;
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.codigo + ' - ' + p.nome;
    sel.appendChild(opt);
  }
}
window.popularSelectProduto = popularSelectProduto;

export function resetVendaForm() {
  document.getElementById('vendaEditId').value = '';
  document.getElementById('vendaProdutoId').value = '';
  if (vendaAutocomplete) vendaAutocomplete.clear();
  document.getElementById('vendaTelefone').value = '';
  document.getElementById('vendaInstagram').value = '';
  document.getElementById('vendaValor').value = '';
  document.getElementById('vendaDesconto').value = '0';
  document.getElementById('vendaFormaPagamento').value = '';
  document.getElementById('vendaParcelas').value = '1';
  document.getElementById('vendaEntrada').value = '';
  document.getElementById('vendaCarneRow').style.display = 'none';
  document.getElementById('vendaCarneParcelas').value = '1';
  document.getElementById('vendaCarneVencimento').value = '';
  document.getElementById('vendaObservacao').value = '';
  document.getElementById('vendaRecebido').checked = false;
  var today = new Date();
  var y = today.getFullYear();
  var m = String(today.getMonth() + 1).padStart(2, '0');
  var d = String(today.getDate()).padStart(2, '0');
  document.getElementById('vendaData').value = y + '-' + m + '-' + d;
  document.getElementById('modalVendaTitle').textContent = 'Nova Venda';

  _vendaSelected = []
  _vendaStepMaletaId = null
  var stepC = document.getElementById('vendaStepContainer')
  var stepMaletas = document.getElementById('vendaStepMaletas')
  var stepProds = document.getElementById('vendaStepProdutos')
  var readOnly = document.getElementById('vendaProdutoReadonly')
  var valorRow = document.getElementById('vendaValorRow')
  var prodGrid = document.getElementById('vendaProdutosGrid')
  if (stepC) stepC.style.display = ''
  if (stepMaletas) stepMaletas.style.display = ''
  if (stepProds) stepProds.style.display = 'none'
  if (prodGrid) prodGrid.style.display = ''
  if (readOnly) readOnly.style.display = 'none'
  if (valorRow) valorRow.style.display = 'none'
  var resumo = document.getElementById('vendaResumo')
  if (resumo) resumo.style.display = 'none'
  var btn = document.getElementById('vendaSalvarBtn')
  if (btn) btn.textContent = 'Selecione os produtos'
  if (btn) btn.disabled = true
  toggleVendaFormaPagamento()
  renderMaletasVenda()
}
window.resetVendaForm = resetVendaForm;

export function renderMaletasVenda() {
  var grid = document.getElementById('vendaMaletasGrid')
  if (!grid) return
  grid.innerHTML = ''

  for (var i = 0; i < data.maletas.length; i++) {
    var m = data.maletas[i]
    var ativa = m.status === 'Ativa'
    var card = document.createElement('div')
    card.className = 'venda-maleta-card' + (ativa ? ' ativa' : ' inativa')
    card.dataset.id = m.id

    var dias = ''
    if (m.dataLimite) {
      var diff = daysUntil(m.dataLimite)
      if (diff !== null) dias = diff + ' dias restantes'
    }

    card.innerHTML =
      '<div class="venda-maleta-icon"><i class="fas fa-suitcase"></i></div>' +
      '<div class="venda-maleta-info">' +
      '<strong>' + m.nome + '</strong>' +
      '<span>' + (dias || m.status) + '</span>' +
      '</div>' +
      (ativa
        ? '<button class="venda-maleta-btn" onclick="event.stopPropagation();window.abrirProdutosVenda(\'' + m.id + '\')">Escolher</button>'
        : '<span class="badge badge-neutral venda-maleta-status">' + m.status + '</span>')

    grid.appendChild(card)
  }
}

window.abrirProdutosVenda = function(maletaId) {
  _vendaStepMaletaId = maletaId
  _vendaSelected = []

  // Set title to maleta name
  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === maletaId) {
      document.getElementById('vendaSelecaoTitle').textContent = data.maletas[i].nome
      break
    }
  }

  renderGridSelecao(maletaId)
  openModal('modalVendaSelecao')
}

export function voltarStepMaletas() {
  _vendaStepMaletaId = null
  _vendaSelected = []
  document.getElementById('vendaStepMaletas').style.display = ''
  document.getElementById('vendaStepProdutos').style.display = 'none'
  var grid = document.getElementById('vendaProdutosGrid')
  if (grid) grid.style.display = ''
  var resumo = document.getElementById('vendaResumo')
  if (resumo) resumo.style.display = 'none'
  var btn = document.getElementById('vendaSalvarBtn')
  if (btn) { btn.textContent = 'Selecione os produtos'; btn.disabled = true }
}
window.voltarStepMaletas = voltarStepMaletas

export function renderProdutosVenda(maletaId) {
  var grid = document.getElementById('vendaProdutosGrid')
  var nomeEl = document.getElementById('vendaStepMaletaNome')
  if (!grid) return
  grid.innerHTML = ''

  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === maletaId) {
      if (nomeEl) nomeEl.textContent = data.maletas[i].nome
      break
    }
  }

  var disponiveis = []
  for (var j = 0; j < data.produtos.length; j++) {
    var p = data.produtos[j]
    if (p.maletaId === maletaId && p.status === 'Dispon\u00edvel') {
      disponiveis.push(p)
    }
  }

  if (disponiveis.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:20px 0;color:var(--text-light);font-size:13px">Nenhum produto dispon\u00edvel nesta maleta.</p>'
    return
  }

  for (var k = 0; k < disponiveis.length; k++) {
    (function(prod) {
      var card = document.createElement('div')
      card.className = 'venda-prod-card'
      card.dataset.id = prod.id
      card.onclick = function() { toggleProdutoVenda(prod.id, card) }

      var fotoHtml = prod.fotoUrl
        ? '<img src="' + prod.fotoUrl + '" alt="">'
        : '<i class="fas fa-gem"></i>'

      card.innerHTML =
        '<div class="venda-prod-check"><i class="fas fa-check"></i></div>' +
        '<div class="venda-prod-foto">' + fotoHtml + '</div>' +
        '<div class="venda-prod-nome">' + prod.nome + (prod.tamanho ? ' (Tam. ' + prod.tamanho + ')' : '') + '</div>' +
        '<div class="venda-prod-preco">' + formatCurrency(prod.precoVenda) + '</div>'

      grid.appendChild(card)
    })(disponiveis[k])
  }
}

export function toggleProdutoVenda(id, card) {
  var idx = _vendaSelected.indexOf(id)
  if (idx > -1) {
    _vendaSelected.splice(idx, 1)
    card.classList.remove('selected')
  } else {
    _vendaSelected.push(id)
    card.classList.add('selected')
  }
  atualizarResumoVenda()
}

function atualizarResumoVenda() {
  var resumo = document.getElementById('vendaResumo')
  var countEl = document.getElementById('vendaSelectedCount')
  var totalEl = document.getElementById('vendaResumoTotal')
  var countEl2 = document.getElementById('vendaStepCount')
  var btn = document.getElementById('vendaSalvarBtn')

  var count = _vendaSelected.length
  if (countEl2) countEl2.textContent = count

  if (count === 0) {
    if (resumo) resumo.style.display = 'none'
    if (btn) { btn.textContent = 'Selecione os produtos'; btn.disabled = true }
    return
  }

  var total = 0
  for (var i = 0; i < data.produtos.length; i++) {
    if (_vendaSelected.indexOf(data.produtos[i].id) > -1) {
      total += data.produtos[i].precoVenda || 0
    }
  }

  if (countEl) countEl.textContent = count
  if (totalEl) totalEl.textContent = formatCurrency(total)
  if (resumo) resumo.style.display = ''
  if (btn) { btn.textContent = 'Finalizar Venda (' + count + ')'; btn.disabled = false }
}

function renderGridSelecao(maletaId) {
  var grid = document.getElementById('vendaSelecaoGrid')
  if (!grid) return
  grid.innerHTML = ''

  var disponiveis = []
  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i]
    if (p.maletaId === maletaId && p.status === 'Dispon\u00edvel') {
      disponiveis.push(p)
    }
  }

  if (disponiveis.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px 10px;color:var(--text-light);font-size:13px">Nenhum produto dispon\u00edvel nesta maleta.</p>'
    atualizarFooterSelecao()
    return
  }

  for (var i = 0; i < disponiveis.length; i++) {
    ;(function(prod) {
      var card = document.createElement('div')
      card.className = 'vs-card'
      card.dataset.id = prod.id

      var fotoHtml = ''
      if (prod.fotos && prod.fotos.length > 0) {
        fotoHtml = '<img class="vs-card-img" src="' + prod.fotos[0] + '" alt="">'
      } else if (prod.fotoUrl) {
        fotoHtml = '<img class="vs-card-img" src="' + prod.fotoUrl + '" alt="">'
      } else {
        fotoHtml = '<div class="vs-card-img-empty"><i class="fas fa-gem"></i></div>'
      }

      card.innerHTML =
        '<div class="vs-card-check"><i class="fas fa-check"></i></div>' +
        fotoHtml +
        '<div class="vs-card-body">' +
        '<div class="vs-card-preco">' + formatCurrency(prod.precoVenda) + '</div>' +
        (prod.tamanho ? '<div class="vs-card-tamanho">Tam. ' + prod.tamanho + '</div>' : '') +
        '</div>'

      card.onclick = function() { toggleSelecaoProduto(prod.id, card) }
      grid.appendChild(card)
    })(disponiveis[i])
  }

  atualizarFooterSelecao()
}

function toggleSelecaoProduto(id, card) {
  var idx = _vendaSelected.indexOf(id)
  if (idx > -1) {
    _vendaSelected.splice(idx, 1)
    card.classList.remove('selected')
  } else {
    _vendaSelected.push(id)
    card.classList.add('selected')
  }
  atualizarFooterSelecao()
}

function atualizarFooterSelecao() {
  var footer = document.getElementById('vendaSelecaoFooter')
  var countEl = document.getElementById('vsSelectedCount')
  var totalEl = document.getElementById('vsTotal')
  if (!footer || !countEl || !totalEl) return

  var count = _vendaSelected.length
  if (count === 0) {
    footer.style.display = 'none'
    return
  }

  var total = 0
  for (var i = 0; i < data.produtos.length; i++) {
    if (_vendaSelected.indexOf(data.produtos[i].id) > -1) {
      total += data.produtos[i].precoVenda || 0
    }
  }

  countEl.textContent = count
  totalEl.textContent = formatCurrency(total)
  footer.style.display = ''
}

window.concluirSelecaoVenda = function() {
  if (_vendaSelected.length === 0) return

  closeModal('modalVendaSelecao')

  // Show summary in the venda modal
  document.getElementById('vendaStepMaletas').style.display = 'none'
  document.getElementById('vendaStepProdutos').style.display = ''
  document.getElementById('vendaProdutosGrid').style.display = 'none'

  // Set maleta name
  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === _vendaStepMaletaId) {
      document.getElementById('vendaStepMaletaNome').textContent = data.maletas[i].nome
      break
    }
  }

  atualizarResumoVenda()
}

window.toggleVendaFormaPagamento = function() {
  var pag = document.getElementById('vendaFormaPagamento').value
  var carneRow = document.getElementById('vendaCarneRow')
  var parcelasRow = document.getElementById('vendaParcelasRow')
  if (carneRow) carneRow.style.display = pag === 'Carn\u00ea' ? '' : 'none'
  if (parcelasRow) parcelasRow.style.display = pag === 'Cart\u00e3o de Cr\u00e9dito' ? '' : 'none'
}

window.reabrirSelecaoProdutos = function() {
  if (!_vendaStepMaletaId) return

  for (var i = 0; i < data.maletas.length; i++) {
    if (data.maletas[i].id === _vendaStepMaletaId) {
      document.getElementById('vendaSelecaoTitle').textContent = data.maletas[i].nome
      break
    }
  }

  renderGridSelecao(_vendaStepMaletaId)

  var cards = document.querySelectorAll('#vendaSelecaoGrid .vs-card')
  for (var j = 0; j < cards.length; j++) {
    if (_vendaSelected.indexOf(cards[j].dataset.id) > -1) {
      cards[j].classList.add('selected')
    }
  }

  atualizarFooterSelecao()
  openModal('modalVendaSelecao')
}

window.abrirClienteRapido = function() {
  document.getElementById('clienteRapidoNome').value = ''
  document.getElementById('clienteRapidoWhatsapp').value = ''
  openModal('modalClienteRapido')
}

window.salvarClienteRapido = async function() {
  var nome = document.getElementById('clienteRapidoNome').value.trim()
  if (!nome) { showToast('Informe o nome do cliente.', 'error'); return }

  var whats = document.getElementById('clienteRapidoWhatsapp').value.trim()
  var obj = {
    nome: nome,
    whatsapp: whats,
    telefone: whats
  }

  try {
    var saved = await upsertItem('clientes', obj)
    closeModal('modalClienteRapido')

    if (vendaAutocomplete) {
      vendaAutocomplete.refresh(data.clientes)
      vendaAutocomplete.setValue(saved.id)
    }

    showToast('Cliente cadastrado!', 'success')
  } catch (e) {
    showToast('Erro ao salvar cliente.', 'error')
  }
}

export function renderVendas() {
  var search = (document.getElementById('searchVenda').value || '').toLowerCase();
  var container = document.getElementById('listaVendas');
  var empty = document.getElementById('emptyVendas');
  if (!container) return;
  container.innerHTML = '';

  var filtered = [];
  for (var i = 0; i < data.vendas.length; i++) {
    var v = data.vendas[i];
    if (search) {
      var matched = false;
      for (var si = 0; si < data.produtos.length; si++) {
        if (data.produtos[si].id === v.produtoId && data.produtos[si].nome.toLowerCase().indexOf(search) > -1) { matched = true; break; }
      }
      if (!matched) {
        for (var si2 = 0; si2 < data.clientes.length; si2++) {
          if (data.clientes[si2].id === v.clienteId && data.clientes[si2].nome.toLowerCase().indexOf(search) > -1) { matched = true; break; }
        }
      }
      if (!matched && v.telefone && v.telefone.toLowerCase().indexOf(search) > -1) matched = true;
      if (!matched) continue;
    }
    filtered.push(v);
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  for (var j = 0; j < filtered.length; j++) {
    var v2 = filtered[j];
    var prodNome = '';
    for (var k = 0; k < data.produtos.length; k++) {
      if (data.produtos[k].id === v2.produtoId) { prodNome = data.produtos[k].nome; break; }
    }
    var cliNome = '';
    for (var l = 0; l < data.clientes.length; l++) {
      if (data.clientes[l].id === v2.clienteId) { cliNome = data.clientes[l].nome; break; }
    }
    var totalValor = v2.valor - (v2.desconto || 0);

    var card = document.createElement('div');
    card.className = 'venda-card';
    card.onclick = function() { window.editarVenda(this.dataset.vendaId) };
    card.dataset.vendaId = v2.id;

    var iconClass = v2.recebido ? 'sold' : 'pending';
    var iconName = v2.recebido ? 'check-circle' : 'clock';
    var recebidoText = v2.recebido ? 'Recebido' : 'Pendente';

    card.innerHTML =
      '<div class="venda-icon ' + iconClass + '"><i class="fas fa-' + iconName + '"></i></div>' +
      '<div class="venda-info">' +
      '<strong>' + prodNome + '</strong>' +
      '<span>' + cliNome + '</span>' +
      '<div class="venda-meta">' +
      '<span>' + (v2.formaPagamento || '-') + '</span>' +
      '<span>' + formatDate(v2.data) + '</span>' +
      '</div></div>' +
      '<div class="venda-valor">' +
      formatCurrency(totalValor) +
      '<small>' + recebidoText + '</small>' +
      '<button class="btn-icon danger" onclick="event.stopPropagation();window.excluirVenda(\'' + v2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>';

    container.appendChild(card);
  }
}
window.renderVendas = renderVendas;

export async function salvarVenda() {
  var editId = document.getElementById('vendaEditId').value;

  if (editId) {
    await salvarVendaEdit(editId);
    return;
  }

  if (_vendaSelected.length === 0) { showToast('Selecione ao menos um produto.', 'error'); return; }

  var clienteId = document.getElementById('vendaCliente').value;
  if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }

  var telefone = document.getElementById('vendaTelefone').value.trim();
  var instagram = document.getElementById('vendaInstagram').value.trim();
  var formaPagamento = document.getElementById('vendaFormaPagamento').value;
  var parcelas = parseInt(document.getElementById('vendaParcelas').value) || 1;
  var dataVenda = document.getElementById('vendaData').value;
  var observacao = document.getElementById('vendaObservacao').value.trim();

  try {
    for (var i = 0; i < _vendaSelected.length; i++) {
      var prodId = _vendaSelected[i];
      var preco = 0;
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === prodId) { preco = data.produtos[pi].precoVenda || 0; break; }
      }

      var vendaObj = {
        produtoId: prodId,
        clienteId: clienteId,
        telefone: telefone,
        instagram: instagram,
        valor: preco,
        desconto: 0,
        formaPagamento: formaPagamento,
        parcelas: parcelas,
        entrada: 0,
        data: dataVenda,
        observacao: observacao,
        recebido: true,
        carneParcelas: document.getElementById('vendaCarneParcelas').value,
        carneVencimento: document.getElementById('vendaCarneVencimento').value
      };

      await upsertItem('vendas', vendaObj);

      for (var pj = 0; pj < data.produtos.length; pj++) {
        if (data.produtos[pj].id === prodId && data.produtos[pj].status === 'Dispon\u00edvel') {
          data.produtos[pj].status = 'Vendido';
          await upsertItem('produtos', data.produtos[pj]);
          break;
        }
      }
    }

    var cliNome = '';
    for (var ci = 0; ci < data.clientes.length; ci++) {
      if (data.clientes[ci].id === clienteId) { cliNome = data.clientes[ci].nome; break; }
    }
    logMovimentacao('venda_criada', 'Venda de ' + _vendaSelected.length + ' item(ns) · ' + cliNome + ' · ' + formaPagamento, { clienteId: clienteId, quantidade: _vendaSelected.length, formaPagamento: formaPagamento });

    closeModal('modalVenda');
    resetVendaForm();
    renderVendas();
    showCelebration();
  } catch (e) {
    showToast('Erro ao salvar venda.', 'error');
    console.error(e);
  }
}
window.salvarVenda = salvarVenda;

async function salvarVendaEdit(editId) {
  var clienteId = document.getElementById('vendaCliente').value;
  if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }

  var produtoId = document.getElementById('vendaProdutoId').value;
  if (!produtoId) { showToast('Produto n\u00e3o encontrado.', 'error'); return; }

  var obj = {
    id: editId,
    produtoId: produtoId,
    clienteId: clienteId,
    telefone: document.getElementById('vendaTelefone').value.trim(),
    instagram: document.getElementById('vendaInstagram').value.trim(),
    valor: parseFloat(document.getElementById('vendaValor').value) || 0,
    desconto: parseFloat(document.getElementById('vendaDesconto').value) || 0,
    formaPagamento: document.getElementById('vendaFormaPagamento').value,
    parcelas: parseInt(document.getElementById('vendaParcelas').value) || 1,
    entrada: parseFloat(document.getElementById('vendaEntrada').value) || 0,
    data: document.getElementById('vendaData').value,
    observacao: document.getElementById('vendaObservacao').value.trim(),
    recebido: document.getElementById('vendaRecebido').checked
  };

  try {
    await upsertItem('vendas', obj);
    closeModal('modalVenda');
    resetVendaForm();
    renderVendas();
  } catch (e) {
    showToast('Erro ao salvar venda.', 'error');
    console.error(e);
  }
}

export function editarVenda(id) {
  for (var i = 0; i < data.vendas.length; i++) {
    if (data.vendas[i].id === id) {
      var v = data.vendas[i];
      document.getElementById('vendaEditId').value = v.id;
      document.getElementById('vendaProdutoId').value = v.produtoId;
      if (vendaAutocomplete) vendaAutocomplete.setValue(v.clienteId);
      document.getElementById('vendaTelefone').value = v.telefone || '';
      document.getElementById('vendaInstagram').value = v.instagram || '';
      document.getElementById('vendaValor').value = v.valor;
      document.getElementById('vendaDesconto').value = v.desconto || 0;
      document.getElementById('vendaFormaPagamento').value = v.formaPagamento || '';
      document.getElementById('vendaParcelas').value = v.parcelas || 1;
      document.getElementById('vendaEntrada').value = v.entrada || 0;
      document.getElementById('vendaData').value = v.data || '';
      document.getElementById('vendaObservacao').value = v.observacao || '';
      document.getElementById('vendaRecebido').checked = !!v.recebido;
      document.getElementById('modalVendaTitle').textContent = 'Editar Venda';

      var prodNome = '';
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === v.produtoId) { prodNome = data.produtos[pi].nome; break; }
      }

      var stepC = document.getElementById('vendaStepContainer')
      var readOnly = document.getElementById('vendaProdutoReadonly')
      var valorRow = document.getElementById('vendaValorRow')
      if (stepC) stepC.style.display = 'none'
      toggleVendaFormaPagamento()
      if (readOnly) {
        readOnly.style.display = ''
        readOnly.innerHTML =
          '<i class="fas fa-gem"></i>' +
          '<div><div class="venda-prod-read-label">Produto</div>' +
          '<div class="venda-prod-read-val">' + prodNome + ' · ' + formatCurrency(v.valor) + '</div></div>'
      }
      if (valorRow) valorRow.style.display = ''
      var resumo = document.getElementById('vendaResumo')
      if (resumo) resumo.style.display = 'none'
      var btn = document.getElementById('vendaSalvarBtn')
      if (btn) { btn.textContent = 'Salvar'; btn.disabled = false }

      openModal('modalVenda');
      return;
    }
  }
}
window.editarVenda = editarVenda;

export async function excluirVenda(id) {
  var c = await showConfirm('Tem certeza que deseja excluir esta venda?');
  if (!c) return;
  try {
    var prodId = null;
    for (var i = 0; i < data.vendas.length; i++) {
      if (data.vendas[i].id === id) { prodId = data.vendas[i].produtoId; break; }
    }
    await removeItem('vendas', id);
    if (prodId) {
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === prodId && data.produtos[pi].status === 'Vendido') {
          data.produtos[pi].status = 'Dispon\u00edvel';
          await upsertItem('produtos', data.produtos[pi]);
          break;
        }
      }
    }
    logMovimentacao('venda_cancelada', 'Venda cancelada', { vendaId: id });
    renderVendas();
  } catch (e) {
    showToast('Erro ao excluir venda.', 'error');
    console.error(e);
  }
}
window.excluirVenda = excluirVenda;

function daysUntil(d) {
  if (!d) return null;
  var target = new Date(d + 'T23:59:59');
  var now = new Date();
  var diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
