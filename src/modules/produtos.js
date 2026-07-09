import { data, upsertItem, removeItem, genId, logMovimentacao } from '../store.js';
import { formatCurrency, statusBadge } from '../helpers.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { uploadImage } from '../services/imageKitService.js';

window.openModal = openModal;
window.closeModal = closeModal;

window._currentMaletaId = null;

var _salvando = false;
var _produtoFotos = [];
var _carouselIndex = 0;
var _carouselFotos = [];
var _carouselStartX = 0;
var _carouselTouchInit = false;

export function popularSelectCategoria() {
  var sel = document.getElementById('produtoCategoria');
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
window.popularSelectCategoria = popularSelectCategoria;

window.mostrarTamanhoPorCategoria = function() {
  var sel = document.getElementById('produtoCategoria');
  var group = document.getElementById('produtoTamanhoGroup');
  if (!sel || !group) return;
  var catId = sel.value;
  var isAnel = false;
  for (var i = 0; i < data.categorias.length; i++) {
    if (data.categorias[i].id === catId) {
      var nome = data.categorias[i].nome.toLowerCase();
      if (nome.indexOf('anel') !== -1 || nome.indexOf('ané') !== -1) {
        isAnel = true;
      }
      break;
    }
  }
  group.style.display = isAnel ? '' : 'none';
  if (!isAnel) {
    document.getElementById('produtoTamanho').value = '';
  }
};

export function renderProdutosDaMaleta() {
  var maletaId = window._currentMaletaId;
  if (!maletaId) return;
  var search = (document.getElementById('searchProdutoMaleta').value || '').toLowerCase();
  var grid = document.getElementById('gridProdutosMaleta');
  var empty = document.getElementById('emptyProdutosMaleta');
  grid.innerHTML = '';

  var catMap = {};
  for (var ci = 0; ci < data.categorias.length; ci++) {
    catMap[data.categorias[ci].id] = data.categorias[ci].nome;
  }

  var filtered = [];
  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i];
    if (p.maletaId !== maletaId) continue;
    var catNome = catMap[p.categoria] || '';
    if (search && catNome.toLowerCase().indexOf(search) === -1 && p.codigo.toLowerCase().indexOf(search) === -1) continue;
    filtered.push(p);
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  for (var j = 0; j < filtered.length; j++) {
    var p2 = filtered[j];
    var catTexto = catMap[p2.categoria] || 'Sem categoria';
    var fotoSrc = (p2.fotos && p2.fotos[0]) || p2.fotoUrl || '';
    var card = document.createElement('div');
    card.className = 'prod-card';
    card.innerHTML =
      '<div class="prod-card-img" onclick="window.verProduto(\'' + p2.id + '\')">' +
      (fotoSrc ? '<img src="' + fotoSrc + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '<i class="fas fa-gem"></i>') +
      '</div>' +
      '<div class="prod-card-body">' +
      '<div class="prod-card-categoria">' + catTexto + (p2.tamanho ? ' · Tam. ' + p2.tamanho : '') + '</div>' +
      '<div class="prod-card-price">' + formatCurrency(p2.precoVenda) + '</div>' +
      '<div style="margin:4px 0;">' + statusBadge(p2.status) + '</div>' +
      '<div class="prod-card-actions">' +
      '<button class="btn-icon" onclick="window.editarProduto(\'' + p2.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
      '<button class="btn-icon" onclick="window.duplicarProduto(\'' + p2.id + '\')" title="Duplicar"><i class="fas fa-copy"></i></button>' +
      '<button class="btn-icon danger" onclick="window.excluirProduto(\'' + p2.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
    grid.appendChild(card);
  }
}
window.renderProdutosDaMaleta = renderProdutosDaMaleta;

export function abrirNovoProdutoNaMaleta() {
  if (!window._currentMaletaId) {
    showToast('Selecione uma maleta primeiro.', 'error');
    return;
  }
  resetProdutoForm();
  popularSelectCategoria();
  document.getElementById('modalProdutoTitle').textContent = 'Novo Produto';
  openModal('modalProduto');
}
window.abrirNovoProdutoNaMaleta = abrirNovoProdutoNaMaleta;

