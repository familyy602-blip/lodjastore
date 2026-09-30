/**
 * Carrinho Supabase com actualização optimista (UI rápida).
 * Cache em memória + sync em segundo plano à base de dados.
 */
const Cart = {
  KEY_DEVICE: 'lv_device_id',
  _cache: [],
  _loading: null,
  _imgCache: {},

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

  _mapRows(data) {
    return (data || []).map(r => ({
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

  async load(force) {
    if (this._loading && !force) return this._loading;
    this._loading = (async () => {
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
          this._cache = this._mapRows(data);
          await this._migrateLocalIfAny(db, device);
          this.updateBadge();
          return this._cache;
        } catch (e) {
          console.warn('Carrinho remoto', e);
        }
      }
      try {
        this._cache = JSON.parse(localStorage.getItem('lv_carrinho') || '[]');
      } catch (e) {
        this._cache = [];
      }
      this.updateBadge();
      return this._cache;
    })();
    try {
      return await this._loading;
    } finally {
      this._loading = null;
    }
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
    this._cache = this._mapRows(data);
  },

  get() {
    return this._cache.slice();
  },

  /** Sync em background — não bloqueia a UI */
  _bg(fn) {
    Promise.resolve().then(fn).catch(e => console.warn('cart sync', e));
  },

  async add(item) {
    if (!item || item.produtoId == null || item.produtoId === '') {
      alert('Produto inválido para o carrinho.');
      return this.get();
    }
    if (!this._cache.length) await this.load();
    const device = this.deviceId();
    const qtyAdd = Math.max(1, Number(item.quantidade) || 1);
    let img = '';
    if (item.imagem && String(item.imagem).indexOf('data:') !== 0 && String(item.imagem).length < 400) {
      img = String(item.imagem);
    }
    const existing = this._cache.find(i =>
      String(i.produtoId) === String(item.produtoId) &&
      (i.tamanho || '') === (item.tamanho || '') &&
      (i.cor || '') === (item.cor || '')
    );

    if (existing) {
      existing.quantidade = (Number(existing.quantidade) || 0) + qtyAdd;
      if (item.nome) existing.nome = item.nome;
      if (item.preco != null) existing.preco = Number(item.preco) || existing.preco;
      this.updateBadge();
      const id = existing.id;
      const qty = existing.quantidade;
      this._bg(async () => {
        const db = await this._remote();
        if (!db || !id || String(id).indexOf('local_') === 0) return;
        await db.from('lv_carrinho').update({
          quantidade: qty,
          preco: existing.preco,
          nome: existing.nome,
          data_atualizacao: new Date().toISOString()
        }).eq('id', id);
      });
      return this.get();
    }

    const rowId = 'cart_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const localItem = {
      id: rowId,
      produtoId: item.produtoId,
      nome: item.nome || 'Produto',
      imagem: img,
      tamanho: item.tamanho || '',
      cor: item.cor || '',
      preco: Number(item.preco) || 0,
      quantidade: qtyAdd,
      variacaoId: item.variacaoId || null
    };
    this._cache.unshift(localItem);
    this.updateBadge();

    this._bg(async () => {
      const db = await this._remote();
      if (!db) {
        try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
        return;
      }
      const { error } = await db.from('lv_carrinho').insert({
        id: rowId,
        device_id: device,
        produto_id: String(item.produtoId),
        nome: localItem.nome,
        imagem: img,
        tamanho: localItem.tamanho,
        cor: localItem.cor,
        preco: localItem.preco,
        quantidade: qtyAdd,
        variacao_id: localItem.variacaoId,
        data_atualizacao: new Date().toISOString()
      });
      if (error) console.warn('insert cart', error);
    });
    return this.get();
  },

  async updateQty(index, qty) {
    const it = this._cache[index];
    if (!it) return this.get();
    if (qty <= 0) return this.remove(index);

    // Optimista
    it.quantidade = qty;
    this.updateBadge();
    const id = it.id;

    this._bg(async () => {
      const db = await this._remote();
      if (db && id && String(id).indexOf('local_') !== 0) {
        await db.from('lv_carrinho').update({
          quantidade: qty,
          data_atualizacao: new Date().toISOString()
        }).eq('id', id);
      } else {
        try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
      }
    });
    return this.get();
  },

  async remove(index) {
    const it = this._cache[index];
    if (!it) return this.get();
    const id = it.id;
    this._cache.splice(index, 1);
    this.updateBadge();

    this._bg(async () => {
      const db = await this._remote();
      if (db && id && String(id).indexOf('local_') !== 0) {
        await db.from('lv_carrinho').delete().eq('id', id);
      } else {
        try { localStorage.setItem('lv_carrinho', JSON.stringify(this._cache)); } catch (e) {}
      }
    });
    return this.get();
  },

  async clear() {
    const device = this.deviceId();
    this._cache = [];
    this.updateBadge();
    this._bg(async () => {
      const db = await this._remote();
      if (db) {
        try { await db.from('lv_carrinho').delete().eq('device_id', device); } catch (e) {}
      }
      try { localStorage.removeItem('lv_carrinho'); } catch (e) {}
    });
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
  if (Cart.load) Cart.load().catch(() => {});
});
