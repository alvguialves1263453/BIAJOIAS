import { supabase } from './lib/supabase.js'

export let data = {
  maletas: [],
  produtos: [],
  vendas: [],
  reservas: [],
  clientes: [],
  devolucoes: [],
  categorias: [],
  reposicoes: [],
  movimentacoes: []
}

export const STORAGE_KEY = 'bia_semijoias_data'

const TABLES = ['maletas', 'produtos', 'vendas', 'reservas', 'clientes', 'devolucoes', 'categorias', 'reposicoes', 'movimentacoes']

let supabaseDisponivel = !!supabase

const defaultData = {
  maletas: [
    { nome: 'Coleção Verão 2025', origem: 'Fornecedor A', dataRecebimento: '2025-01-10', dataLimite: '2025-04-10', status: 'Ativa', observacoes: '' },
    { nome: 'Linha Luxo', origem: 'Fornecedor B', dataRecebimento: '2025-02-01', dataLimite: '2025-05-01', status: 'Ativa', observacoes: '' },
    { nome: 'Promoção Inverno', origem: 'Fornecedor C', dataRecebimento: '2025-01-20', dataLimite: '2025-03-15', status: 'Finalizada', observacoes: '' }
  ],
  produtos: [
    { codigo: 'PRD-001', nome: 'Brinco Argola Dourado', maletaId: null, categoria: 'Brincos', precoVenda: 79.90, status: 'Disponível', fotoUrl: '' },
    { codigo: 'PRD-002', nome: 'Colar Coração Prata', maletaId: null, categoria: 'Colares', precoVenda: 99.90, status: 'Disponível', fotoUrl: '' },
    { codigo: 'PRD-003', nome: 'Pulseira Rosé', maletaId: null, categoria: 'Pulseiras', precoVenda: 69.90, status: 'Vendido', fotoUrl: '' },
    { codigo: 'PRD-004', nome: 'Anel Solitário', maletaId: null, categoria: 'Anéis', precoVenda: 49.90, status: 'Reservado', fotoUrl: '' },
    { codigo: 'PRD-005', nome: 'Brinco Argola Prata', maletaId: null, categoria: 'Brincos', precoVenda: 59.90, status: 'Disponível', fotoUrl: '' }
  ],
  vendas: [
    { produtoId: null, clienteId: null, telefone: '(11) 99999-0001', instagram: '@maria_cliente', valor: 69.90, desconto: 5.00, formaPagamento: 'Pix', parcelas: 1, entrada: 69.90, data: '2025-02-15', observacao: '', recebido: true },
    { produtoId: null, clienteId: null, telefone: '(11) 99999-0002', instagram: '@joao_cliente', valor: 49.90, desconto: 0, formaPagamento: 'Cartão de Crédito', parcelas: 2, entrada: 24.95, data: '2025-02-20', observacao: '', recebido: true }
  ],
  reservas: [
    { produtoId: null, clienteId: null, dataReserva: '2025-02-18', dataExpiracao: '2025-02-28', status: 'Ativa' }
  ],
  clientes: [
    { nome: 'Maria Silva', telefone: '(11) 99999-0001', instagram: '@maria_cliente', observacoes: 'Cliente frequente.' },
    { nome: 'João Santos', telefone: '(11) 99999-0002', instagram: '@joao_cliente', observacoes: '' },
    { nome: 'Ana Oliveira', telefone: '(11) 99999-0003', instagram: '@ana_cliente', observacoes: 'Prefere contato por Instagram.' }
  ],
  devolucoes: [],
  categorias: [
    { nome: 'Brincos' },
    { nome: 'Colares' },
    { nome: 'Pulseiras' },
    { nome: 'Anéis' },
    { nome: 'Conjuntos' }
  ]
}

const LEGACY_FIELDS = ['aniversario', 'createdat', 'updatedat']
function limparItem(item) {
  for (const f of LEGACY_FIELDS) delete item[f]
  return item
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

var _listeners = []

export function onDataChange(fn) {
  _listeners.push(fn)
}

function notify() {
  for (var i = 0; i < _listeners.length; i++) {
    try { _listeners[i]() } catch (e) { }
  }
}

function salvarLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) { }
}

function fallbackToLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      var parsed = JSON.parse(raw)
      Object.keys(parsed).forEach(function(k) { data[k] = parsed[k] })
      return data
    }
  } catch (e2) { }

  var defaults = clone(defaultData)
  Object.keys(defaults).forEach(function(k) { data[k] = defaults[k] })
  salvarLocalStorage()
  return data
}

