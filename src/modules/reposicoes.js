import { data, upsertItem, removeItem, logMovimentacao } from '../store.js';
import { formatDate } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { uploadImage } from '../services/imageKitService.js';

window.openModal = openModal;
window.closeModal = closeModal;

var _repoItems = [];
var _itemCounter = 0;

export function resetReposicaoForm() {
  document.getElementById('reposicaoMaleta').value = '';
  document.getElementById('reposicaoDataRecebimento').value = todayStr();
  document.getElementById('modalReposicaoTitle').textContent = 'Nova Reposição';
  _repoItems = [];
  _itemCounter = 0;
  popularSelectMaletaReposicao();
  adicionarItemReposicao();
}
window.resetReposicaoForm = resetReposicaoForm;

function popularSelectMaletaReposicao() {
  var sel = document.getElementById('reposicaoMaleta');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione uma maleta</option>';
  for (var i = 0; i < data.maletas.length; i++) {
    var m = data.maletas[i];
    if (m.status === 'Ativa') {
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.nome + (m.origem ? ' (' + m.origem + ')' : '');
      sel.appendChild(opt);
    }
  }
}

function popularCategoriaSelect(sel) {
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione</option>';
  for (var i = 0; i < data.categorias.length; i++) {
    var c = data.categorias[i];
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome;
    sel.appendChild(opt);
  }
}

window.adicionarItemReposicao = function() {
  var idx = _itemCounter++;
  _repoItems.push({ index: idx, file: null, fotoUrl: '', categoriaId: '', tamanho: '' });
  renderItemRow(idx);
  atualizarFooterReposicao();
};

window.removerItemReposicao = function(idx) {
  _repoItems = _repoItems.filter(function(i) { return i.index !== idx });
  reRenderItems();
  atualizarFooterReposicao();
};

window.repoItemCategoriaChange = function(idx) {
  for (var i = 0; i < _repoItems.length; i++) {
    if (_repoItems[i].index === idx) {
      var sel = document.getElementById('repoCat_' + idx);
      _repoItems[i].categoriaId = sel ? sel.value : '';
      var tam = document.getElementById('repoTam_' + idx);
      _repoItems[i].tamanho = tam ? tam.value.trim() : '';
      break;
    }
  }
  mostrarTamanhoItem(idx);
};

window.repoItemFileChange = function(idx, input) {
  if (!input || !input.files || !input.files[0]) return;
  for (var i = 0; i < _repoItems.length; i++) {
    if (_repoItems[i].index === idx) {
      _repoItems[i].file = input.files[0];
      break;
    }
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = document.getElementById('repoImg_' + idx);
    var empty = document.getElementById('repoEmpty_' + idx);
    var filled = document.getElementById('repoFilled_' + idx);
    if (img) img.src = e.target.result;
    if (empty) empty.style.display = 'none';
    if (filled) filled.style.display = '';
  };
  reader.readAsDataURL(input.files[0]);
};

function mostrarTamanhoItem(idx) {
  var sel = document.getElementById('repoCat_' + idx);
  var group = document.getElementById('repoTamGroup_' + idx);
  if (!sel || !group) return;
  var catId = sel.value;
  var isAnel = false;
  for (var i = 0; i < data.categorias.length; i++) {
    if (data.categorias[i].id === catId) {
      var nome = data.categorias[i].nome.toLowerCase();
      if (nome.indexOf('anel') !== -1 || nome.indexOf('ané') !== -1) isAnel = true;
      break;
    }
  }
  group.style.display = isAnel ? '' : 'none';
  if (!isAnel) {
    var input = document.getElementById('repoTam_' + idx);
    if (input) input.value = '';
  }
}

