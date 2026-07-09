import { data, upsertItem, removeItem } from '../store.js';
import { openModal, closeModal, showToast, showConfirm, showCelebration } from '../modal.js';
import { popularSelectCategoria } from './produtos.js';

window.openModal = openModal;
window.closeModal = closeModal;

export function renderCategorias() {
  var container = document.getElementById('listaCategorias');
  var empty = document.getElementById('emptyCategorias');
  if (!container) return;
  container.innerHTML = '';

  if (data.categorias.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  for (var i = 0; i < data.categorias.length; i++) {
    var c = data.categorias[i];
    var card = document.createElement('div');
    card.className = 'categoria-card';
    card.innerHTML =
      '<span>' + c.nome + '</span>' +
      '<div class="categoria-actions">' +
      '<button class="btn-icon" onclick="window.editarCategoria(\'' + c.id + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
      '<button class="btn-icon danger" onclick="window.excluirCategoria(\'' + c.id + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
      '</div>';
    container.appendChild(card);
  }
}
window.renderCategorias = renderCategorias;

export async function salvarCategoria() {
  var editId = document.getElementById('categoriaEditId').value;
  var nome = document.getElementById('categoriaNome').value.trim();

  if (!nome) { showToast('O campo Nome \u00e9 obrigat\u00f3rio.', 'error'); return; }

  try {
    if (editId) {
      await upsertItem('categorias', { id: editId, nome: nome });
    } else {
      await upsertItem('categorias', { nome: nome });
    }
    closeModal('modalCategoria');
    document.getElementById('categoriaEditId').value = '';
    document.getElementById('categoriaNome').value = '';
    renderCategorias();
    if (window.popularSelectCategoria) popularSelectCategoria();
    if (!editId) showCelebration();
  } catch (e) {
    showToast('Erro ao salvar categoria.', 'error');
    console.error(e);
  }
}
window.salvarCategoria = salvarCategoria;

export function editarCategoria(id) {
  for (var i = 0; i < data.categorias.length; i++) {
    if (data.categorias[i].id === id) {
      document.getElementById('categoriaEditId').value = id;
      document.getElementById('categoriaNome').value = data.categorias[i].nome;
      document.getElementById('modalCategoriaTitle').textContent = 'Editar Categoria';
      openModal('modalCategoria');
      return;
    }
  }
}
window.editarCategoria = editarCategoria;

export async function excluirCategoria(id) {
  var c = await showConfirm('Tem certeza que deseja excluir esta categoria?');
  if (!c) return;
  try {
    await removeItem('categorias', id);
    renderCategorias();
    if (window.popularSelectCategoria) popularSelectCategoria();
  } catch (e) {
    showToast('Erro ao excluir categoria.', 'error');
    console.error(e);
  }
}
window.excluirCategoria = excluirCategoria;
