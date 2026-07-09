import { initGlobalSearch } from './components/globalSearch.js'
import { loadData, onDataChange } from './store.js'
import { loadTheme } from './theme.js'
import { initNavigation } from './router.js'
import { initModals } from './modal.js'

import './modules/dashboard.js'
import './modules/maletas.js'
import './modules/produtos.js'
import './modules/vendas.js'
import './modules/reservas.js'
import './modules/devolucoes.js'
import './modules/financeiro.js'
import './modules/clientes.js'
import './modules/categorias.js'
import './modules/mvendas.js'
import './modules/reposicoes.js'
import './modules/configuracoes.js'

import { renderDashboard } from './modules/dashboard.js'
import { renderMaletas } from './modules/maletas.js'
import { popularSelectProduto, popularSelectCategoria } from './modules/produtos.js'
import { renderVendas, popularSelectCliente, vendaAutocomplete } from './modules/vendas.js'
import { renderReservas, initReservaAutocomplete } from './modules/reservas.js'
import { popularSelectMaletaDevolucao } from './modules/devolucoes.js'
import { renderFinanceiro } from './modules/financeiro.js'
import { renderClientes } from './modules/clientes.js'
import { renderCategorias } from './modules/categorias.js'
import { renderReposicoes } from './modules/reposicoes.js'
import { initConfiguracoes } from './modules/configuracoes.js'
import { renderHistorico } from './modules/historico.js'

function renderAll() {
  popularSelectProduto('reservaProduto', true)
  popularSelectCliente('vendaCliente')
  initReservaAutocomplete()
  popularSelectMaletaDevolucao()
  popularSelectCategoria()

  renderDashboard()
  renderMaletas()
  renderCategorias()
  renderVendas()
  renderReservas()
  renderFinanceiro()
  renderClientes()
  renderReposicoes()
  renderHistorico()
  initConfiguracoes()
}

window.renderAll = renderAll

var today = new Date();
var y = today.getFullYear();
var m = String(today.getMonth() + 1).padStart(2, '0');
var d = String(today.getDate()).padStart(2, '0');
var dateStr = y + '-' + m + '-' + d;
['vendaData','reservaDataReserva','reservaDataExpiracao'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el && !el.value) el.value = dateStr;
});

async function init() {
  loadTheme()
  initModals()
  initNavigation()
  initGlobalSearch()
  await loadData()
  renderAll()
  onDataChange(renderDashboard)

  var hour = today.getHours();
  var greetingEl = document.getElementById('greetingText');
  if (greetingEl) {
    if (hour < 12) greetingEl.textContent = 'Bom dia! ☀️';
    else if (hour < 18) greetingEl.textContent = 'Boa tarde! 🌤️';
    else greetingEl.textContent = 'Boa noite! 🌙';
  }
}

init()
