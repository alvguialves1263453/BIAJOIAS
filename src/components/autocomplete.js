export function createAutocomplete(config) {
  var input = document.getElementById(config.inputId)
  var hidden = document.getElementById(config.hiddenId)
  var container = input.parentElement
  container.classList.add('autocomplete')

  var dropdown = document.createElement('div')
  dropdown.className = 'autocomplete-dropdown'
  container.appendChild(dropdown)

  var items = config.items
  var activeIdx = -1

  function filterItems(query) {
    if (!query) return []
    var q = query.toLowerCase()
    var result = []
    var seen = {}
    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      if (seen[item.id]) continue
      for (var j = 0; j < config.searchFields.length; j++) {
        var val = item[config.searchFields[j]]
        if (val && String(val).toLowerCase().indexOf(q) > -1) {
          result.push(item)
          seen[item.id] = true
          break
        }
      }
      if (result.length >= 8) break
    }
    return result
  }

  function renderDropdown(results) {
    dropdown.innerHTML = ''
    activeIdx = -1
    if (results.length === 0) {
      dropdown.style.display = 'none'
      return
    }
    dropdown.style.display = 'block'
    for (var i = 0; i < results.length; i++) {
      (function(item) {
        var el = document.createElement('div')
        el.className = 'autocomplete-item'
        el.dataset.id = item.id
        var label = item[config.displayField] || ''
        var sub = item.telefone || item.instagram || ''
        el.innerHTML = '<span class="ac-label">' + highlight(label, input.value) + '</span>' +
          (sub ? '<span class="ac-sub">' + sub + '</span>' : '')
        el.addEventListener('click', function() { selectItem(item.id) })
        el.addEventListener('mouseenter', function() {
          var items2 = dropdown.querySelectorAll('.autocomplete-item')
          for (var k = 0; k < items2.length; k++) items2[k].classList.remove('active')
          el.classList.add('active')
          activeIdx = k
        })
        dropdown.appendChild(el)
      })(results[i])
    }
  }

  function highlight(text, query) {
    if (!query) return text
    var idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length)
  }

  function selectItem(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        input.value = items[i][config.displayField] || ''
        hidden.value = id
        dropdown.style.display = 'none'
        if (config.onSelect) config.onSelect(items[i])
        return
      }
    }
  }

  function clearValue() {
    input.value = ''
    hidden.value = ''
    dropdown.style.display = 'none'
    activeIdx = -1
    if (config.onClear) config.onClear()
  }

  input.addEventListener('input', function() {
    var query = this.value.trim()
    if (!query) {
      if (hidden.value) {
        hidden.value = ''
        if (config.onClear) config.onClear()
      }
      dropdown.style.display = 'none'
      return
    }
    var results = filterItems(query)
    renderDropdown(results)
  })

  input.addEventListener('focus', function() {
    var query = this.value.trim()
    if (query) {
      var results = filterItems(query)
      renderDropdown(results)
    }
  })

  document.addEventListener('click', function(e) {
    if (!container.contains(e.target)) {
      dropdown.style.display = 'none'
    }
  })

  input.addEventListener('keydown', function(e) {
    var items2 = dropdown.querySelectorAll('.autocomplete-item')
    if (e.key === 'Escape') {
      dropdown.style.display = 'none'
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (dropdown.style.display === 'none') return
      if (e.key === 'ArrowDown') {
        activeIdx = activeIdx < items2.length - 1 ? activeIdx + 1 : 0
      } else {
        activeIdx = activeIdx > 0 ? activeIdx - 1 : items2.length - 1
      }
      for (var i = 0; i < items2.length; i++) {
        items2[i].classList.toggle('active', i === activeIdx)
      }
      return
    }
    if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < items2.length) {
        selectItem(items2[activeIdx].dataset.id)
        e.preventDefault()
      }
    }
    if (e.key === 'Backspace' && !this.value) {
      clearValue()
    }
  })

  return {
    setValue: function(id) {
      if (!id) { clearValue(); return }
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          input.value = items[i][config.displayField] || ''
          hidden.value = id
          return
        }
      }
    },
    getValue: function() { return hidden.value },
    clear: clearValue,
    refresh: function(newItems) { items = newItems }
  }
}