export function addProdutoFotos(input) {
  if (!input || !input.files) return;
  for (var i = 0; i < input.files.length; i++) {
    _produtoFotos.push({ file: input.files[i], url: URL.createObjectURL(input.files[i]) });
  }
  renderProdutoThumbs();
  input.value = '';
}
window.addProdutoFotos = addProdutoFotos;

export function removeProdutoFoto(index) {
  _produtoFotos.splice(index, 1);
  renderProdutoThumbs();
}
window.removeProdutoFoto = removeProdutoFoto;

function renderProdutoThumbs() {
  var container = document.getElementById('prodUploadThumbs');
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < _produtoFotos.length; i++) {
    var thumb = document.createElement('div');
    thumb.className = 'prod-upload-thumb';
    thumb.innerHTML =
      '<img src="' + _produtoFotos[i].url + '">' +
      '<button type="button" class="prod-upload-remove" onclick="event.stopPropagation();removeProdutoFoto(' + i + ')"><i class="fas fa-times"></i></button>';
    container.appendChild(thumb);
  }
}

export async function salvarProduto() {
  if (_salvando) return;
  var editId = document.getElementById('produtoEditId').value;
  var precoVenda = parseFloat(document.getElementById('produtoPrecoVenda').value);

  if (!precoVenda || isNaN(precoVenda)) { showToast('O campo Pre\u00e7o Venda \u00e9 obrigat\u00f3rio.', 'error'); return; }

  _salvando = true;
  var btn = document.getElementById('salvarProdutoBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    var codigo = 'PRD-' + genId().toUpperCase().slice(0, 6);
    var categoria = document.getElementById('produtoCategoria').value;

    var nome = '';
    if (categoria) {
      for (var ci = 0; ci < data.categorias.length; ci++) {
        if (data.categorias[ci].id === categoria) {
          nome = data.categorias[ci].nome;
          break;
        }
      }
    }

    if (editId) {
      for (var i = 0; i < data.produtos.length; i++) {
        if (data.produtos[i].id === editId) {
          codigo = data.produtos[i].codigo;
          nome = data.produtos[i].nome || nome;
          break;
        }
      }
    }

    for (var fi = 0; fi < _produtoFotos.length; fi++) {
      if (_produtoFotos[fi].file) {
        var uploadedUrl = await uploadImage(_produtoFotos[fi].file, codigo + '-foto' + fi);
        _produtoFotos[fi].url = uploadedUrl;
        delete _produtoFotos[fi].file;
      }
    }

    var fotos = [];
    for (var fi2 = 0; fi2 < _produtoFotos.length; fi2++) {
      fotos.push(_produtoFotos[fi2].url);
    }

    var obj = {
      codigo: codigo,
      nome: nome,
      maletaId: window._currentMaletaId,
      categoria: categoria,
      tamanho: document.getElementById('produtoTamanho').value.trim(),
      precoVenda: precoVenda,
      fotos: fotos,
      fotoUrl: fotos[0] || '',
      status: 'Dispon\u00edvel'
    };

    if (editId) {
      obj.id = editId;
      for (var j = 0; j < data.produtos.length; j++) {
        if (data.produtos[j].id === editId) {
          obj.status = data.produtos[j].status;
          break;
        }
      }
    }

    await upsertItem('produtos', obj);
    if (!editId) {
      logMovimentacao('produto_adicionado', 'Produto ' + obj.nome + ' (' + obj.codigo + ') adicionado à maleta', { produtoId: obj.id, maletaId: obj.maletaId });
    }
    closeModal('modalProduto');
    resetProdutoForm();
    renderProdutosDaMaleta();
    if (!editId) showCelebration();
  } catch (e) {
    showToast('Erro ao salvar produto.', 'error');
    console.error(e);
  } finally {
    _salvando = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
  }
}
window.salvarProduto = salvarProduto;

