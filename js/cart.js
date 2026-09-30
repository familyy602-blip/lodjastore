/**
 * Carrinho local (intenção de compra — NÃO sincroniza com LODJA)
 * Não depende do Supabase. Guarda só dados leves (sem base64 de imagens).
 */
const Cart = {
  KEY: 'lv_carrinho',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch (e) { return []; }
  },

  /** Nunca guardar data-URL / base64 no carrinho (estoura o localStorage) */
  _slimImage(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.indexOf('data:') === 0) return '';
    if (url.length > 500) return '';
    return url;
  },

  save(items) {
    const slim = (items || []).map(i => ({
      produtoId: i.produtoId,
      nome: i.nome || 'Produto',
      imagem: this._slimImage(i.imagem),
      tamanho: i.tamanho || '',
      cor: i.cor || '',
      preco: Number(i.preco) || 0,
      quantidade: Math.max(1, Number(i.quantidade) || 1),
      variacaoId: i.variacaoId || null
    }));
    try {
      localStorage.setItem(this.KEY, JSON.stringify(slim));
    } catch (e) {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(slim.map(i => ({ ...i, imagem: '' }))));
      } catch (e2) {
        console.error('carrinho', e2);
        alert('Não foi possível guardar no carrinho. Tente limpar dados do site e repetir.');
        return this.get();
      }
    }
    this.updateBadge();
    return slim;
  },

  add(item) {
    if (!item || item.produtoId == null || item.produtoId === '') {
      console.warn('Cart.add: produto inválido', item);
      alert('Produto inválido para o carrinho.');
      return this.get();
    }
    const items = this.get();
    const key = String(item.produtoId) + '|' + (item.tamanho || '') + '|' + (item.cor || '');
    const existing = items.find(i =>
      String(i.produtoId) + '|' + (i.tamanho || '') + '|' + (i.cor || '') === key
    );
    const qty = Math.max(1, Number(item.quantidade) || 1);
    if (existing) {
      existing.quantidade = (Number(existing.quantidade) || 0) + qty;
      if (!existing.nome && item.nome) existing.nome = item.nome;
      if (!existing.preco && item.preco) existing.preco = Number(item.preco) || 0;
    } else {
      items.push({
        produtoId: item.produtoId,
        nome: item.nome || 'Produto',
        imagem: this._slimImage(item.imagem),
        tamanho: item.tamanho || '',
        cor: item.cor || '',
        preco: Number(item.preco) || 0,
        quantidade: qty,
        variacaoId: item.variacaoId || null
      });
    }
    return this.save(items);
  },

  updateQty(index, qty) {
    const items = this.get();
    if (!items[index]) return items;
    if (qty <= 0) items.splice(index, 1);
    else items[index].quantidade = qty;
    return this.save(items);
  },

  remove(index) {
    const items = this.get();
    items.splice(index, 1);
    return this.save(items);
  },

  clear() { return this.save([]); },

  count() {
    return this.get().reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  },

  subtotal() {
    return this.get().reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.quantidade) || 0), 0);
  },

  updateBadge() {
    const n = this.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = String(n);
      el.style.display = n > 0 ? '' : 'none';
    });
  }
};

if (typeof window !== 'undefined') {
  window.Cart = Cart;
  document.addEventListener('DOMContentLoaded', () => { try { Cart.updateBadge(); } catch (e) {} });
}