function renderItemRow(idx) {
  var container = document.getElementById('reposicaoItemsList');
  if (!container) return;

  var item = null;
  for (var i = 0; i < _repoItems.length; i++) {
    if (_repoItems[i].index === idx) { item = _repoItems[i]; break; }
  }
  if (!item) return;

  var div = document.createElement('div');
  div.className = 'repo-batch-item';
  div.id = 'repoItem_' + idx;
  div.dataset.index = idx;

  var num = _repoItems.indexOf(item) + 1;

  div.innerHTML =
    '<div class="repo-batch-top">' +
    '<span class="repo-batch-num">#' + num + '</span>' +
    '<button type="button" class="repo-batch-remove" onclick="removerItemReposicao(' + idx + ')"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div class="repo-batch-upload" onclick="document.getElementById(\'repoFile_' + idx + '\').click()">' +
    '<input type="file" id="repoFile_' + idx + '" accept="image/*" capture="environment" onchange="repoItemFileChange(' + idx + ', this)" style="display:none">' +
    '<div class="repo-batch-empty" id="repoEmpty_' + idx + '">' +
    '<i class="fas fa-camera"></i>' +
    '<span>Adicionar foto</span>' +
    '</div>' +
    '<div class="repo-batch-filled" id="repoFilled_' + idx + '" style="display:none">' +
    '<img id="repoImg_' + idx + '" class="repo-batch-img" alt="">' +
    '</div>' +
    '</div>' +
    '<select id="repoCat_' + idx + '" class="input repo-batch-cat" onchange="repoItemCategoriaChange(' + idx + ')"></select>' +
    '<div class="repo-batch-tam-group" id="repoTamGroup_' + idx + '" style="display:none">' +
    '<input type="text" id="repoTam_' + idx + '" class="input repo-batch-tam" placeholder="Tamanho ex: 18">' +
    '</div>';

  container.appendChild(div);
  popularCategoriaSelect(div.querySelector('.repo-batch-cat'));
}

function reRenderItems() {
  var container = document.getElementById('reposicaoItemsList');
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < _repoItems.length; i++) {
    var item = _repoItems[i];
    renderItemRow(item.index);

    var sel = document.getElementById('repoCat_' + item.index);
    if (sel && item.categoriaId) sel.value = item.categoriaId;
    if (item.fotoUrl || item.file) {
      var img = document.getElementById('repoImg_' + item.index);
      var empty = document.getElementById('repoEmpty_' + item.index);
      var filled = document.getElementById('repoFilled_' + item.index);
      if (item.fotoUrl && img) img.src = item.fotoUrl;
      if (empty) empty.style.display = 'none';
      if (filled) filled.style.display = '';
    }
    mostrarTamanhoItem(item.index);
    var tamInput = document.getElementById('repoTam_' + item.index);
    if (tamInput && item.tamanho) tamInput.value = item.tamanho;
  }
}

function atualizarFooterReposicao() {
  var nums = document.querySelectorAll('#reposicaoItemsList .repo-batch-num');
  for (var i = 0; i < nums.length; i++) {
    nums[i].textContent = '#' + (i + 1);
  }
}