export function editarProduto(id) {
  for (var i = 0; i < data.produtos.length; i++) {
    if (data.produtos[i].id === id) {
      var p = data.produtos[i];
      document.getElementById('produtoEditId').value = p.id;
      popularSelectCategoria();
      document.getElementById('produtoCategoria').value = p.categoria || '';
      document.getElementById('produtoTamanho').value = p.tamanho || '';
      window.mostrarTamanhoPorCategoria();
      document.getElementById('produtoPrecoVenda').value = p.precoVenda || '';

      _produtoFotos = [];
      var existing = p.fotos || (p.fotoUrl ? [p.fotoUrl] : []);
      for (var fi = 0; fi < existing.length; fi++) {
        _produtoFotos.push({ url: existing[fi] });
      }
      renderProdutoThumbs();

      document.getElementById('modalProdutoTitle').textContent = 'Editar Produto';
      openModal('modalProduto');
      return;
    }
  }
}
window.editarProduto = editarProduto;

export async function excluirProduto(id) {
  var c = await showConfirm('Tem certeza que deseja excluir este produto?');
  if (!c) return;
  try {
    await removeItem('produtos', id);
    renderProdutosDaMaleta();
  } catch (e) {
    showToast('Erro ao excluir produto.', 'error');
    console.error(e);
  }
}
window.excluirProduto = excluirProduto;

export function duplicarProduto(id) {
  for (var i = 0; i < data.produtos.length; i++) {
    if (data.produtos[i].id === id) {
      var p = data.produtos[i];
      document.getElementById('produtoEditId').value = '';
      popularSelectCategoria();
      document.getElementById('produtoCategoria').value = p.categoria || '';
      document.getElementById('produtoTamanho').value = p.tamanho || '';
      window.mostrarTamanhoPorCategoria();
      document.getElementById('produtoPrecoVenda').value = p.precoVenda || '';

      _produtoFotos = [];
      var existing = p.fotos || (p.fotoUrl ? [p.fotoUrl] : []);
      for (var fi = 0; fi < existing.length; fi++) {
        _produtoFotos.push({ url: existing[fi] });
      }
      renderProdutoThumbs();

      document.getElementById('modalProdutoTitle').textContent = 'Novo Produto (duplicado)';
      openModal('modalProduto');
      return;
    }
  }
}
window.duplicarProduto = duplicarProduto;

// --- Carousel ---

export function verProduto(id) {
  for (var i = 0; i < data.produtos.length; i++) {
    if (data.produtos[i].id === id) {
      var p = data.produtos[i];
      var fotos = p.fotos || (p.fotoUrl ? [p.fotoUrl] : []);

      var catNome = '';
      for (var k = 0; k < data.categorias.length; k++) {
        if (data.categorias[k].id === p.categoria) { catNome = data.categorias[k].nome; break; }
      }
      var maletaNome = '';
      for (var j = 0; j < data.maletas.length; j++) {
        if (data.maletas[j].id === p.maletaId) { maletaNome = data.maletas[j].nome; break; }
      }

      var infoHtml =
        '<strong>' + (catNome || p.nome || 'Sem categoria') + (p.tamanho ? ' · Tam. ' + p.tamanho : '') + '</strong>' +
        '<span>' + formatCurrency(p.precoVenda) + '</span>' +
        '<small>' + p.codigo + ' \u00b7 ' + (maletaNome || '-') + '</small>';

      openCarousel(fotos, infoHtml);
      return;
    }
  }
}
window.verProduto = verProduto;

function openCarousel(fotos, infoHtml) {
  _carouselFotos = fotos.length ? fotos : [''];
  _carouselIndex = 0;

  var slides = document.getElementById('carouselSlides');
  slides.innerHTML = '';
  for (var i = 0; i < _carouselFotos.length; i++) {
    var slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    if (_carouselFotos[i]) {
      var wrap = document.createElement('div')
      wrap.className = 'carousel-img-wrap'
      var spinner = document.createElement('div')
      spinner.className = 'carousel-spinner'
      spinner.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'
      wrap.appendChild(spinner)
      var img = new Image()
      img.className = 'carousel-img'
      img.loading = 'lazy'
      img.onload = function() { this.previousSibling.style.display = 'none' }
      img.onerror = function() {
        this.parentNode.innerHTML = '<i class="fas fa-gem" style="font-size:64px;color:#999"></i>'
      }
      img.src = _carouselFotos[i]
      wrap.appendChild(img)
      slide.appendChild(wrap)
    } else {
      slide.innerHTML = '<div class="carousel-placeholder"><i class="fas fa-gem"></i></div>'
    }
    slides.appendChild(slide);
  }

  document.getElementById('carouselDots').innerHTML = '';
  for (var di = 0; di < _carouselFotos.length; di++) {
    var dot = document.createElement('span');
    dot.className = 'carousel-dot' + (di === 0 ? ' active' : '');
    dot.onclick = function(idx) { return function() { goToCarousel(idx); }; }(di);
    document.getElementById('carouselDots').appendChild(dot);
  }

  document.getElementById('carouselInfo').innerHTML = infoHtml || '';
  updateCarouselButtons();

  initCarouselTouch();

  document.getElementById('carouselOverlay').classList.add('open');
  document.body.classList.add('modal-open');
}

