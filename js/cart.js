/**
 * Carrinho local (intenção de compra — NÃO sincroniza com LODJA)
 */
const Cart = {
  KEY: 'lv_carrinho',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch (e) { return []; }
  },

  save(items) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch (e) {
      // se a imagem base64 for muito grande, grava sem imagem
      try {
        const slim = items.map(i => ({ ...i, imagem: (i.imagem && i.imagem.length > 5000) ? '' : (i.imagem || '') }));
        localStorage.setItem(this.KEY, JSON.stringify(slim));
      } catch (e2) {
        console.error('carrinho cheio', e2);
        alert('Não foi possível guardar no carrinho. Limpe o carrinho e tente de novo.');
        return this.get();
      }
    }
    this.updateBadge();
    return items;
  },

  add(item) {
    if (!item || !item.produtoId) {
      console.warn('Cart.add: produto inválido', item);
      return this.get();
    }
    const items = this.get();
    const key = String(item.produtoId) + '|' + (item.tamanho || '') + '|' + (item.cor || '');
    const existing = items.find(i => String(i.produtoId) + '|' + (i.tamanho || '') + '|' + (i.cor || '') === key);
    const qty = Math.max(1, Number(item.quantidade) || 1);
    if (existing) existing.quantidade = (Number(existing.quantidade) || 0) + qty;
    else items.push({
      produtoId: item.produtoId,
      nome: item.nome || 'Produto',
      imagem: item.imagem || '',
      tamanho: item.tamanho || '',
      cor: item.cor || '',
      preco: Number(item.preco) || 0,
      quantidade: qty,
      variacaoId: item.variacaoId || null
    });
    this.save(items);
    return items;
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
    return this.get().reduce((s, i) => s + (i.quantidade || 0), 0);
  },

  subtotal() {
    return this.get().reduce((s, i) => s + (i.preco * i.quantidade), 0);
  },

  updateBadge() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = this.count();
      el.style.display = this.count() > 0 ? '' : 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
