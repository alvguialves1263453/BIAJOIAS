import { supabase } from '../lib/supabase.js'

async function testConnection(prefix, statusId, iconId, testFn) {
  var statusEl = document.getElementById(statusId)
  var iconEl = document.getElementById(iconId)
  statusEl.textContent = 'Testando...'
  iconEl.className = 'fas fa-circle-notch fa-spin'
  iconEl.style.color = 'var(--text-light)'

  try {
    await testFn()
    statusEl.textContent = 'Conectado'
    iconEl.className = 'fas fa-check-circle'
    iconEl.style.color = '#22c55e'
  } catch (e) {
    statusEl.textContent = 'Falha: ' + (e.message || 'erro desconhecido')
    iconEl.className = 'fas fa-times-circle'
    iconEl.style.color = '#ef4444'
  }
}

export async function testSupabaseConnection() {
  await testConnection('supabase', 'supabaseStatus', 'supabaseIcon', async function() {
    var { error } = await supabase.from('maletas').select('id').limit(1)
    if (error) throw error
  })
}
window.testSupabaseConnection = testSupabaseConnection

export async function testImageKitConnection() {
  await testConnection('imagekit', 'imagekitStatus', 'imagekitIcon', async function() {
    var resp = await fetch('https://ik.imagekit.io/isa2koeb2/', { method: 'GET', mode: 'no-cors' })
    if (resp.type === 'error') throw new Error('Host inacess\u00edvel')
  })
}
window.testImageKitConnection = testImageKitConnection

export function initConfiguracoes() {
  testSupabaseConnection()
  testImageKitConnection()
}