window.closeCarousel = function() {
  document.getElementById('carouselOverlay').classList.remove('open');
  document.body.classList.remove('modal-open');
  _carouselFotos = [];
};

function goToCarousel(index) {
  if (index < 0) index = _carouselFotos.length - 1;
  if (index >= _carouselFotos.length) index = 0;
  var slides = document.getElementById('carouselSlides').children;
  if (slides[_carouselIndex]) slides[_carouselIndex].classList.remove('active');
  _carouselIndex = index;
  if (slides[_carouselIndex]) slides[_carouselIndex].classList.add('active');
  var dots = document.getElementById('carouselDots').children;
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === _carouselIndex);
  }
  updateCarouselButtons();
}

window.carouselNav = function(dir) {
  goToCarousel(_carouselIndex + dir);
};

function updateCarouselButtons() {
  var prev = document.getElementById('carouselPrev');
  var next = document.getElementById('carouselNext');
  if (!prev || !next) return;
  prev.style.display = _carouselFotos.length <= 1 ? 'none' : '';
  next.style.display = _carouselFotos.length <= 1 ? 'none' : '';
}

function initCarouselTouch() {
  if (_carouselTouchInit) return;
  _carouselTouchInit = true;
  var el = document.getElementById('carouselSlides');
  if (!el) return;
  el.addEventListener('touchstart', function(e) {
    _carouselStartX = e.touches[0].clientX;
  }, { passive: true });
  el.addEventListener('touchend', function(e) {
    var diff = e.changedTouches[0].clientX - _carouselStartX;
    if (Math.abs(diff) > 50) {
      goToCarousel(_carouselIndex + (diff > 0 ? -1 : 1));
    }
  }, { passive: true });
}

// --- Form helpers ---

export function resetProdutoForm() {
  document.getElementById('produtoEditId').value = '';
  document.getElementById('produtoCategoria').value = '';
  document.getElementById('produtoTamanho').value = '';
  document.getElementById('produtoTamanhoGroup').style.display = 'none';
  document.getElementById('produtoPrecoVenda').value = '';
  document.getElementById('produtoFotoCamera').value = '';
  document.getElementById('produtoFotoGaleria').value = '';
  _produtoFotos = [];
  renderProdutoThumbs();
  document.getElementById('modalProdutoTitle').textContent = 'Novo Produto';
}
window.resetProdutoForm = resetProdutoForm;

export function abrirNovaCategoria() {
  document.getElementById('categoriaEditId').value = '';
  document.getElementById('categoriaNome').value = '';
  document.getElementById('modalCategoriaTitle').textContent = 'Nova Categoria';
  openModal('modalCategoria');
}
window.abrirNovaCategoria = abrirNovaCategoria;

export function popularSelectProduto(selectId, onlyDisponiveis) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var catMap = {};
  for (var ci = 0; ci < data.categorias.length; ci++) {
    catMap[data.categorias[ci].id] = data.categorias[ci].nome;
  }
  sel.innerHTML = '<option value="">Selecione um produto</option>';
  for (var i = 0; i < data.produtos.length; i++) {
    var p = data.produtos[i];
    if (onlyDisponiveis && p.status !== 'Dispon\u00edvel') continue;
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.codigo + ' - ' + (p.nome || catMap[p.categoria] || 'Sem categoria') + ' (' + p.status + ')';
    sel.appendChild(opt);
  }
}
window.popularSelectProduto = popularSelectProduto;
