import { data } from '../store.js'
import { formatCurrency } from '../helpers.js'

var overlay, input, resultsEl, closeTimer
var visible = false
var activeIdx = -1

var TYPES = [
  { key: 'produtos', icon: 'fa-gem', label: 'Produtos', fields: ['nome', 'codigo', 'categoria'], navigate: function(item) {
    window._currentMaletaId = item.maletaId
    window.navigate('maleta-detail')
  }},
  { key: 'maletas', icon: 'fa-suitcase', label: 'Maletas', fields: ['nome', 'origem', 'status'], navigate: function(item) {
    window.navigate('maletas')
  }},
  { key: 'clientes', icon: 'fa-users', label: 'Clientes', fields: ['nome', 'telefone', 'instagram'], navigate: function(item) {
    window.verCliente(item.id)
  }},
  { key: 'vendas', icon: 'fa-shopping-cart', label: 'Vendas', fields: [], navigate: function(item) {
    window.navigate('vendas')
  }},
  { key: 'reservas', icon: 'fa-calendar-alt', label: 'Reservas', fields: [], navigate: function(item) {
    window.navigate('reservas')
  }}
]

export function initGlobalSearch() {
  if (document.getElementById('globalSearchOverlay')) return

  overlay = document.createElement('div')
  overlay.id = 'globalSearchOverlay'
  overlay.className = 'gs-overlay'
  overlay.innerHTML =
    '<div class="gs-backdrop"></div>' +
    '<div class="gs-panel">' +
    '<div class="gs-input-wrap">' +
    '<i class="fas fa-search gs-input-icon"></i>' +
    '<input type="text" id="gsInput" class="gs-input" placeholder="Buscar produtos, maletas, clientes..." autocomplete="off">' +
    '<span class="gs-hint">ESC</span>' +
    '</div>' +
    '<div class="gs-results" id="gsResults"></div>' +
    '</div>'

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('gs-backdrop')) closeSearch()
  })

  document.body.appendChild(overlay)

  input = document.getElementById('gsInput')
  resultsEl = document.getElementById('gsResults')

  input.addEventListener('input', function() { search(this.value.trim()) })
  input.addEventListener('keydown', function(e) { handleKeydown(e) })

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      toggleSearch()
    }
    if (e.key === 'Escape' && visible) {
      closeSearch()
    }
  })

  window.__gsToggle = toggleSearch
  window.__gsClose = closeSearch
}

function toggleSearch() {
  if (visible) { closeSearch(); return }
  openSearch()
}

function openSearch() {
  visible = true
  overlay.classList.add('open')
  input.value = ''
  resultsEl.innerHTML = ''
  activeIdx = -1
  setTimeout(function() { input.focus() }, 100)
  document.body.classList.add('modal-open')
  var scrollY = window.scrollY
  document.body.style.top = '-' + scrollY + 'px'
}

function closeSearch() {
  if (!visible) return
  visible = false
  overlay.classList.remove('open')
  document.body.classList.remove('modal-open')
  document.body.style.top = ''
  resultsEl.innerHTML = ''
  activeIdx = -1
}

function search(query) {
  if (!query || query.length < 1) {
    resultsEl.innerHTML = ''
    return
  }
  var q = query.toLowerCase()
  var allResults = []

  for (var t = 0; t < TYPES.length; t++) {
    var type = TYPES[t]
    var items = data[type.key] || []
    var matches = []

    if (type.key === 'vendas' || type.key === 'reservas') {
      for (var i = 0; i < items.length; i++) {
        var item = items[i]
        var match = false
        if (type.key === 'vendas') {
          if (item.formaPagamento && item.formaPagamento.toLowerCase().indexOf(q) > -1) match = true
        }
        if (!match) {
          var prodName = resolveName('produtos', item.produtoId)
          if (prodName && prodName.toLowerCase().indexOf(q) > -1) match = true
        }
        if (!match) {
          var cliName = resolveName('clientes', item.clienteId)
          if (cliName && cliName.toLowerCase().indexOf(q) > -1) match = true
        }
        if (match) matches.push(item)
      }
    } else {
      for (var j = 0; j < items.length; j++) {
        var item2 = items[j]
        for (var f = 0; f < type.fields.length; f++) {
          var val = item2[type.fields[f]]
          if (val && String(val).toLowerCase().indexOf(q) > -1) {
            matches.push(item2)
            break
          }
        }
      }
    }

    matches = matches.slice(0, 5)
    if (matches.length > 0) {
      allResults.push({ type: type, items: matches })
    }
  }

  renderResults(allResults, q)
}

function resolveName(table, id) {
  if (!id) return ''
  var items = data[table] || []
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i].nome || items[i].name || ''
  }
  return ''
}

function renderResults(groups, query) {
  resultsEl.innerHTML = ''
  activeIdx = -1
  var totalItems = 0

  if (groups.length === 0) {
    resultsEl.innerHTML = '<div class="gs-empty">Nenhum resultado encontrado</div>'
    return
  }

  for (var g = 0; g < groups.length; g++) {
    var group = groups[g]
    var type = group.type
    var groupDiv = document.createElement('div')
    groupDiv.className = 'gs-group'

    var header = document.createElement('div')
    header.className = 'gs-group-header'
    header.innerHTML = '<i class="fas ' + type.icon + '"></i> ' + type.label
    groupDiv.appendChild(header)

    for (var i = 0; i < group.items.length; i++) {
      (function(item, t) {
        var el = document.createElement('div')
        el.className = 'gs-item'
        el.dataset.index = totalItems

        var primary = item.nome || item.name || ''
        var secondary = ''
        var detail = ''

        if (t === 'produtos') {
          secondary = item.codigo || ''
          detail = item.precoVenda ? formatCurrency(item.precoVenda) : ''
        } else if (t === 'maletas') {
          secondary = item.status || ''
          detail = item.origem || ''
        } else if (t === 'clientes') {
          secondary = item.telefone || item.instagram || ''
        } else if (t === 'vendas') {
          secondary = resolveName('produtos', item.produtoId)
          detail = item.valor ? formatCurrency(item.valor - (item.desconto || 0)) : ''
        } else if (t === 'reservas') {
          secondary = resolveName('produtos', item.produtoId)
          detail = item.status || ''
        }

        el.innerHTML =
          '<span class="gs-item-primary">' + highlight(primary, query) + '</span>' +
          (secondary ? '<span class="gs-item-secondary">' + highlight(secondary, query) + '</span>' : '') +
          (detail ? '<span class="gs-item-detail">' + detail + '</span>' : '')

        el.addEventListener('click', function() {
          closeSearch()
          setTimeout(function() { t(item) }, 200)
        })

        groupDiv.appendChild(el)
        totalItems++
      })(group.items[i], type.navigate)
    }

    resultsEl.appendChild(groupDiv)
  }
}

function highlight(text, query) {
  if (!text || !query) return text || ''
  var idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length)
}

function handleKeydown(e) {
  var items = resultsEl.querySelectorAll('.gs-item')
  if (!items.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0
    updateActive(items)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1
    updateActive(items)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (activeIdx >= 0 && items[activeIdx]) {
      items[activeIdx].click()
    }
  }
}

function updateActive(items) {
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle('gs-item-active', i === activeIdx)
  }
  if (activeIdx >= 0 && items[activeIdx]) {
    items[activeIdx].scrollIntoView({ block: 'nearest' })
  }
}

export function toggleGlobalSearch() { toggleSearch() }
export function closeGlobalSearch() { closeSearch() }

window.toggleGlobalSearch = toggleGlobalSearch
window.closeGlobalSearch = closeGlobalSearch
