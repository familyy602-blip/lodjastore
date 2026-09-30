/**
 * Carrinho na base de dados Supabase (tabela lv_carrinho).
 * O device_id só identifica o browser; os itens ficam na cloud.
 */
const Cart = {
  KEY_DEVICE: 'lv_device_id',
  _cache: [],
  _ready: null,

  deviceId() {
    let id = localStorage.getItem(this.KEY_DEVICE);
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(this.KEY_DEVICE, id);
    }
    return id;
  },

  async ensureDb() {
    if (typeof LojaDB !== 'undefined') {
      try {
        if (!window.supabaseClient && typeof initSupabase === 'function') initSupabase();
        await LojaDB.init();
      } catch (e) {}
    }
  },

  async _remote() {
    await this.ensureDb();
    if (typeof LojaDB !== 'undefined' && !LojaDB._local && window.supabaseClient) {
      return window.supabaseClient;
    }
    return null;
  },

  async load() {
    const db = await this._remote();
    const device = this.deviceId();
    if (db) {
      try {
        const { data, error } = await db
          .from('lv_carrinho')
          .select('*')
          .eq('device_id', device)
          .order('data_atualizacao', { ascending: false });
        if (error) throw error;
        this._cache = (data || []).map(r => ({
          id: r.id,
          produtoId: r.produto_id,
          nome: r.nome,
          imagem: r.imagem || '',
          tamanho: r.tamanho || '',
          cor: r.cor || '',
          preco: Number(r.preco) || 0,
          quantidade: Number(r.quantidade) || 1,
          variacaoId: r.variacao_id || null
        }));
        // migrar carrinho antigo local (uma vez)
        await this._migrateLocalIfAny(db, device);
        this.updateBadge();
        return this._cache;
      } catch (e) {
        console.warn('Carrinho remoto', e);
      }
    }
    // fallback temporário só se Supabase/tabela indisponível
    try {
      this._cache = JSON.parse(localStorage.getItem('lv_carrinho') || '[]');
    } catch (e) {
      this._cache = [];
    }
    this.updateBadge();
    return this._cache;
  },

  async _migrateLocalIfAny(db, device) {
    if (localStorage.getItem('lv_cart_migrated') === '1') return;
    let local = [];
    try { local = JSON.parse(localStorage.getItem('lv_carrinho') || '[]'); } catch (e) {}
    if (!local.length) {
      localStorage.setItem('lv_cart_migrated', '1');
      return;
    }
    for (const it of local) {
      if (!it.produtoId) continue;
      const row = {
        id: 'cart_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
        device_id: device,
        produto_id: String(it.produtoId),
        nome: it.nome || 'Produto',
        imagem: (it.imagem && String(it.imagem).indexOf('data:') !== 0) ? String(it.imagem).slice(0, 400) : '',
        tamanho: it.tamanho || '',
        cor: it.cor || '',
        preco: Number(it.preco) || 0,
        quantidade: Math.max(1, Number(it.quantidade) || 1),
        variacao_id: it.variacaoId || null,
        data_atualizacao: new Date().toISOString()
      };
      try { await db.from('lv_carrinho').upsert(row); } catch (e) {}
    }
    localStorage.removeItem('lv_carrinho');
    localStorage.setItem('lv_cart_migrated', '1');
    const { data } = await db.from('lv_carrinho').select('*').eq('device_id', device);
    this._cache = (data || []).map(r => ({
      id: r.id,
      produtoId: r.produto_id,
      nome: r.nome,
      imagem: r.imagem || '',
      tamanho: r.tamanho || '',
      cor: r.cor || '',
      preco: Number(r.preco) || 0,
      quantidade: Number(r.quantidade) || 1,
      variacaoId: r.variacao_id || null
    }));
  },

  /** Síncrono: devolve cache (chamar load() antes nas páginas) */
  get() {
    return this._cache.slice();
  },

  async add(item) {
    if (!item || item.produtoId == null || item.produtoId === '') {
      alert('Produto inválido para o carrinho.');
      return this.get();
    }
    await this.load();
    const device = this.deviceId();
    const db = await this._remote();
    const keyMatch = (i) =>
      String(i.produtoId) === String(item.produtoId) &&
      (i.tamanho || '') === (item.tamanho || '') &&
      (i.cor || '') === (item.cor || '');

    const existing = this._cache.find(keyMatch);
    const qtyAdd = Math.max(1, Number(item.quantidade) || 1);
    let img = '';
    if (item.imagem && String(item.imagem).indexOf('data:') !== 0 && String(item.imagem).length < 400) {
      img = String(item.imagem);
    }

    if (db) {
      try {
        if (existing && existing.id) {
          const novaQty = (Number(existing.quantidade) || 0) + qtyAdd;
          const { error } = await db.from('lv_carrinho').update({
            quantidade: novaQty,
            preco: Number(item.preco) || existing.preco || 0,
            nome: item.nome || existing.nome,
            data_atualizacao: new Date().toISOString()
          }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const row = {
            id: 'cart_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
            device_id: device,
            produto_id: String(item.produtoId),
            nome: item.nome || 'Produto',
            imagem: img,
            tamanho: item.tamanho || '',
            cor: item.cor || '',
            preco: Number(item.preco) || 0,
            quantidade: qtyAdd,
            variacao_id: item.variacaoId || null,
            data_atualizacao: new Date().toISOString()
          };
          const { error } = await db.from('lv_carrinho').insert(row);
          if (error) throw error;
        }
        await this.load();
        return this.get();
      } catch (e) {
        console.error('Cart.add remoto', e);
        alert('Não foi possível gravar no carrinho (base de dados). Execute o SQL da tabela lv_carrinho no Supabase.\n' + (e.message || e));
        return this.get();
      }
    }

    // Fallback local se tabela ainda não existir
    if (existing) existing.quantidade = (Number(existing.quantidade) || 0) + qtyAdd;
    else this._cache.push({
      id: 'local_' + Date.now(),
      produtoId: item.produtoId,
      nome: item.nome || 'Produto',
      imagem: img,
      tamanho: item.tamanho || '',
      cor: item.cor || '',
      preco: Number(item.preco) || 0,
      quantidade: qtyAdd,
      variacaoId: item.variacaoId || null
    });
    try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
    this.updateBadge();
    return this.get();
  },

  async updateQty(index, qty) {
    await this.load();
    const it = this._cache[index];
    if (!it) return this.get();
    const db = await this._remote();
    if (qty <= 0) return this.remove(index);

    if (db && it.id && String(it.id).indexOf('local_') !== 0) {
      try {
        await db.from('lv_carrinho').update({
          quantidade: qty,
          data_atualizacao: new Date().toISOString()
        }).eq('id', it.id);
        await this.load();
        return this.get();
      } catch (e) {
        console.warn(e);
      }
    }
    it.quantidade = qty;
    try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
    this.updateBadge();
    return this.get();
  },

  async remove(index) {
    await this.load();
    const it = this._cache[index];
    if (!it) return this.get();
    const db = await this._remote();
    if (db && it.id && String(it.id).indexOf('local_') !== 0) {
      try {
        await db.from('lv_carrinho').delete().eq('id', it.id);
        await this.load();
        return this.get();
      } catch (e) {
        console.warn(e);
      }
    }
    this._cache.splice(index, 1);
    try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
    this.updateBadge();
    return this.get();
  },

  async clear() {
    const db = await this._remote();
    const device = this.deviceId();
    if (db) {
      try {
        await db.from('lv_carrinho').delete().eq('device_id', device);
      } catch (e) {
        console.warn(e);
      }
    }
    this._cache = [];
    try { localStorage.removeItem('lv_carrinho'); } catch (e) {}
    this.updateBadge();
    return [];
  },

  count() {
    return this._cache.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  },

  subtotal() {
    return this._cache.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.quantidade) || 0), 0);
  },

  updateBadge() {
    const n = this.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = String(n);
      el.style.display = n > 0 ? '' : 'none';
    });
  }
};

window.Cart = Cart;
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Cart !== 'undefined' && Cart.load) {
    Cart.load().catch(() => {});
  }
});
