let _confirmCallback = null;

var _scrollY = 0;

export function openModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    if (!document.body.classList.contains('modal-open')) {
      _scrollY = window.scrollY;
      document.body.classList.add('modal-open');
      document.body.style.top = '-' + _scrollY + 'px';
    }
  }
}

export function closeModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    var abertos = document.querySelectorAll('.modal-overlay.open').length;
    if (abertos === 0 && document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, _scrollY);
    }
  }
}

export function showToast(message, type) {
  if (!type) type = 'info';
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  var icons = { success:'check-circle', error:'exclamation-circle', warning:'exclamation-triangle', info:'info-circle' };
  var iconName = icons[type] || 'info-circle';

  toast.innerHTML =
    '<span class="toast-icon"><i class="fas fa-' + iconName + '"></i></span>' +
    '<span class="toast-msg">' + message + '</span>' +
    '<div class="toast-progress"></div>';

  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  container.appendChild(toast);

  toast.addEventListener('click', function() { dismissToast(toast) });

  var timer = setTimeout(function() { dismissToast(toast) }, 3000);
  toast._dismissTimer = timer;
}

function dismissToast(toast) {
  if (toast._dismissing) return
  toast._dismissing = true
  clearTimeout(toast._dismissTimer)
  toast.style.opacity = '0'
  toast.style.transform = 'translateX(40px) scale(0.95)'
  toast.style.transition = '0.25s ease'
  setTimeout(function() { if (toast.parentNode) toast.remove() }, 250);
}

export function showConfirm(message) {
  var msgEl = document.getElementById('confirmMessage');
  if (msgEl) msgEl.textContent = message;
  openModal('modalConfirm');
  return new Promise(function(resolve) {
    _confirmCallback = resolve;
  });
}

export function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function(overlay) {
        closeModal(overlay.id);
      });
    }
  });
}

export function showCelebration() {
  var overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML =
    '<div class="celebration-circle">' +
    '<i class="fas fa-check"></i>' +
    '</div>' +
    '<div class="celebration-sparkles"></div>';
  document.body.appendChild(overlay);

  var sparkles = overlay.querySelector('.celebration-sparkles');
  var colors = ['#D4727D', '#34C759', '#FF9500', '#007AFF', '#5BA87A', '#E8B86D'];
  for (var i = 0; i < 20; i++) {
    var dot = document.createElement('div');
    dot.className = 'celebration-dot';
    dot.style.cssText =
      '--x:' + (Math.random() * 300 - 150) + 'px;' +
      '--y:' + (Math.random() * 300 - 150) + 'px;' +
      'background:' + colors[i % colors.length] + ';' +
      'animation-delay:' + (Math.random() * 0.3) + 's;' +
      'width:' + (4 + Math.random() * 6) + 'px;' +
      'height:' + (4 + Math.random() * 6) + 'px;';
    sparkles.appendChild(dot);
  }

  setTimeout(function () {
    overlay.style.opacity = '0';
    overlay.style.transition = '0.3s ease';
    setTimeout(function () { if (overlay.parentNode) overlay.remove() }, 300);
  }, 1000);
}

window.showToast = showToast;
window.showCelebration = showCelebration;
window.closeConfirm = function() {
  closeModal('modalConfirm');
  if (_confirmCallback) {
    _confirmCallback(false);
    _confirmCallback = null;
  }
};

window.executeConfirm = function() {
  closeModal('modalConfirm');
  if (_confirmCallback) {
    _confirmCallback(true);
    _confirmCallback = null;
  }
};
