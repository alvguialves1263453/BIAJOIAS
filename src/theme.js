export function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = html.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}

export function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = '☀️';
  }
}
