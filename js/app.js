(function () {
  'use strict';

  /* ======================== MOCK DATA ======================== */
  var MOCK_DATA = {
    maletas: [
      { id: '1', nome: 'Coleção Verão 2025', codigo: 'MLT-001', origem: 'Fornecedor A', dataRecebimento: '2025-01-10', dataLimite: '2025-04-10', status: 'Ativa', observacoes: 'Primeira remessa do ano.' },
      { id: '2', nome: 'Linha Luxo', codigo: 'MLT-002', origem: 'Fornecedor B', dataRecebimento: '2025-02-01', dataLimite: '2025-05-01', status: 'Ativa', observacoes: 'Peças selecionadas.' },
      { id: '3', nome: 'Promoção Inverno', codigo: 'MLT-003', origem: 'Fornecedor C', dataRecebimento: '2025-01-20', dataLimite: '2025-03-15', status: 'Finalizada', observacoes: '' }
    ],
    produtos: [
      { id: '1', codigo: 'PRD-001', nome: 'Brinco Argola Dourado', maletaId: '1', categoria: 'Brinco', subcategoria: 'Argola', cor: 'Dourado', material: 'Metal', pedras: 'Zircônia', precoCusto: 25.00, precoVenda: 79.90, status: 'Disponível', observacoes: '', fotoData: '' },
      { id: '2', codigo: 'PRD-002', nome: 'Colar Coração Prata', maletaId: '1', categoria: 'Colar', subcategoria: 'Coração', cor: 'Prata', material: 'Aço', pedras: '', precoCusto: 30.00, precoVenda: 99.90, status: 'Disponível', observacoes: '', fotoData: '' },
      { id: '3', codigo: 'PRD-003', nome: 'Pulseira Rosé', maletaId: '2', categoria: 'Pulseira', subcategoria: 'Corrente', cor: 'Rosé', material: 'Metal', pedras: '', precoCusto: 20.00, precoVenda: 69.90, status: 'Vendido', observacoes: 'Vendido em 15/02', fotoData: '' },
      { id: '4', codigo: 'PRD-004', nome: 'Anel Solitário', maletaId: '2', categoria: 'Anel', subcategoria: 'Solitário', cor: 'Dourado', material: 'Metal', pedras: 'Zircônia', precoCusto: 15.00, precoVenda: 49.90, status: 'Reservado', observacoes: '', fotoData: '' },
      { id: '5', codigo: 'PRD-005', nome: 'Brinco Argola Prata', maletaId: '3', categoria: 'Brinco', subcategoria: 'Argola', cor: 'Prata', material: 'Aço', pedras: '', precoCusto: 18.00, precoVenda: 59.90, status: 'Disponível', observacoes: '', fotoData: '' }
    ],
    vendas: [
      { id: '1', produtoId: '3', clienteId: '1', telefone: '(11) 99999-0001', instagram: '@maria_cliente', valor: 69.90, desconto: 5.00, formaPagamento: 'Pix', parcelas: 1, entrada: 69.90, data: '2025-02-15', observacao: '', recebido: true },
      { id: '2', produtoId: '4', clienteId: '2', telefone: '(11) 99999-0002', instagram: '@joao_cliente', valor: 49.90, desconto: 0, formaPagamento: 'Cartão Crédito', parcelas: 2, entrada: 24.95, data: '2025-02-20', observacao: 'Cliente voltou depois.', recebido: true }
    ],
    reservas: [
      { id: '1', produtoId: '4', clienteId: '2', dataReserva: '2025-02-18', dataExpiracao: '2025-02-28', status: 'Ativa' }
    ],
    clientes: [
      { id: '1', nome: 'Maria Silva', telefone: '(11) 99999-0001', instagram: '@maria_cliente', aniversario: '1990-05-15', observacoes: 'Cliente frequente.' },
      { id: '2', nome: 'João Santos', telefone: '(11) 99999-0002', instagram: '@joao_cliente', aniversario: '1985-08-22', observacoes: '' },
      { id: '3', nome: 'Ana Oliveira', telefone: '(11) 99999-0003', instagram: '@ana_cliente', aniversario: '1995-12-01', observacoes: 'Prefere contato por Instagram.' }
    ],
    devolucoes: []
  };

  /* ======================== STATE ======================== */
  var data;
  var mvMaletaId = null;

  /* ======================== HELPERS ======================== */
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function formatCurrency(v) {
    if (v === null || v === undefined || isNaN(v)) v = 0;
    return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+\,)/g, '$1.');
  }

  function formatDate(d) {
    if (!d) return '';
    var parts = d.split('-');
    if (parts.length !== 3) return d;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function daysUntil(d) {
    if (!d) return null;
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var target = new Date(d + 'T00:00:00');
    var diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function statusBadge(st) {
    var cls = 'default';
    switch (st) {
      case 'Ativa': case 'Disponível': cls = 'success'; break;
      case 'Finalizada': case 'Vendido': cls = 'info'; break;
      case 'Devolvida': case 'Devolvido': cls = 'warning'; break;
      case 'Reservado': case 'Ativa': cls = 'info'; break;
      case 'Expirada': case 'Cancelada': cls = 'danger'; break;
    }
    return '<span class="badge badge-' + cls + '">' + st + '</span>';
  }

  /* ======================== CUSTOM MODAL CONFIRM ======================== */
  var _confirmCallback = null;

  function showConfirm(message) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('modalConfirm').classList.add('open');
    return new Promise(function (resolve) {
      _confirmCallback = resolve;
    });
  }

  window.closeConfirm = function () {
    document.getElementById('modalConfirm').classList.remove('open');
    _confirmCallback = null;
  };

  window.executeConfirm = function () {
    document.getElementById('modalConfirm').classList.remove('open');
    if (_confirmCallback) {
      var cb = _confirmCallback;
      _confirmCallback = null;
      cb(true);
    }
  };

  /* ======================== TOAST ======================== */
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var icons = { error: 'fa-times-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + message + '</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(function () { if (toast.parentElement) toast.remove(); }, 300);
    }, 3000);
  }

  /* ======================== NAVIGATION ======================== */
  function navigate(section) {
    var sections = document.querySelectorAll('.section-content');
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.remove('active');
    }
    var target = document.getElementById('section-' + section);
    if (target) target.classList.add('active');

    var navItems = document.querySelectorAll('.nav-item');
    for (var j = 0; j < navItems.length; j++) {
      navItems[j].classList.remove('active');
      if (navItems[j].getAttribute('data-section') === section) {
        navItems[j].classList.add('active');
      }
    }

    renderAll();
  }

  /* ======================== MODAL SYSTEM ======================== */
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function closeAllModals() {
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var i = 0; i < overlays.length; i++) {
      overlays[i].classList.remove('open');
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModals();
  });

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  /* ======================== DATA PERSISTENCE ======================== */
  function saveData() {
    localStorage.setItem('bia_semijoias_data', JSON.stringify(data));
  }

  function loadData() {
    var stored = localStorage.getItem('bia_semijoias_data');
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (_) {
        data = JSON.parse(JSON.stringify(MOCK_DATA));
      }
    } else {
      data = JSON.parse(JSON.stringify(MOCK_DATA));
    }
  }

  /* ======================== SELECT POPULATORS ======================== */
  function popularSelectMaleta(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione uma maleta</option>';
    for (var i = 0; i < data.maletas.length; i++) {
      var m = data.maletas[i];
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.codigo + ' - ' + m.nome;
      sel.appendChild(opt);
    }
  }

  function popularSelectProduto(selectId, onlyDisponiveis) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um produto</option>';
    for (var i = 0; i < data.produtos.length; i++) {
      var p = data.produtos[i];
      if (onlyDisponiveis && p.status !== 'Disponível') continue;
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.codigo + ' - ' + p.nome + ' (' + p.status + ')';
      sel.appendChild(opt);
    }
  }

  function popularSelectCliente(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um cliente</option>';
    sel.innerHTML += '<option value="new">+ Novo Cliente</option>';
    for (var i = 0; i < data.clientes.length; i++) {
      var c = data.clientes[i];
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nome;
      sel.appendChild(opt);
    }
  }

  function popularSelectMaletaDevolucao() {
    var sel = document.getElementById('selectMaletaDevolucao');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Selecione --</option>';
    for (var i = 0; i < data.maletas.length; i++) {
      var m = data.maletas[i];
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.codigo + ' - ' + m.nome + ' (' + m.status + ')';
      sel.appendChild(opt);
    }
  }

  function popularFiltrosProdutos() {
    var catSel = document.getElementById('filterProdCategoria');
    var malSel = document.getElementById('filterProdMaleta');
    if (catSel) {
      catSel.innerHTML = '<option value="">Todas categorias</option>';
      var cats = {};
      for (var i = 0; i < data.produtos.length; i++) {
        if (data.produtos[i].categoria) cats[data.produtos[i].categoria] = true;
      }
      for (var c in cats) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        catSel.appendChild(opt);
      }
    }
    if (malSel) {
      malSel.innerHTML = '<option value="">Todas maletas</option>';
      for (var j = 0; j < data.maletas.length; j++) {
        var m = data.maletas[j];
        var opt2 = document.createElement('option');
        opt2.value = m.id;
        opt2.textContent = m.codigo + ' - ' + m.nome;
        malSel.appendChild(opt2);
      }
    }
  }

  /* ======================== DASHBOARD ======================== */
  function renderDashboard() {
    var totalEstoque = 0;
    for (var i = 0; i < data.produtos.length; i++) {
      if (data.produtos[i].status !== 'Devolvido') totalEstoque++;
    }
    document.getElementById('metricTotalEstoque').textContent = totalEstoque;

    var maletasAtivas = 0;
    for (var j = 0; j < data.maletas.length; j++) {
      if (data.maletas[j].status === 'Ativa') maletasAtivas++;
    }
    document.getElementById('metricMaletasAtivas').textContent = maletasAtivas;

    var disponiveis = 0;
    for (var k = 0; k < data.produtos.length; k++) {
      if (data.produtos[k].status === 'Disponível') disponiveis++;
    }
    document.getElementById('metricProdDisponiveis').textContent = disponiveis;

    var now = new Date();
    var mesAtual = now.getMonth();
    var anoAtual = now.getFullYear();
    var vendidosMes = 0;
    for (var l = 0; l < data.vendas.length; l++) {
      var v = data.vendas[l];
      if (v.data) {
        var vd = new Date(v.data + 'T00:00:00');
        if (vd.getMonth() === mesAtual && vd.getFullYear() === anoAtual) vendidosMes++;
      }
    }
    document.getElementById('metricProdVendidos').textContent = vendidosMes;

    var reservados = 0;
    for (var m = 0; m < data.produtos.length; m++) {
      if (data.produtos[m].status === 'Reservado') reservados++;
    }
    document.getElementById('metricProdReservados').textContent = reservados;

    var fatMes = 0;
    for (var n = 0; n < data.vendas.length; n++) {
      var v2 = data.vendas[n];
      if (v2.recebido && v2.data) {
        var vd2 = new Date(v2.data + 'T00:00:00');
        if (vd2.getMonth() === mesAtual && vd2.getFullYear() === anoAtual) {
          fatMes += (v2.valor - (v2.desconto || 0));
        }
      }
    }
    document.getElementById('metricFaturamentoMes').textContent = formatCurrency(fatMes);

    var alertText = document.getElementById('alertDevolucoesText');
    var proximas = [];
    for (var p = 0; p < data.maletas.length; p++) {
      var mal = data.maletas[p];
      if (mal.status === 'Ativa' && mal.dataLimite) {
        var days = daysUntil(mal.dataLimite);
        if (days !== null && days >= 0 && days <= 15) {
          proximas.push(mal.codigo + ' - ' + mal.nome + ' (' + days + ' dias)');
        }
      }
    }
    if (proximas.length > 0) {
      alertText.textContent = 'Maletas próximas do prazo: ' + proximas.join('; ') + '.';
    } else {
      alertText.textContent = 'Nenhuma maleta próxima do prazo limite.';
    }

    var chartEl = document.getElementById('chartBars');
    if (chartEl) {
      chartEl.innerHTML = '';
      var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      var vendasPorMes = [];
      for (var mi = 0; mi < 12; mi++) vendasPorMes[mi] = 0;
      for (var vi = 0; vi < data.vendas.length; vi++) {
        var v3 = data.vendas[vi];
        if (v3.data) {
          var vd3 = new Date(v3.data + 'T00:00:00');
          if (vd3.getFullYear() === anoAtual) {
            vendasPorMes[vd3.getMonth()] += v3.valor - (v3.desconto || 0);
          }
        }
      }
      var maxVal = 0;
      for (var mi2 = 0; mi2 < 12; mi2++) {
        if (vendasPorMes[mi2] > maxVal) maxVal = vendasPorMes[mi2];
      }
      for (var mi3 = 0; mi3 < 6; mi3++) {
        var idx = mi3;
        var val = vendasPorMes[idx];
        var h = maxVal > 0 ? Math.max(20, (val / maxVal) * 140) : 20;
        var bar = document.createElement('div');
        bar.className = 'bar' + (mi3 % 2 === 1 ? ' rose' : '');
        bar.style.height = Math.round(h) + 'px';
        bar.innerHTML = '<span class="bar-label">' + meses[idx] + '</span>';
        chartEl.appendChild(bar);
      }
    }
  }

  /* ======================== MALETAS ======================== */
  function renderMaletas() {
    var search = (document.getElementById('searchMaleta').value || '').toLowerCase();
    var tbody = document.getElementById('tabelaMaletas');
    var empty = document.getElementById('emptyMaletas');
    tbody.innerHTML = '';

    var filtered = [];
    for (var i = 0; i < data.maletas.length; i++) {
      var m = data.maletas[i];
      if (search && m.nome.toLowerCase().indexOf(search) === -1) continue;
      filtered.push(m);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var j = 0; j < filtered.length; j++) {
      var m2 = filtered[j];
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + m2.codigo + '</td>' +
        '<td>' + m2.nome + '</td>' +
        '<td>' + (m2.origem || '-') + '</td>' +
        '<td>' + formatDate(m2.dataRecebimento) + '</td>' +
        '<td>' + formatDate(m2.dataLimite) + '</td>' +
        '<td>' + statusBadge(m2.status) + '</td>' +
        '<td class="actions-cell">' +
        '<button class="btn-icon rose" onclick="window.abrirVendasMaleta(\'' + m2.id + '\')" title="Vender"><i class="fas fa-shopping-cart"></i></button>' +
        '<button class="btn-icon" onclick="window.editarMaleta(\'' + m2.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon danger" onclick="window.excluirMaleta(\'' + m2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</td>';
      tbody.appendChild(tr);
    }
  }

  function salvarMaleta() {
    var editId = document.getElementById('maletaEditId').value;
    var nome = document.getElementById('maletaNome').value.trim();
    var codigo = document.getElementById('maletaCodigo').value.trim();

    if (!nome) { showToast('O campo Nome é obrigatório.', 'error'); return; }
    if (!codigo) { showToast('O campo Código é obrigatório.', 'error'); return; }

    var obj = {
      nome: nome,
      codigo: codigo,
      origem: document.getElementById('maletaOrigem').value.trim(),
      dataRecebimento: document.getElementById('maletaDataRecebimento').value,
      dataLimite: document.getElementById('maletaDataLimite').value,
      status: document.getElementById('maletaStatus').value,
      observacoes: document.getElementById('maletaObservacoes').value.trim()
    };

    if (editId) {
      for (var i = 0; i < data.maletas.length; i++) {
        if (data.maletas[i].id === editId) {
          for (var key in obj) data.maletas[i][key] = obj[key];
          break;
        }
      }
    } else {
      obj.id = genId();
      data.maletas.push(obj);
    }

    saveData();
    closeModal('modalMaleta');
    limparFormMaleta();
    renderAll();
  }

  function editarMaleta(id) {
    for (var i = 0; i < data.maletas.length; i++) {
      if (data.maletas[i].id === id) {
        var m = data.maletas[i];
        document.getElementById('maletaEditId').value = m.id;
        document.getElementById('maletaNome').value = m.nome;
        document.getElementById('maletaCodigo').value = m.codigo;
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

  async function excluirMaleta(id) {
    var c = await showConfirm('Tem certeza que deseja excluir esta maleta?');
    if (!c) return;
    var idx = -1;
    for (var i = 0; i < data.maletas.length; i++) {
      if (data.maletas[i].id === id) { idx = i; break; }
    }
    if (idx > -1) {
      data.maletas.splice(idx, 1);
      saveData();
      renderAll();
    }
  }

  function limparFormMaleta() {
    document.getElementById('maletaEditId').value = '';
    document.getElementById('maletaNome').value = '';
    document.getElementById('maletaCodigo').value = '';
    document.getElementById('maletaOrigem').value = '';
    document.getElementById('maletaDataRecebimento').value = '';
    document.getElementById('maletaDataLimite').value = '';
    document.getElementById('maletaStatus').value = 'Ativa';
    document.getElementById('maletaObservacoes').value = '';
    document.getElementById('modalMaletaTitle').textContent = 'Nova Maleta';
  }

  /* ======================== PRODUTOS ======================== */
  function renderProdutos() {
    var search = (document.getElementById('searchProduto').value || '').toLowerCase();
    var catFilter = document.getElementById('filterProdCategoria').value;
    var statusFilter = document.getElementById('filterProdStatus').value;
    var maletaFilter = document.getElementById('filterProdMaleta').value;
    var grid = document.getElementById('gridProdutos');
    var empty = document.getElementById('emptyProdutos');
    grid.innerHTML = '';

    var filtered = [];
    for (var i = 0; i < data.produtos.length; i++) {
      var p = data.produtos[i];
      if (search && p.nome.toLowerCase().indexOf(search) === -1 && p.codigo.toLowerCase().indexOf(search) === -1) continue;
      if (catFilter && p.categoria !== catFilter) continue;
      if (statusFilter && p.status !== statusFilter) continue;
      if (maletaFilter && p.maletaId !== maletaFilter) continue;
      filtered.push(p);
    }

    if (filtered.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var j = 0; j < filtered.length; j++) {
      var p2 = filtered[j];
      var maletaNome = '';
      for (var k = 0; k < data.maletas.length; k++) {
        if (data.maletas[k].id === p2.maletaId) { maletaNome = data.maletas[k].codigo; break; }
      }
      var card = document.createElement('div');
      card.className = 'prod-card';
      card.innerHTML =
        '<div class="prod-card-img" onclick="window.verProduto(\'' + p2.id + '\')">' +
        (p2.fotoData ? '<img src="' + p2.fotoData + '" alt="' + p2.nome + '">' : '<i class="fas fa-gem"></i>') +
        '</div>' +
        '<div class="prod-card-body">' +
        '<div class="prod-card-title">' + p2.nome + '</div>' +
        '<div class="prod-card-code">' + p2.codigo + (maletaNome ? ' | ' + maletaNome : '') + '</div>' +
        '<div class="prod-card-price">' + formatCurrency(p2.precoVenda) + '</div>' +
        '<div style="margin:4px 0;">' + statusBadge(p2.status) + '</div>' +
        '<div class="prod-card-actions">' +
        '<button class="btn-icon" onclick="window.editarProduto(\'' + p2.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon" onclick="window.verProduto(\'' + p2.id + '\')" title="Visualizar"><i class="fas fa-eye"></i></button>' +
        '<button class="btn-icon danger" onclick="window.excluirProduto(\'' + p2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</div></div>';
      grid.appendChild(card);
    }
  }

  function salvarProduto() {
    var editId = document.getElementById('produtoEditId').value;
    var codigo = document.getElementById('produtoCodigo').value.trim();
    var nome = document.getElementById('produtoNome').value.trim();
    var precoVenda = parseFloat(document.getElementById('produtoPrecoVenda').value);

    if (!codigo) { showToast('O campo Código é obrigatório.', 'error'); return; }
    if (!nome) { showToast('O campo Nome é obrigatório.', 'error'); return; }
    if (!precoVenda || isNaN(precoVenda)) { showToast('O campo Preço Venda é obrigatório e deve ser um valor numérico.', 'error'); return; }

    var fotoInput = document.getElementById('produtoFoto');
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var obj = buildProdutoObj(editId, codigo, nome, precoVenda, e.target.result);
        finishSaveProduto(editId, obj);
      };
      reader.readAsDataURL(fotoInput.files[0]);
    } else {
      var obj2 = buildProdutoObj(editId, codigo, nome, precoVenda, '');
      finishSaveProduto(editId, obj2);
    }
  }

  function buildProdutoObj(editId, codigo, nome, precoVenda, fotoData) {
    var existingFoto = '';
    if (editId) {
      for (var i = 0; i < data.produtos.length; i++) {
        if (data.produtos[i].id === editId) { existingFoto = data.produtos[i].fotoData || ''; break; }
      }
    }
    return {
      codigo: codigo,
      nome: nome,
      maletaId: document.getElementById('produtoMaleta').value,
      categoria: document.getElementById('produtoCategoria').value.trim(),
      subcategoria: document.getElementById('produtoSubcategoria').value.trim(),
      cor: document.getElementById('produtoCor').value.trim(),
      material: document.getElementById('produtoMaterial').value.trim(),
      pedras: document.getElementById('produtoPedras').value.trim(),
      precoCusto: parseFloat(document.getElementById('produtoPrecoCusto').value) || 0,
      precoVenda: precoVenda,
      status: document.getElementById('produtoStatus').value,
      observacoes: document.getElementById('produtoObservacoes').value.trim(),
      fotoData: fotoData || existingFoto
    };
  }

  function finishSaveProduto(editId, obj) {
    if (editId) {
      for (var i = 0; i < data.produtos.length; i++) {
        if (data.produtos[i].id === editId) {
          for (var key in obj) data.produtos[i][key] = obj[key];
          break;
        }
      }
    } else {
      obj.id = genId();
      data.produtos.push(obj);
    }
    saveData();
    closeModal('modalProduto');
    limparFormProduto();
    renderAll();
  }

  function editarProduto(id) {
    for (var i = 0; i < data.produtos.length; i++) {
      if (data.produtos[i].id === id) {
        var p = data.produtos[i];
        document.getElementById('produtoEditId').value = p.id;
        document.getElementById('produtoCodigo').value = p.codigo;
        document.getElementById('produtoNome').value = p.nome;
        document.getElementById('produtoMaleta').value = p.maletaId || '';
        document.getElementById('produtoCategoria').value = p.categoria || '';
        document.getElementById('produtoSubcategoria').value = p.subcategoria || '';
        document.getElementById('produtoCor').value = p.cor || '';
        document.getElementById('produtoMaterial').value = p.material || '';
        document.getElementById('produtoPedras').value = p.pedras || '';
        document.getElementById('produtoPrecoCusto').value = p.precoCusto || '';
        document.getElementById('produtoPrecoVenda').value = p.precoVenda || '';
        document.getElementById('produtoStatus').value = p.status;
        document.getElementById('produtoObservacoes').value = p.observacoes || '';
        document.getElementById('produtoFoto').value = '';
        document.getElementById('modalProdutoTitle').textContent = 'Editar Produto';
        openModal('modalProduto');
        return;
      }
    }
  }

  async function excluirProduto(id) {
    var c = await showConfirm('Tem certeza que deseja excluir este produto?');
    if (!c) return;
    var idx = -1;
    for (var i = 0; i < data.produtos.length; i++) {
      if (data.produtos[i].id === id) { idx = i; break; }
    }
    if (idx > -1) {
      data.produtos.splice(idx, 1);
      saveData();
      renderAll();
    }
  }

  function duplicarProduto() {
    var editId = document.getElementById('produtoEditId').value;
    if (!editId) { showToast('Edite um produto primeiro para duplicá-lo.', 'warning'); return; }
    for (var i = 0; i < data.produtos.length; i++) {
      if (data.produtos[i].id === editId) {
        var orig = data.produtos[i];
        var novo = JSON.parse(JSON.stringify(orig));
        novo.id = genId();
        novo.codigo = orig.codigo + '-COPY';
        novo.nome = orig.nome + ' (Cópia)';
        novo.status = 'Disponível';
        data.produtos.push(novo);
        saveData();
        closeModal('modalProduto');
        limparFormProduto();
        renderAll();
        return;
      }
    }
  }

  function verProduto(id) {
    for (var i = 0; i < data.produtos.length; i++) {
      if (data.produtos[i].id === id) {
        var p = data.produtos[i];
        var body = document.getElementById('produtoViewBody');
        var imgHtml = p.fotoData
          ? '<div style="text-align:center;margin-bottom:16px;"><img src="' + p.fotoData + '" style="max-width:200px;max-height:200px;border-radius:var(--radius);object-fit:cover;"></div>'
          : '<div style="text-align:center;margin-bottom:16px;"><div style="width:120px;height:120px;background:var(--border-light);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:48px;color:var(--text-light);"><i class="fas fa-gem"></i></div></div>';
        var maletaNome = '';
        for (var j = 0; j < data.maletas.length; j++) {
          if (data.maletas[j].id === p.maletaId) { maletaNome = data.maletas[j].codigo + ' - ' + data.maletas[j].nome; break; }
        }
        var detailsHtml =
          '<div class="detail-row"><span class="detail-label">Código</span><span class="detail-value">' + p.codigo + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">' + p.nome + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Maleta</span><span class="detail-value">' + (maletaNome || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Categoria</span><span class="detail-value">' + (p.categoria || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Subcategoria</span><span class="detail-value">' + (p.subcategoria || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Cor</span><span class="detail-value">' + (p.cor || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Material</span><span class="detail-value">' + (p.material || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Pedras</span><span class="detail-value">' + (p.pedras || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Preço Custo</span><span class="detail-value">' + formatCurrency(p.precoCusto) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Preço Venda</span><span class="detail-value">' + formatCurrency(p.precoVenda) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">' + statusBadge(p.status) + '</span></div>';
        if (p.observacoes) {
          detailsHtml += '<div class="detail-row"><span class="detail-label">Obs</span><span class="detail-value">' + p.observacoes + '</span></div>';
        }
        body.innerHTML = imgHtml + '<div id="produtoViewDetails">' + detailsHtml + '</div>';
        openModal('modalProdutoView');
        return;
      }
    }
  }

  function limparFormProduto() {
    document.getElementById('produtoEditId').value = '';
    document.getElementById('produtoCodigo').value = '';
    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoMaleta').value = '';
    document.getElementById('produtoCategoria').value = '';
    document.getElementById('produtoSubcategoria').value = '';
    document.getElementById('produtoCor').value = '';
    document.getElementById('produtoMaterial').value = '';
    document.getElementById('produtoPedras').value = '';
    document.getElementById('produtoPrecoCusto').value = '';
    document.getElementById('produtoPrecoVenda').value = '';
    document.getElementById('produtoStatus').value = 'Disponível';
    document.getElementById('produtoObservacoes').value = '';
    document.getElementById('produtoFoto').value = '';
    document.getElementById('modalProdutoTitle').textContent = 'Novo Produto';
  }

  /* ======================== VENDAS ======================== */
  function renderVendas() {
    var search = (document.getElementById('searchVenda').value || '').toLowerCase();
    var tbody = document.getElementById('tabelaVendas');
    var empty = document.getElementById('emptyVendas');
    tbody.innerHTML = '';

    var filtered = [];
    for (var i = 0; i < data.vendas.length; i++) {
      var v = data.vendas[i];
      var produtoNome = '';
      var clienteNome = '';
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === v.produtoId) { produtoNome = data.produtos[j].nome; break; }
      }
      for (var k = 0; k < data.clientes.length; k++) {
        if (data.clientes[k].id === v.clienteId) { clienteNome = data.clientes[k].nome; break; }
      }
      if (search && produtoNome.toLowerCase().indexOf(search) === -1 && clienteNome.toLowerCase().indexOf(search) === -1) continue;
      filtered.push({ venda: v, produtoNome: produtoNome, clienteNome: clienteNome });
    }

    if (filtered.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var l = 0; l < filtered.length; l++) {
      var item = filtered[l];
      var v2 = item.venda;
      var total = v2.valor - (v2.desconto || 0);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + item.produtoNome + '</td>' +
        '<td>' + item.clienteNome + '</td>' +
        '<td>' + formatCurrency(v2.valor) + '</td>' +
        '<td>' + formatCurrency(v2.desconto || 0) + '</td>' +
        '<td>' + v2.formaPagamento + '</td>' +
        '<td>' + formatDate(v2.data) + '</td>' +
        '<td>' + (v2.recebido ? statusBadge('Recebido') : '<span class="badge badge-warning">Pendente</span>') + '</td>' +
        '<td class="actions-cell">' +
        '<button class="btn-icon" onclick="window.editarVenda(\'' + v2.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon danger" onclick="window.excluirVenda(\'' + v2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</td>';
      tbody.appendChild(tr);
    }
  }

  function salvarVenda() {
    var editId = document.getElementById('vendaEditId').value;
    var produtoId = document.getElementById('vendaProduto').value;
    var clienteId = document.getElementById('vendaCliente').value;

    if (!produtoId) { showToast('Selecione um produto.', 'error'); return; }
    if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }

    var valor = parseFloat(document.getElementById('vendaValor').value);
    if (!valor || isNaN(valor)) { showToast('Informe o valor da venda.', 'error'); return; }

    var obj = {
      produtoId: produtoId,
      clienteId: clienteId,
      telefone: document.getElementById('vendaTelefone').value.trim(),
      instagram: document.getElementById('vendaInstagram').value.trim(),
      valor: valor,
      desconto: parseFloat(document.getElementById('vendaDesconto').value) || 0,
      formaPagamento: document.getElementById('vendaFormaPagamento').value,
      parcelas: parseInt(document.getElementById('vendaParcelas').value) || 1,
      entrada: parseFloat(document.getElementById('vendaEntrada').value) || 0,
      data: document.getElementById('vendaData').value,
      observacao: document.getElementById('vendaObservacao').value.trim(),
      recebido: document.getElementById('vendaRecebido').checked
    };

    if (editId) {
      for (var i = 0; i < data.vendas.length; i++) {
        if (data.vendas[i].id === editId) {
          for (var key in obj) data.vendas[i][key] = obj[key];
          break;
        }
      }
    } else {
      obj.id = genId();
      data.vendas.push(obj);
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === produtoId) {
          data.produtos[j].status = 'Vendido';
          break;
        }
      }
    }

    saveData();
    closeModal('modalVenda');
    limparFormVenda();
    renderAll();
  }

  function editarVenda(id) {
    for (var i = 0; i < data.vendas.length; i++) {
      if (data.vendas[i].id === id) {
        var v = data.vendas[i];
        document.getElementById('vendaEditId').value = v.id;
        document.getElementById('vendaProduto').value = v.produtoId;
        document.getElementById('vendaCliente').value = v.clienteId;
        document.getElementById('vendaTelefone').value = v.telefone || '';
        document.getElementById('vendaInstagram').value = v.instagram || '';
        document.getElementById('vendaValor').value = v.valor;
        document.getElementById('vendaDesconto').value = v.desconto || 0;
        document.getElementById('vendaFormaPagamento').value = v.formaPagamento;
        document.getElementById('vendaParcelas').value = v.parcelas || 1;
        document.getElementById('vendaEntrada').value = v.entrada || 0;
        document.getElementById('vendaData').value = v.data || '';
        document.getElementById('vendaObservacao').value = v.observacao || '';
        document.getElementById('vendaRecebido').checked = v.recebido;
        document.getElementById('modalVendaTitle').textContent = 'Editar Venda';
        openModal('modalVenda');
        return;
      }
    }
  }

  async function excluirVenda(id) {
    var c = await showConfirm('Tem certeza que deseja excluir esta venda?');
    if (!c) return;
    var idx = -1;
    for (var i = 0; i < data.vendas.length; i++) {
      if (data.vendas[i].id === id) { idx = i; break; }
    }
    if (idx > -1) {
      var vendidoProdId = data.vendas[idx].produtoId;
      data.vendas.splice(idx, 1);
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === vendidoProdId && data.produtos[j].status === 'Vendido') {
          data.produtos[j].status = 'Disponível';
        }
      }
      saveData();
      renderAll();
    }
  }

  function limparFormVenda() {
    document.getElementById('vendaEditId').value = '';
    document.getElementById('vendaProduto').value = '';
    document.getElementById('vendaCliente').value = '';
    document.getElementById('vendaTelefone').value = '';
    document.getElementById('vendaInstagram').value = '';
    document.getElementById('vendaValor').value = '';
    document.getElementById('vendaDesconto').value = '0';
    document.getElementById('vendaFormaPagamento').value = 'Dinheiro';
    document.getElementById('vendaParcelas').value = '1';
    document.getElementById('vendaEntrada').value = '0';
    document.getElementById('vendaData').value = '';
    document.getElementById('vendaObservacao').value = '';
    document.getElementById('vendaRecebido').checked = true;
    document.getElementById('modalVendaTitle').textContent = 'Nova Venda';
  }

  /* ======================== RESERVAS ======================== */
  function renderReservas() {
    var now = new Date();
    for (var i = 0; i < data.reservas.length; i++) {
      var r = data.reservas[i];
      if (r.status === 'Ativa' && r.dataExpiracao) {
        var exp = new Date(r.dataExpiracao + 'T23:59:59');
        if (exp < now) {
          r.status = 'Expirada';
          for (var j = 0; j < data.produtos.length; j++) {
            if (data.produtos[j].id === r.produtoId && data.produtos[j].status === 'Reservado') {
              data.produtos[j].status = 'Disponível';
            }
          }
        }
      }
    }
    saveData();

    var search = (document.getElementById('searchReserva').value || '').toLowerCase();
    var tbody = document.getElementById('tabelaReservas');
    var empty = document.getElementById('emptyReservas');
    tbody.innerHTML = '';

    var filtered = [];
    for (var k = 0; k < data.reservas.length; k++) {
      var r2 = data.reservas[k];
      var pNome2 = '';
      var cNome2 = '';
      for (var a = 0; a < data.produtos.length; a++) {
        if (data.produtos[a].id === r2.produtoId) { pNome2 = data.produtos[a].nome; break; }
      }
      for (var b = 0; b < data.clientes.length; b++) {
        if (data.clientes[b].id === r2.clienteId) { cNome2 = data.clientes[b].nome; break; }
      }
      if (search && pNome2.toLowerCase().indexOf(search) === -1 && cNome2.toLowerCase().indexOf(search) === -1) continue;
      filtered.push({ reserva: r2, pNome: pNome2, cNome: cNome2 });
    }

    if (filtered.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var l = 0; l < filtered.length; l++) {
      var item = filtered[l];
      var r3 = item.reserva;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + item.pNome + '</td>' +
        '<td>' + item.cNome + '</td>' +
        '<td>' + formatDate(r3.dataReserva) + '</td>' +
        '<td>' + formatDate(r3.dataExpiracao) + '</td>' +
        '<td>' + statusBadge(r3.status) + '</td>' +
        '<td class="actions-cell">' +
        '<button class="btn-icon" onclick="window.editarReserva(\'' + r3.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-icon danger" onclick="window.excluirReserva(\'' + r3.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
        '</td>';
      tbody.appendChild(tr);
    }
  }

  function salvarReserva() {
    var editId = document.getElementById('reservaEditId').value;
    var produtoId = document.getElementById('reservaProduto').value;
    var clienteId = document.getElementById('reservaCliente').value;

    if (!produtoId) { showToast('Selecione um produto.', 'error'); return; }
    if (!clienteId) { showToast('Selecione um cliente.', 'error'); return; }
    if (!document.getElementById('reservaDataExpiracao').value) { showToast('Informe a data de expiração.', 'error'); return; }

    var obj = {
      produtoId: produtoId,
      clienteId: clienteId,
      dataReserva: document.getElementById('reservaDataReserva').value,
      dataExpiracao: document.getElementById('reservaDataExpiracao').value,
      status: document.getElementById('reservaStatus').value
    };

    if (editId) {
      for (var i = 0; i < data.reservas.length; i++) {
        if (data.reservas[i].id === editId) {
          for (var key in obj) data.reservas[i][key] = obj[key];
          break;
        }
      }
    } else {
      obj.id = genId();
      data.reservas.push(obj);
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === produtoId && data.produtos[j].status === 'Disponível') {
          data.produtos[j].status = 'Reservado';
        }
      }
    }

    saveData();
    closeModal('modalReserva');
    limparFormReserva();
    renderAll();
  }

  function editarReserva(id) {
    for (var i = 0; i < data.reservas.length; i++) {
      if (data.reservas[i].id === id) {
        var r = data.reservas[i];
        document.getElementById('reservaEditId').value = r.id;
        document.getElementById('reservaProduto').value = r.produtoId;
        document.getElementById('reservaCliente').value = r.clienteId;
        document.getElementById('reservaDataReserva').value = r.dataReserva || '';
        document.getElementById('reservaDataExpiracao').value = r.dataExpiracao || '';
        document.getElementById('reservaStatus').value = r.status || 'Ativa';
        document.getElementById('modalReservaTitle').textContent = 'Editar Reserva';
        openModal('modalReserva');
        return;
      }
    }
  }

  async function excluirReserva(id) {
    var c = await showConfirm('Tem certeza que deseja excluir esta reserva?');
    if (!c) return;
    var idx = -1;
    for (var i = 0; i < data.reservas.length; i++) {
      if (data.reservas[i].id === id) { idx = i; break; }
    }
    if (idx > -1) {
      var prodId = data.reservas[idx].produtoId;
      data.reservas.splice(idx, 1);
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === prodId && data.produtos[j].status === 'Reservado') {
          data.produtos[j].status = 'Disponível';
        }
      }
      saveData();
      renderAll();
    }
  }

  function limparFormReserva() {
    document.getElementById('reservaEditId').value = '';
    document.getElementById('reservaProduto').value = '';
    document.getElementById('reservaCliente').value = '';
    document.getElementById('reservaDataReserva').value = '';
    document.getElementById('reservaDataExpiracao').value = '';
    document.getElementById('reservaStatus').value = 'Ativa';
    document.getElementById('modalReservaTitle').textContent = 'Nova Reserva';
  }

  /* ======================== DEVOLUCOES ======================== */
  function carregarProdutosDevolucao() {
    var maletaId = document.getElementById('selectMaletaDevolucao').value;
    var card = document.getElementById('cardDevolucaoProdutos');
    var lista = document.getElementById('listaDevolucao');
    var maletaNomeEl = document.getElementById('devolucaoMaletaNome');
    var empty = document.getElementById('emptyDevolucoes');

    if (!maletaId) {
      card.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    var maletaNome = '';
    for (var i = 0; i < data.maletas.length; i++) {
      if (data.maletas[i].id === maletaId) { maletaNome = data.maletas[i].codigo + ' - ' + data.maletas[i].nome; break; }
    }
    maletaNomeEl.textContent = 'Produtos da ' + maletaNome;

    var produtos = [];
    for (var j = 0; j < data.produtos.length; j++) {
      if (data.produtos[j].maletaId === maletaId && data.produtos[j].status !== 'Devolvido' && data.produtos[j].status !== 'Vendido') {
        produtos.push(data.produtos[j]);
      }
    }

    lista.innerHTML = '';
    if (produtos.length === 0) {
      lista.innerHTML = '<p style="color:var(--text-secondary);">Nenhum produto disponível para devolução nesta maleta.</p>';
    } else {
      for (var k = 0; k < produtos.length; k++) {
        var p = produtos[k];
        var div = document.createElement('div');
        div.className = 'checkbox-group';
        div.innerHTML =
          '<input type="checkbox" id="devolver_' + p.id + '" value="' + p.id + '">' +
          '<label for="devolver_' + p.id + '">' + p.codigo + ' - ' + p.nome + ' (' + formatCurrency(p.precoVenda) + ')</label>';
        lista.appendChild(div);
      }
    }
    card.style.display = 'block';
  }

  async function confirmarDevolucao() {
    var maletaId = document.getElementById('selectMaletaDevolucao').value;
    if (!maletaId) { showToast('Selecione uma maleta.', 'error'); return; }

    var checkboxes = document.querySelectorAll('#listaDevolucao input[type="checkbox"]:checked');
    if (checkboxes.length === 0) { showToast('Selecione pelo menos um produto para devolver.', 'error'); return; }

    var conf = await showConfirm('Confirmar devolução de ' + checkboxes.length + ' produto(s)?');
    if (!conf) return;

    for (var i = 0; i < checkboxes.length; i++) {
      var prodId = checkboxes[i].value;
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === prodId) {
          data.produtos[j].status = 'Devolvido';
          break;
        }
      }
    }

    var dev = {
      id: genId(),
      maletaId: maletaId,
      data: new Date().toISOString().split('T')[0]
    };
    data.devolucoes.push(dev);

    var remaining = 0;
    for (var k = 0; k < data.produtos.length; k++) {
      if (data.produtos[k].maletaId === maletaId && data.produtos[k].status !== 'Vendido' && data.produtos[k].status !== 'Devolvido') {
        remaining++;
      }
    }
    if (remaining === 0) {
      for (var l = 0; l < data.maletas.length; l++) {
        if (data.maletas[l].id === maletaId) {
          data.maletas[l].status = 'Devolvida';
          break;
        }
      }
    }

    saveData();
    carregarProdutosDevolucao();
    renderAll();
  }

  /* ======================== FINANCEIRO ======================== */
  function renderFinanceiro() {
    var inicio = document.getElementById('finDataInicio').value;
    var fim = document.getElementById('finDataFim').value;

    var dateFilter = function (d) {
      if (!d) return true;
      if (inicio && d < inicio) return false;
      if (fim && d > fim) return false;
      return true;
    };

    var receitaTotal = 0;
    var custoTotal = 0;
    var transacoes = [];

    for (var i = 0; i < data.vendas.length; i++) {
      var v = data.vendas[i];
      if (!dateFilter(v.data)) continue;

      var pCusto = 0;
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === v.produtoId) { pCusto = data.produtos[j].precoCusto || 0; break; }
      }

      var valorLiq = v.valor - (v.desconto || 0);
      receitaTotal += valorLiq;
      custoTotal += pCusto;

      var pNome = '';
      for (var k = 0; k < data.produtos.length; k++) {
        if (data.produtos[k].id === v.produtoId) { pNome = data.produtos[k].nome; break; }
      }

      transacoes.push({
        data: v.data,
        descricao: 'Venda: ' + pNome,
        tipo: 'Receita',
        valor: valorLiq
      });
    }

    document.getElementById('finReceitaTotal').textContent = formatCurrency(receitaTotal);

    var lucro = receitaTotal - custoTotal;
    document.getElementById('finLucroLiquido').textContent = formatCurrency(Math.max(0, lucro));

    var comissao = receitaTotal * 0.10;
    document.getElementById('finComissoes').textContent = formatCurrency(comissao);

    var ticket = transacoes.length > 0 ? receitaTotal / transacoes.length : 0;
    document.getElementById('finTicketMedio').textContent = formatCurrency(ticket);

    var tbody = document.getElementById('tabelaTransacoes');
    var emptyT = document.getElementById('emptyTransacoes');
    tbody.innerHTML = '';

    transacoes.sort(function (a, b) { return b.data.localeCompare(a.data); });

    if (transacoes.length === 0) {
      emptyT.style.display = 'block';
    } else {
      emptyT.style.display = 'none';
      for (var l = 0; l < transacoes.length; l++) {
        var t = transacoes[l];
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + formatDate(t.data) + '</td>' +
          '<td>' + t.descricao + '</td>' +
          '<td><span class="badge badge-success">' + t.tipo + '</span></td>' +
          '<td>' + formatCurrency(t.valor) + '</td>';
        tbody.appendChild(tr);
      }
    }

    var chartEl = document.getElementById('finChartBars');
    if (chartEl) {
      chartEl.innerHTML = '';
      var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
      var receitasMes = [0, 0, 0, 0, 0, 0];
      var lucrosMes = [0, 0, 0, 0, 0, 0];
      var now = new Date();
      for (var vi = 0; vi < data.vendas.length; vi++) {
        var v2 = data.vendas[vi];
        if (!v2.data) continue;
        var vd = new Date(v2.data + 'T00:00:00');
        if (vd.getFullYear() === now.getFullYear() && vd.getMonth() < 6) {
          var idx = vd.getMonth();
          receitasMes[idx] += v2.valor - (v2.desconto || 0);
          for (var p = 0; p < data.produtos.length; p++) {
            if (data.produtos[p].id === v2.produtoId) {
              lucrosMes[idx] += (v2.valor - (v2.desconto || 0) - (data.produtos[p].precoCusto || 0));
              break;
            }
          }
        }
      }
      var maxR = 0;
      for (var mi = 0; mi < 6; mi++) { if (receitasMes[mi] > maxR) maxR = receitasMes[mi]; }
      for (var mi2 = 0; mi2 < 6; mi2++) {
        var h = maxR > 0 ? Math.max(20, (receitasMes[mi2] / maxR) * 130) : 20;
        var bar = document.createElement('div');
        bar.className = 'bar' + (mi2 % 2 === 1 ? ' rose' : '');
        bar.style.height = Math.round(h) + 'px';
        bar.innerHTML = '<span class="bar-label">' + meses[mi2] + '</span>';
        chartEl.appendChild(bar);
      }
    }
  }

  /* ======================== CLIENTES ======================== */
  function renderClientes() {
    var search = (document.getElementById('searchCliente').value || '').toLowerCase();
    var grid = document.getElementById('gridClientes');
    var empty = document.getElementById('emptyClientes');
    grid.innerHTML = '';

    var filtered = [];
    for (var i = 0; i < data.clientes.length; i++) {
      var c = data.clientes[i];
      if (search && c.nome.toLowerCase().indexOf(search) === -1 && (c.telefone || '').indexOf(search) === -1) continue;
      filtered.push(c);
    }

    if (filtered.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    for (var j = 0; j < filtered.length; j++) {
      var c2 = filtered[j];
      var totalCompras = 0;
      var qtdCompras = 0;
      for (var k = 0; k < data.vendas.length; k++) {
        if (data.vendas[k].clienteId === c2.id) {
          totalCompras += data.vendas[k].valor - (data.vendas[k].desconto || 0);
          qtdCompras++;
        }
      }
      var card = document.createElement('div');
      card.className = 'client-card';
      card.innerHTML =
        '<div class="client-card-avatar">' + c2.nome.charAt(0).toUpperCase() + '</div>' +
        '<div class="client-card-body">' +
        '<div class="client-card-name">' + c2.nome + '</div>' +
        '<div class="client-card-info">' + (c2.telefone || 'Sem telefone') + '</div>' +
        '<div class="client-card-info">' + (c2.instagram || '') + '</div>' +
        '<div class="client-card-info">' + qtdCompras + ' compra(s) | Total: ' + formatCurrency(totalCompras) + '</div>' +
        '<div class="client-card-actions" style="margin-top:8px;">' +
        '<button class="btn-sm btn-primary" onclick="window.verCliente(\'' + c2.id + '\')"><i class="fas fa-eye"></i> Detalhes</button> ' +
        '<button class="btn-sm btn-outline" onclick="window.editarCliente(\'' + c2.id + '\')"><i class="fas fa-edit"></i></button> ' +
        '<button class="btn-sm btn-outline danger" onclick="window.excluirCliente(\'' + c2.id + '\')"><i class="fas fa-trash"></i></button>' +
        '</div></div>';
      grid.appendChild(card);
    }
  }

  function salvarCliente() {
    var editId = document.getElementById('clienteEditId').value;
    var nome = document.getElementById('clienteNome').value.trim();

    if (!nome) { showToast('O campo Nome é obrigatório.', 'error'); return; }

    var obj = {
      nome: nome,
      telefone: document.getElementById('clienteTelefone').value.trim(),
      instagram: document.getElementById('clienteInstagram').value.trim(),
      aniversario: document.getElementById('clienteAniversario').value,
      observacoes: document.getElementById('clienteObservacoes').value.trim()
    };

    if (editId) {
      for (var i = 0; i < data.clientes.length; i++) {
        if (data.clientes[i].id === editId) {
          for (var key in obj) data.clientes[i][key] = obj[key];
          break;
        }
      }
    } else {
      obj.id = genId();
      data.clientes.push(obj);
    }

    saveData();
    closeModal('modalCliente');
    limparFormCliente();
    renderAll();
    var mvClientSelect = document.getElementById('mvCliente');
    if (mvClientSelect && !editId) {
      popularSelectCliente('mvCliente');
      mvClientSelect.value = obj.id;
      mvOnClienteChange();
    }
  }

  function editarCliente(id) {
    for (var i = 0; i < data.clientes.length; i++) {
      if (data.clientes[i].id === id) {
        var c = data.clientes[i];
        document.getElementById('clienteEditId').value = c.id;
        document.getElementById('clienteNome').value = c.nome;
        document.getElementById('clienteTelefone').value = c.telefone || '';
        document.getElementById('clienteInstagram').value = c.instagram || '';
        document.getElementById('clienteAniversario').value = c.aniversario || '';
        document.getElementById('clienteObservacoes').value = c.observacoes || '';
        document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
        openModal('modalCliente');
        return;
      }
    }
  }

  async function excluirCliente(id) {
    var c = await showConfirm('Tem certeza que deseja excluir este cliente?');
    if (!c) return;
    var idx = -1;
    for (var i = 0; i < data.clientes.length; i++) {
      if (data.clientes[i].id === id) { idx = i; break; }
    }
    if (idx > -1) {
      data.clientes.splice(idx, 1);
      saveData();
      renderAll();
    }
  }

  function verCliente(id) {
    for (var i = 0; i < data.clientes.length; i++) {
      if (data.clientes[i].id === id) {
        var c = data.clientes[i];
        var body = document.getElementById('clienteViewBody');
        var comprasHtml = '';
        var totalGasto = 0;
        var qtd = 0;
        for (var j = 0; j < data.vendas.length; j++) {
          if (data.vendas[j].clienteId === id) {
            var v = data.vendas[j];
            totalGasto += v.valor - (v.desconto || 0);
            qtd++;
            var pNomeV = '';
            for (var k = 0; k < data.produtos.length; k++) {
              if (data.produtos[k].id === v.produtoId) { pNomeV = data.produtos[k].nome; break; }
            }
            comprasHtml += '<tr><td>' + formatDate(v.data) + '</td><td>' + pNomeV + '</td><td>' + formatCurrency(v.valor - (v.desconto || 0)) + '</td></tr>';
          }
        }
        if (!comprasHtml) comprasHtml = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);">Nenhuma compra encontrada.</td></tr>';

        body.innerHTML =
          '<div style="text-align:center;margin-bottom:16px;">' +
          '<div style="width:80px;height:80px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:32px;font-weight:700;">' + c.nome.charAt(0).toUpperCase() + '</div>' +
          '<h3 style="margin-top:8px;">' + c.nome + '</h3>' +
          '</div>' +
          '<div class="detail-row"><span class="detail-label">Telefone</span><span class="detail-value">' + (c.telefone || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Instagram</span><span class="detail-value">' + (c.instagram || '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Aniversário</span><span class="detail-value">' + (c.aniversario ? formatDate(c.aniversario) : '-') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Total Gasto</span><span class="detail-value">' + formatCurrency(totalGasto) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Compras</span><span class="detail-value">' + qtd + '</span></div>' +
          (c.observacoes ? '<div class="detail-row"><span class="detail-label">Obs</span><span class="detail-value">' + c.observacoes + '</span></div>' : '') +
          '<h4 style="margin-top:16px;">Histórico de Compras</h4>' +
          '<table><thead><tr><th>Data</th><th>Produto</th><th>Valor</th></tr></thead><tbody>' + comprasHtml + '</tbody></table>';

        openModal('modalClienteView');
        return;
      }
    }
  }

  function limparFormCliente() {
    document.getElementById('clienteEditId').value = '';
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteInstagram').value = '';
    document.getElementById('clienteAniversario').value = '';
    document.getElementById('clienteObservacoes').value = '';
    document.getElementById('modalClienteTitle').textContent = 'Novo Cliente';
  }

  /* ======================== THEME ======================== */
  function toggleTheme() {
    var html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('bia_semijoias_theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('bia_semijoias_theme', 'dark');
    }
  }

  function loadTheme() {
    var saved = localStorage.getItem('bia_semijoias_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /* ======================== RENDER ALL ======================== */
  function renderAll() {
    popularSelectMaleta('produtoMaleta');
    popularSelectMaleta('vendaProduto');
    popularSelectMaleta('reservaProduto');
    popularSelectProduto('vendaProduto', true);
    popularSelectProduto('reservaProduto', true);
    popularSelectCliente('vendaCliente');
    popularSelectCliente('reservaCliente');
    popularSelectCliente('mvCliente');
    popularSelectMaletaDevolucao();
    popularFiltrosProdutos();

    renderDashboard();
    renderMaletas();
    renderProdutos();
    renderVendas();
    renderReservas();
    renderFinanceiro();
    renderClientes();
  }

  /* ======================== INIT ======================== */
  function initNavigation() {
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
      (function (item) {
        item.addEventListener('click', function () {
          var section = item.getAttribute('data-section');
          if (section) navigate(section);
        });
      })(navItems[i]);
    }

    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    var globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var term = globalSearch.value.trim();
          if (term) {
            document.getElementById('searchProduto').value = term;
            navigate('produtos');
          }
        }
      });
    }
  }

  /* ======================== VENDAS POR MALETA ======================== */

  function abrirVendasMaleta(maletaId) {
    mvMaletaId = maletaId;
    var maleta = null;
    for (var mi = 0; mi < data.maletas.length; mi++) {
      if (data.maletas[mi].id === maletaId) { maleta = data.maletas[mi]; break; }
    }
    if (maleta) {
      document.getElementById('mvMaletaNome').textContent = 'Vendas - ' + maleta.nome;
    }
    navigate('maleta-vendas');
    mvRenderCards();
    mvRenderVendidos();
    popularSelectCliente('mvCliente');
    document.getElementById('mvPanel').style.display = 'none';
    document.getElementById('mvDesconto').value = '0,00';
    document.getElementById('mvTroco').value = '';
    document.getElementById('mvTrocoResult').textContent = '';
    document.getElementById('mvTotalFinal').value = '';
    document.getElementById('mvFinalizarBtn').disabled = true;
  }

  function voltarMaletas() {
    navigate('maletas');
    mvMaletaId = null;
  }

  function mvToggleCard(produtoId, checkbox) {
    var card = checkbox.closest('.mv-card');
    if (!card) return;
    if (checkbox.checked) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
    mvAtualizarPainel();
  }

  function mvAtualizarPainel() {
    var checkboxes = document.querySelectorAll('#mvGrid .mv-card-checkbox:checked');
    var count = checkboxes.length;
    var panel = document.getElementById('mvPanel');
    if (count > 0) {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
      return;
    }
    document.getElementById('mvCount').textContent = count;
    var total = 0;
    for (var ci = 0; ci < checkboxes.length; ci++) {
      var card = checkboxes[ci].closest('.mv-card');
      if (card) {
        var price = parseFloat(card.getAttribute('data-preco')) || 0;
        total += price;
      }
    }
    document.getElementById('mvValorSugerido').textContent = formatCurrency(total);
    document.getElementById('mvValorFinal').value = total.toFixed(2).replace('.', ',');
    mvCalcularTotal();
  }

  function mvCalcularTotal() {
    var valorFinalStr = document.getElementById('mvValorFinal').value;
    var descontoStr = document.getElementById('mvDesconto').value;
    var valorFinal = parseFloat(valorFinalStr.replace(',', '.')) || 0;
    var desconto = parseFloat(descontoStr.replace(',', '.')) || 0;
    var final = valorFinal - desconto;
    if (final < 0) final = 0;
    document.getElementById('mvTotalFinal').value = final.toFixed(2).replace('.', ',');
    var cliente = document.getElementById('mvCliente').value;
    document.getElementById('mvFinalizarBtn').disabled = !(final > 0 && cliente);
  }

  function mvOnPagamentoChange() {
    var pag = document.getElementById('mvPagamento').value;
    document.getElementById('mvParcelasGroup').style.display = 'none';
    document.getElementById('mvTrocoGroup').style.display = 'none';
    document.getElementById('mvPixGroup').style.display = 'none';
    if (pag === 'Cartão de Crédito' || pag === 'Cartão de Débito') {
      document.getElementById('mvParcelasGroup').style.display = 'block';
    } else if (pag === 'Dinheiro') {
      document.getElementById('mvTrocoGroup').style.display = 'block';
    } else if (pag === 'PIX') {
      document.getElementById('mvPixGroup').style.display = 'block';
    }
  }

  function mvOnClienteChange() {
    var clienteId = document.getElementById('mvCliente').value;
    if (clienteId === 'new') {
      document.getElementById('mvCliente').value = '';
      document.getElementById('clienteEditId').value = '';
      document.getElementById('clienteNome').value = '';
      document.getElementById('clienteTelefone').value = '';
      document.getElementById('clienteInstagram').value = '';
      document.getElementById('clienteAniversario').value = '';
      document.getElementById('clienteObservacoes').value = '';
      document.getElementById('modalClienteTitle').textContent = 'Novo Cliente';
      openModal('modalCliente');
      return;
    }
    if (clienteId) {
      for (var cci = 0; cci < data.clientes.length; cci++) {
        var c = data.clientes[cci];
        if (c.id === clienteId) {
          document.getElementById('mvTelefone').value = c.telefone || '';
          document.getElementById('mvInstagram').value = c.instagram || '';
          break;
        }
      }
    } else {
      document.getElementById('mvTelefone').value = '';
      document.getElementById('mvInstagram').value = '';
    }
  }

  function mvCalcularTroco() {
    var trocoStr = document.getElementById('mvTroco').value;
    var totalStr = document.getElementById('mvTotalFinal').value;
    var troco = parseFloat(trocoStr.replace(',', '.')) || 0;
    var total = parseFloat(totalStr.replace(',', '.')) || 0;
    if (troco > total) {
      document.getElementById('mvTrocoResult').textContent = 'Troco: ' + formatCurrency(troco - total);
    } else {
      document.getElementById('mvTrocoResult').textContent = '';
    }
  }

  function mvLimparSelecao() {
    var checkboxes = document.querySelectorAll('#mvGrid .mv-card-checkbox');
    for (var li = 0; li < checkboxes.length; li++) {
      checkboxes[li].checked = false;
    }
    var cards = document.querySelectorAll('#mvGrid .mv-card');
    for (var li2 = 0; li2 < cards.length; li2++) {
      cards[li2].classList.remove('selected');
    }
    document.getElementById('mvPanel').style.display = 'none';
    document.getElementById('mvDesconto').value = '0,00';
    document.getElementById('mvTroco').value = '';
    document.getElementById('mvTrocoResult').textContent = '';
    document.getElementById('mvTotalFinal').value = '';
    document.getElementById('mvFinalizarBtn').disabled = true;
  }

  function mvFinalizarVenda() {
    var checkboxes = document.querySelectorAll('#mvGrid .mv-card-checkbox:checked');
    if (checkboxes.length === 0) {
      showToast('Selecione ao menos um produto.', 'warning');
      return;
    }
    var clienteId = document.getElementById('mvCliente').value;
    if (!clienteId) {
      showToast('Selecione um cliente.', 'warning');
      return;
    }
    var pagamento = document.getElementById('mvPagamento').value;
    if (!pagamento) {
      showToast('Selecione uma forma de pagamento.', 'warning');
      return;
    }
    var telefone = document.getElementById('mvTelefone').value;
    var instagram = document.getElementById('mvInstagram').value;
    var valorFinalStr = document.getElementById('mvValorFinal').value;
    var descontoStr = document.getElementById('mvDesconto').value;
    var valorFinal = parseFloat(valorFinalStr.replace(',', '.')) || 0;
    var desconto = parseFloat(descontoStr.replace(',', '.')) || 0;
    var parcelas = parseInt(document.getElementById('mvParcelas').value, 10) || 1;
    var recebido = document.getElementById('mvRecebido').checked;
    var concluida = document.getElementById('mvConcluida').checked;
    var obs = (document.getElementById('mvObservacao') || document.getElementById('mvObs')).value;
    var hoje = new Date();
    var dataStr = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
    var valorPorProduto = valorFinal / checkboxes.length;
    for (var fi = 0; fi < checkboxes.length; fi++) {
      var card = checkboxes[fi].closest('.mv-card');
      var produtoId = card ? card.getAttribute('data-produto-id') : null;
      if (!produtoId) continue;
      var venda = {
        id: genId(),
        produtoId: produtoId,
        clienteId: clienteId,
        telefone: telefone,
        instagram: instagram,
        valor: valorPorProduto,
        desconto: desconto / checkboxes.length,
        formaPagamento: pagamento,
        parcelas: parcelas,
        entrada: valorPorProduto,
        data: dataStr,
        observacao: obs,
        recebido: recebido
      };
      if (!data.vendas) data.vendas = [];
      data.vendas.push(venda);
      for (var pi = 0; pi < data.produtos.length; pi++) {
        if (data.produtos[pi].id === produtoId) {
          data.produtos[pi].status = concluida ? 'Vendido' : 'Reservado';
          break;
        }
      }
      for (var cli = 0; cli < data.clientes.length; cli++) {
        if (data.clientes[cli].id === clienteId) {
          if (!data.clientes[cli].historicoCompras) data.clientes[cli].historicoCompras = [];
          data.clientes[cli].historicoCompras.push({ produtoId: produtoId, data: dataStr, vendaId: venda.id });
          data.clientes[cli].totalGasto = (data.clientes[cli].totalGasto || 0) + valorPorProduto;
          break;
        }
      }
    }
    saveData();
    mvRenderCards();
    mvRenderVendidos();
    renderAll();
    showToast('Venda(s) realizada(s) com sucesso!', 'success');
    mvLimparSelecao();
  }

  function mvRenderVendidos() {
    var grid = document.getElementById('mvVendidosGrid');
    var empty = document.getElementById('mvVendidosEmpty');
    if (!grid || !empty) return;
    var vendasMaleta = [];
    for (var vi = 0; vi < data.vendas.length; vi++) {
      var v = data.vendas[vi];
      var prod = null;
      for (var pi3 = 0; pi3 < data.produtos.length; pi3++) {
        if (data.produtos[pi3].id === v.produtoId) { prod = data.produtos[pi3]; break; }
      }
      if (prod && prod.maletaId === mvMaletaId) {
        vendasMaleta.push({ venda: v, produto: prod });
      }
    }
    if (vendasMaleta.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    grid.style.display = 'flex';
    empty.style.display = 'none';
    grid.innerHTML = '';
    for (var vi2 = 0; vi2 < vendasMaleta.length; vi2++) {
      var item = vendasMaleta[vi2];
      var v2 = item.venda;
      var p = item.produto;
      var clientName = '';
      for (var ci3 = 0; ci3 < data.clientes.length; ci3++) {
        if (data.clientes[ci3].id === v2.clienteId) { clientName = data.clientes[ci3].nome; break; }
      }
      var card = document.createElement('div');
      card.className = 'mv-vendido-card';
      card.setAttribute('data-venda-id', v2.id);
      card.onclick = (function (vendaId) {
        return function () { mvVerDetalhe(vendaId); };
      })(v2.id);
      var fotoHtml = p.fotoData ? '<img src="' + p.fotoData + '" alt="' + p.nome + '">' : '<div class="mv-vendido-icon">💎</div>';
      card.innerHTML = fotoHtml +
        '<div class="mv-vendido-info">' +
        '<strong>' + p.nome + '</strong>' +
        '<span>' + formatCurrency(v2.valor) + ' - ' + formatDate(v2.data) + '</span>' +
        '<span>' + clientName + ' - ' + v2.formaPagamento + '</span>' +
        '</div>';
      grid.appendChild(card);
    }
  }

  function mvVerDetalhe(vendaId) {
    var venda = null;
    for (var dvi = 0; dvi < data.vendas.length; dvi++) {
      if (data.vendas[dvi].id === vendaId) { venda = data.vendas[dvi]; break; }
    }
    if (!venda) return;
    var produto = null;
    for (var dpi = 0; dpi < data.produtos.length; dpi++) {
      if (data.produtos[dpi].id === venda.produtoId) { produto = data.produtos[dpi]; break; }
    }
    var cliente = null;
    for (var dci = 0; dci < data.clientes.length; dci++) {
      if (data.clientes[dci].id === venda.clienteId) { cliente = data.clientes[dci]; break; }
    }
    var body = document.getElementById('mvDetalheBody');
    if (!body) return;
    body.innerHTML =
      '<div class="mv-detalhe-row"><label>Produto:</label><span>' + (produto ? produto.nome : '---') + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Código:</label><span>' + (produto ? produto.codigo : '---') + '</span></div>' +
      (produto && produto.fotoData ? '<div class="mv-detalhe-row"><label>Foto:</label><img src="' + produto.fotoData + '" style="max-width:120px;border-radius:6px;"></div>' : '') +
      '<div class="mv-detalhe-row"><label>Cliente:</label><span>' + (cliente ? cliente.nome : '---') + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Telefone:</label><span>' + (venda.telefone || '---') + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Instagram:</label><span>' + (venda.instagram || '---') + '</span></div>' +
      '<hr>' +
      '<div class="mv-detalhe-row"><label>Valor:</label><span>' + formatCurrency(venda.valor) + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Desconto:</label><span>' + formatCurrency(venda.desconto || 0) + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Total:</label><span>' + formatCurrency((venda.valor || 0) - (venda.desconto || 0)) + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Pagamento:</label><span>' + venda.formaPagamento + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Parcelas:</label><span>' + (venda.parcelas || 1) + '</span></div>' +
      '<div class="mv-detalhe-row"><label>Data:</label><span>' + formatDate(venda.data) + '</span></div>' +
      (venda.observacao ? '<div class="mv-detalhe-row"><label>Obs:</label><span>' + venda.observacao + '</span></div>' : '') +
      '<div class="mv-detalhe-row"><label>Recebido:</label><span>' + (venda.recebido ? 'Sim' : 'Não') + '</span></div>';
    document.getElementById('mvCancelarVendaBtn').setAttribute('data-venda-id', vendaId);
    openModal('modalMvDetalhe');
  }

  function mvCancelarVenda() {
    var vendaId = document.getElementById('mvCancelarVendaBtn').getAttribute('data-venda-id');
    if (!vendaId) return;
    showConfirm('Tem certeza que deseja cancelar esta venda?').then(function (c) {
      if (!c) return;
      var venda = null;
      var vendaIdx = -1;
      for (var cvi = 0; cvi < data.vendas.length; cvi++) {
        if (data.vendas[cvi].id === vendaId) { venda = data.vendas[cvi]; vendaIdx = cvi; break; }
      }
      if (!venda) return;
      var produto = null;
      for (var cpi = 0; cpi < data.produtos.length; cpi++) {
        if (data.produtos[cpi].id === venda.produtoId) { produto = data.produtos[cpi]; break; }
      }
      if (produto) {
        produto.status = 'Disponível';
      }
      data.vendas.splice(vendaIdx, 1);
      for (var ccli = 0; ccli < data.clientes.length; ccli++) {
        if (data.clientes[ccli].id === venda.clienteId) {
          data.clientes[ccli].totalGasto = (data.clientes[ccli].totalGasto || 0) - (venda.valor || 0);
          if (data.clientes[ccli].totalGasto < 0) data.clientes[ccli].totalGasto = 0;
          if (data.clientes[ccli].historicoCompras) {
            var novoHistorico = [];
            for (var hi = 0; hi < data.clientes[ccli].historicoCompras.length; hi++) {
              if (data.clientes[ccli].historicoCompras[hi].vendaId !== vendaId) {
                novoHistorico.push(data.clientes[ccli].historicoCompras[hi]);
              }
            }
            data.clientes[ccli].historicoCompras = novoHistorico;
          }
          break;
        }
      }
      saveData();
      closeModal('modalMvDetalhe');
      mvRenderVendidos();
      mvRenderCards();
      renderAll();
      showToast('Venda cancelada. Produto retornou ao estoque.', 'success');
    });
  }

  function mvRenderCards() {
    var grid = document.getElementById('mvGrid');
    var empty = document.getElementById('mvEmpty');
    if (!grid || !empty) return;
    var produtos = [];
    for (var pri = 0; pri < data.produtos.length; pri++) {
      var p = data.produtos[pri];
      if (p.maletaId === mvMaletaId && (p.status === 'Disponível' || p.status === 'Reservado')) {
        produtos.push(p);
      }
    }
    if (produtos.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    grid.style.display = 'flex';
    empty.style.display = 'none';
    grid.innerHTML = '';
    for (var pri2 = 0; pri2 < produtos.length; pri2++) {
      var prod = produtos[pri2];
      var card = document.createElement('div');
      card.className = 'mv-card' + (prod.status === 'Reservado' ? ' mv-card-reservado' : '');
      card.setAttribute('data-produto-id', prod.id);
      card.setAttribute('data-preco', prod.precoVenda);
      var fotoHtml = prod.fotoData ? '<img src="' + prod.fotoData + '" alt="' + prod.nome + '">' : '<div class="mv-card-icon">💎</div>';
      var checkboxId = 'mv-cb-' + prod.id;
      card.innerHTML =
        '<label class="mv-card-checkbox-label">' +
        '<input type="checkbox" class="mv-card-checkbox" id="' + checkboxId + '" onchange="mvToggleCard(\'' + prod.id + '\', this)">' +
        '<span class="mv-checkmark">&#10003;</span>' +
        '</label>' +
        fotoHtml +
        '<div class="mv-card-body">' +
        '<strong>' + prod.nome + '</strong>' +
        '<span class="mv-card-codigo">' + prod.codigo + '</span>' +
        '<span class="mv-card-categoria">' + (prod.categoria || '') + '</span>' +
        '<span class="mv-card-preco">' + formatCurrency(prod.precoVenda) + '</span>' +
        '</div>' +
        '<div class="mv-card-status">' + statusBadge(prod.status) + '</div>';
      grid.appendChild(card);
    }
  }

  /* ======================== EXPOSE TO WINDOW ======================== */
  window.navigate = navigate;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.popularSelectMaleta = popularSelectMaleta;
  window.popularSelectProduto = popularSelectProduto;
  window.popularSelectCliente = popularSelectCliente;
  window.popularSelectMaletaDevolucao = popularSelectMaletaDevolucao;
  window.popularFiltrosProdutos = popularFiltrosProdutos;

  window.renderDashboard = renderDashboard;
  window.renderMaletas = renderMaletas;
  window.salvarMaleta = salvarMaleta;
  window.editarMaleta = editarMaleta;
  window.excluirMaleta = excluirMaleta;
  window.limparFormMaleta = limparFormMaleta;

  window.renderProdutos = renderProdutos;
  window.salvarProduto = salvarProduto;
  window.finishSaveProduto = finishSaveProduto;
  window.editarProduto = editarProduto;
  window.excluirProduto = excluirProduto;
  window.duplicarProduto = duplicarProduto;
  window.verProduto = verProduto;
  window.limparFormProduto = limparFormProduto;

  window.renderVendas = renderVendas;
  window.salvarVenda = salvarVenda;
  window.editarVenda = editarVenda;
  window.excluirVenda = excluirVenda;
  window.limparFormVenda = limparFormVenda;

  window.renderReservas = renderReservas;
  window.salvarReserva = salvarReserva;
  window.editarReserva = editarReserva;
  window.excluirReserva = excluirReserva;
  window.limparFormReserva = limparFormReserva;

  window.carregarProdutosDevolucao = carregarProdutosDevolucao;
  window.confirmarDevolucao = confirmarDevolucao;

  window.renderFinanceiro = renderFinanceiro;

  window.renderClientes = renderClientes;
  window.salvarCliente = salvarCliente;
  window.editarCliente = editarCliente;
  window.excluirCliente = excluirCliente;
  window.verCliente = verCliente;
  window.limparFormCliente = limparFormCliente;

  window.abrirVendasMaleta = abrirVendasMaleta;
  window.voltarMaletas = voltarMaletas;
  window.mvToggleCard = mvToggleCard;
  window.mvAtualizarPainel = mvAtualizarPainel;
  window.mvCalcularTotal = mvCalcularTotal;
  window.mvOnPagamentoChange = mvOnPagamentoChange;
  window.mvOnClienteChange = mvOnClienteChange;
  window.mvCalcularTroco = mvCalcularTroco;
  window.mvLimparSelecao = mvLimparSelecao;
  window.mvFinalizarVenda = mvFinalizarVenda;
  window.mvRenderVendidos = mvRenderVendidos;
  window.mvRenderCards = mvRenderCards;
  window.mvVerDetalhe = mvVerDetalhe;
  window.mvCancelarVenda = mvCancelarVenda;

  window.toggleTheme = toggleTheme;
  window.renderAll = renderAll;

  window.formatCurrency = formatCurrency;
  window.formatDate = formatDate;
  window.daysUntil = daysUntil;
  window.statusBadge = statusBadge;

  /* ======================== BOOT ======================== */
  loadTheme();
  loadData();
  initNavigation();
  renderAll();

})();
