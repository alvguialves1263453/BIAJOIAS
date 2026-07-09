const TAB_MAP = {
  dashboard:'inicio', maletas:'maletas', vendas:'vendas',
  financeiro:'financeiro', clientes:'mais', reservas:'mais', mais:'mais',
  devolucoes:'mais', categorias:'mais', reposicoes:'mais', historico:'mais', configuracoes:'mais',
  'maleta-detail':'maletas', 'maleta-vendas':'maletas'
};

const SECTION_PARENT = {
  clientes:'mais', reservas:'mais', devolucoes:'mais', categorias:'mais', reposicoes:'mais', historico:'mais', configuracoes:'mais'
};

const SECTION_TITLES = {
  dashboard:'Início', maletas:'Maletas', vendas:'Vendas',
  financeiro:'Finanças', clientes:'Clientes', reservas:'Reservas', mais:'Mais',
  devolucoes:'Devoluções', categorias:'Categorias', reposicoes:'Reposições', historico:'Histórico', configuracoes:'Configurações',
  'maleta-detail':'Produtos', 'maleta-vendas':'Vender'
};

const SUB_SECTIONS = ['clientes','reservas','devolucoes','categorias','reposicoes','historico','configuracoes','maleta-detail','maleta-vendas'];

let _history = ['dashboard'];

export function navigate(section) {
  // Close mobile sidebar
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  var tabId = TAB_MAP[section];
  if (!tabId) return;

  // Activate parent tab
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active') });
  var tabEl = document.getElementById('tab-' + tabId);
  if (tabEl) tabEl.classList.add('active');

  // Activate section within tab
  document.querySelectorAll('.section-content').forEach(function(el) { el.classList.remove('active') });
  var sectionEl = document.getElementById('section-' + section);
  if (sectionEl) sectionEl.classList.add('active');

  // Update sidebar nav
  document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active') });
  var navItem = document.querySelector('.nav-item[data-section="' + section + '"]');
  if (navItem) navItem.classList.add('active');

  // Update tab bar
  document.querySelectorAll('.tab-item').forEach(function(el) { el.classList.remove('active') });
  var tabBtn = document.querySelector('.tab-item[data-tab="' + tabId + '"]');
  if (tabBtn) tabBtn.classList.add('active');

  // Update title
  var title = SECTION_TITLES[section] || section;
  var titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = title;

  // Show/hide back button
  var backBtn = document.getElementById('backBtn');
  if (backBtn) {
    if (SUB_SECTIONS.indexOf(section) > -1) {
      backBtn.style.display = 'flex';
      backBtn.dataset.backTo = SECTION_PARENT[section] || tabId;
    } else {
      backBtn.style.display = 'none';
    }
  }

  // Close search bar
  var searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.style.display = 'none';

  // Push history
  if (_history[_history.length - 1] !== section) {
    _history.push(section);
    if (_history.length > 10) _history.shift();
  }
}
window.navigate = navigate;

export function initNavigation() {
  // Theme toggles (header + sidebar)
  document.querySelectorAll('#themeToggle, #sidebarThemeToggle').forEach(function(el) {
    el.addEventListener('click', function() {
      import('./theme.js').then(function(m) { m.toggleTheme() });
    });
  });

  // Global search
  var globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', function(e) {
      var query = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.searchable').forEach(function(el) {
        el.style.display = el.textContent.toLowerCase().indexOf(query) > -1 ? '' : 'none';
      });
    });
  }
}

// Back button
window.historyBack = function() {
  if (_history.length > 1) {
    _history.pop();
    var prev = _history[_history.length - 1];
    navigate(prev);
  }
};

// Search toggle
window.toggleSearch = function() {
  var bar = document.getElementById('searchBar');
  if (!bar) return;
  var isVisible = bar.style.display !== 'none';
  bar.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible) {
    var input = document.getElementById('globalSearch');
    if (input) { input.value = ''; input.focus() }
  }
};
window.closeSearch = function() {
  var bar = document.getElementById('searchBar');
  if (bar) bar.style.display = 'none';
};

// Sidebar toggle (mobile)
window.toggleSidebar = function() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
};

// FAB toggle
window.toggleFab = function() {
  var fab = document.getElementById('fab');
  var menu = document.getElementById('fabMenu');
  if (!fab || !menu) return;
  var isOpen = fab.classList.contains('open');
  fab.classList.toggle('open');
  menu.classList.toggle('open');
};