export async function loadData() {
  if (!supabase) {
    supabaseDisponivel = false
    return fallbackToLocalStorage()
  }
  try {
    const timeout = new Promise(function(_, reject) {
      setTimeout(function() { reject(new Error('Timeout Supabase')) }, 5000)
    })
    const promises = TABLES.map(t => supabase.from(t).select('*'))
    const results = await Promise.race([Promise.all(promises), timeout])

    let hasError = false
    results.forEach((res, i) => {
      if (res.error) {
        console.error('Erro ao carregar ' + TABLES[i] + ':', res.error)
        hasError = true
        data[TABLES[i]] = []
      } else {
        data[TABLES[i]] = res.data || []
      }
    })

    if (hasError) throw new Error('Erro ao carregar dados do Supabase')

    const temDados = TABLES.some(t => data[t].length > 0)
    if (!temDados) {
      await seedDefaultData()
    } else {
      // Tentar mesclar dados do localStorage perdidos
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          for (const t of TABLES) {
            if (data[t].length === 0 && saved[t] && saved[t].length > 0) {
              data[t] = saved[t]
              for (const item of saved[t]) {
                const { error: upsErr } = await supabase.from(t).upsert(limparItem(item))
                if (upsErr) console.error('Erro upsert ' + t + ':', upsErr.message, upsErr.code, upsErr.details)
              }
            }
          }
        }
      } catch (e) { }
    }

    supabaseDisponivel = true
    salvarLocalStorage()
    return data
  } catch (e) {
    supabaseDisponivel = false
    console.warn('Supabase indisponível, usando localStorage...', e)
    return fallbackToLocalStorage()
  }
}

async function seedDefaultData() {
  // Preserve dados do usuário no localStorage em vez de semear defaults
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const temDados = TABLES.some(function(t) { return saved[t] && saved[t].length > 0 })
      if (temDados) {
        TABLES.forEach(function(t) { data[t] = saved[t] || [] })
        // Salvar dados do localStorage no Supabase
        for (const t of TABLES) {
          for (const item of data[t]) {
            const { error: upsErr } = await supabase.from(t).upsert(limparItem(item))
            if (upsErr) console.error('Erro upsert ' + t + ':', upsErr.message, upsErr.code, upsErr.details)
          }
        }
        return
      }
    }
  } catch (e) { }

  for (const t of TABLES) {
    for (const item of data[t]) {
      try {
        const { data: saved, error } = await supabase.from(t).insert(item).select().single()
        if (error) {
          console.error('Erro ao semear ' + t + ':', error)
        } else if (saved) {
          Object.assign(item, saved)
        }
      } catch (e) {
        console.error('Erro ao semear ' + t + ':', e)
      }
    }
  }
  salvarLocalStorage()
}

export async function saveData() {
  if (supabaseDisponivel) {
    for (const t of TABLES) {
      for (const item of data[t]) {
        try {
          const { error } = await supabase.from(t).upsert(item)
          if (error) console.error('Erro ao salvar ' + t + ':', error)
        } catch (e) {
          console.error('Erro ao salvar ' + t + ':', e)
        }
      }
    }
  }
  salvarLocalStorage()
}

export async function upsertItem(table, item) {
  if (supabaseDisponivel) {
    try {
      const { data: saved, error } = await supabase.from(table).upsert(item).select().single()
      if (error) {
        console.warn('Erro ao upsert no Supabase, usando localStorage:', error)
        await salvarLocalFallback(table, item)
      } else {
        const idx = data[table].findIndex(d => d.id === saved.id)
        if (idx >= 0) {
          data[table][idx] = saved
    } else {
      data[table].unshift(saved)
    }
    salvarLocalStorage()
    notify()
    return saved
      }
    } catch (e) {
      console.warn('Exceção no Supabase, usando localStorage:', e)
      await salvarLocalFallback(table, item)
    }
  } else {
    await salvarLocalFallback(table, item)
  }
}

async function salvarLocalFallback(table, item) {
  if (!item.id) {
    item.id = genId()
    data[table].unshift(item)
  } else {
    const idx = data[table].findIndex(d => d.id === item.id)
    if (idx >= 0) {
      data[table][idx] = item
    } else {
      data[table].unshift(item)
    }
  }
  salvarLocalStorage()
  notify()
  return item
}

export async function removeItem(table, id) {
  if (supabaseDisponivel) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) {
        console.warn('Erro ao remover no Supabase, usando localStorage:', error)
      }
    } catch (e) {
      console.warn('Exceção no Supabase, usando localStorage:', e)
    }
  }
  data[table] = data[table].filter(d => d.id !== id)
  salvarLocalStorage()
  notify()
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export async function logMovimentacao(tipo, descricao, dados) {
  if (!dados) dados = {}
  var obj = {
    tipo: tipo,
    descricao: descricao,
    dados: dados,
    criado_em: new Date().toISOString()
  }
  return await upsertItem('movimentacoes', obj)
}