export function renderReposicoes() {
  var container = document.getElementById('listaReposicoes');
  var empty = document.getElementById('emptyReposicoes');
  if (!container) return;
  container.innerHTML = '';

  if (data.reposicoes.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  var sorted = data.reposicoes.slice().sort(function(a,b) {
    return (b.dataRecebimento || '').localeCompare(a.dataRecebimento || '');
  });

  for (var i = 0; i < sorted.length; i++) {
    var r = sorted[i];

    var maletaNome = '';
    for (var j = 0; j < data.maletas.length; j++) {
      if (data.maletas[j].id === r.maletaId) { maletaNome = data.maletas[j].nome; break; }
    }

    var catNome = '';
    for (var k = 0; k < data.categorias.length; k++) {
      if (data.categorias[k].id === r.categoriaId) { catNome = data.categorias[k].nome; break; }
    }

    var card = document.createElement('div');
    card.className = 'repo-card';
    card.onclick = function() { window.verReposicao(this.dataset.id) };
    card.dataset.id = r.id;

    var fotoHtml = r.fotoUrl
      ? '<div class="repo-foto"><img src="' + r.fotoUrl + '" alt=""></div>'
      : '<div class="repo-icon" style="background:var(--rose-light);color:var(--rose)"><i class="fas fa-gem"></i></div>';

    card.innerHTML =
      '<div class="repo-card-left">' + fotoHtml + '</div>' +
      '<div class="repo-card-body">' +
      '<div class="repo-card-nome">' + maletaNome + '</div>' +
      '<div class="repo-card-meta">' +
      (catNome ? '<span><i class="fas fa-tag"></i> ' + catNome + '</span>' : '') +
      (r.tamanho ? '<span><i class="fas fa-ruler"></i> Tam. ' + r.tamanho + '</span>' : '') +
      '</div>' +
      '<div class="repo-card-datas">' +
      (r.dataRecebimento ? '<span><i class="fas fa-calendar-check"></i> ' + formatDate(r.dataRecebimento) + '</span>' : '') +
      '</div>' +
      '</div>' +
      '<div class="repo-card-right">' +
      '<button class="btn-icon danger" onclick="event.stopPropagation();window.excluirReposicao(\'' + r.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>';

    container.appendChild(card);
  }
}
window.renderReposicoes = renderReposicoes;

window.verReposicao = function(id) {
  for (var i = 0; i < data.reposicoes.length; i++) {
    if (data.reposicoes[i].id === id) {
      var r = data.reposicoes[i];
      var maletaNome = '';
      for (var j = 0; j < data.maletas.length; j++) {
        if (data.maletas[j].id === r.maletaId) { maletaNome = data.maletas[j].nome; break; }
      }
      var catNome = '';
      for (var k = 0; k < data.categorias.length; k++) {
        if (data.categorias[k].id === r.categoriaId) { catNome = data.categorias[k].nome; break; }
      }
      var body = document.getElementById('modalRepoConfirmBody');
      if (!body) return;
      var fotoHtml = r.fotoUrl
        ? '<div style="width:60px;height:60px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="' + r.fotoUrl + '" style="width:100%;height:100%;object-fit:cover"></div>'
        : '<div style="width:60px;height:60px;border-radius:50%;background:var(--rose-light);color:var(--rose);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0"><i class="fas fa-gem"></i></div>';
      body.innerHTML =
        '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">' +
        fotoHtml +
        '<div><strong style="font-size:16px">' + maletaNome + '</strong><br><span style="font-size:13px;color:var(--text-secondary)">' + formatDate(r.dataRecebimento) + '</span></div>' +
        '</div>' +
        '<div class="detail-row"><span class="detail-label">Categoria</span><span class="detail-value">' + catNome + '</span></div>' +
        (r.tamanho ? '<div class="detail-row"><span class="detail-label">Tamanho</span><span class="detail-value">' + r.tamanho + '</span></div>' : '') +
        '<div style="margin-top:20px">' +
        '<button class="btn-danger btn-full" onclick="closeModal(\'modalRepoConfirm\');window.excluirReposicao(\'' + r.id + '\')"><i class="fas fa-trash"></i> Excluir</button>' +
        '</div>';
      openModal('modalRepoConfirm');
      return;
    }
  }
};

window.mostrarConfirmacaoReposicao = function() {
  var maletaId = document.getElementById('reposicaoMaleta').value;
  if (!maletaId) { showToast('Selecione uma maleta.', 'error'); return; }
  if (_repoItems.length === 0) { showToast('Adicione ao menos um item.', 'error'); return; }

  for (var si = 0; si < _repoItems.length; si++) {
    var tamInput = document.getElementById('repoTam_' + _repoItems[si].index);
    if (tamInput) _repoItems[si].tamanho = tamInput.value.trim();
  }

  var valido = true;
  for (var i = 0; i < _repoItems.length; i++) {
    if (!_repoItems[i].file && !_repoItems[i].fotoUrl) { valido = false; break; }
    if (!_repoItems[i].categoriaId) { valido = false; break; }
  }
  if (!valido) { showToast('Preencha foto e categoria de todos os itens.', 'error'); return; }

  var maletaNome = '';
  for (var j = 0; j < data.maletas.length; j++) {
    if (data.maletas[j].id === maletaId) { maletaNome = data.maletas[j].nome; break; }
  }

  var dataStr = document.getElementById('reposicaoDataRecebimento').value;
  var body = document.getElementById('modalRepoConfirmBody');
  if (!body) return;

  var html =
    '<div style="margin-bottom:16px">' +
    '<div class="detail-row"><span class="detail-label">Maleta</span><span class="detail-value">' + maletaNome + '</span></div>' +
    '<div class="detail-row"><span class="detail-label">Data</span><span class="detail-value">' + formatDate(dataStr) + '</span></div>' +
    '</div>' +
    '<div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Itens (' + _repoItems.length + ')</div>';

  for (var k = 0; k < _repoItems.length; k++) {
    var item = _repoItems[k];
    var catNome = '';
    for (var ci = 0; ci < data.categorias.length; ci++) {
      if (data.categorias[ci].id === item.categoriaId) { catNome = data.categorias[ci].nome; break; }
    }
    var dotHtml = item.fotoUrl
      ? '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="' + item.fotoUrl + '" style="width:100%;height:100%;object-fit:cover"></div>'
      : '<div style="width:36px;height:36px;border-radius:50%;background:var(--border-light);color:var(--text-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0"><i class="fas fa-camera"></i></div>';
    html +=
      '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-light)">' +
      dotHtml +
      '<div style="flex:1;font-size:14px;font-weight:600">' + catNome + (item.tamanho ? ' <span style="color:var(--text-secondary);font-weight:400">· Tam. ' + item.tamanho + '</span>' : '') + '</div>' +
      '</div>';
  }

  body.innerHTML = html;
  closeModal('modalReposicao');
  openModal('modalRepoConfirm');
};

window.finalizarReposicao = async function() {
  var maletaId = document.getElementById('reposicaoMaleta').value;
  var dataRecebimento = document.getElementById('reposicaoDataRecebimento').value;

  closeModal('modalRepoConfirm');

  try {
    for (var i = 0; i < _repoItems.length; i++) {
      var item = _repoItems[i];
      var fotoUrl = item.fotoUrl;

      if (item.file) {
        fotoUrl = await uploadImage(item.file, 'repo_' + Date.now() + '_' + i);
      }

      var tamInput = document.getElementById('repoTam_' + item.index);
      var tamanho = tamInput ? tamInput.value.trim() : item.tamanho;

      var obj = {
        fotoUrl: fotoUrl,
        maletaId: maletaId,
        categoriaId: item.categoriaId,
        tamanho: tamanho,
        dataRecebimento: dataRecebimento
      };

      await upsertItem('reposicoes', obj);
    }

    var count = _repoItems.length;
    logMovimentacao('reposicao_realizada', count + ' item(ns) reposto(s) na maleta', { maletaId: maletaId, quantidade: count });
    resetReposicaoForm();
    renderReposicoes();
    showToast(count + ' item(ns) reposto(s) com sucesso!', 'success');
    showCelebration();
  } catch (e) {
    showToast('Erro ao salvar reposição.', 'error');
    console.error(e);
  }
};

export async function excluirReposicao(id) {
  var c = await showConfirm('Tem certeza que deseja excluir esta reposição?');
  if (!c) return;
  try {
    await removeItem('reposicoes', id);
    logMovimentacao('reposicao_excluida', 'Reposição excluída', { reposicaoId: id });
    closeModal('modalRepoConfirm');
    renderReposicoes();
  } catch (e) {
    showToast('Erro ao excluir reposição.', 'error');
    console.error(e);
  }
}
window.excluirReposicao = excluirReposicao;

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function initRepoFiltros() {}
