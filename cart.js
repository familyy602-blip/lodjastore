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
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
    return items;
  },

  add(item) {
    const items = this.get();
    const key = item.produtoId + '|' + (item.tamanho || '') + '|' + (item.cor || '');
    const existing = items.find(i => i.produtoId + '|' + (i.tamanho || '') + '|' + (i.cor || '') === key);
    if (existing) existing.quantidade += item.quantidade || 1;
    else items.push({
      produtoId: item.produtoId,
      nome: item.nome,
      imagem: item.imagem || '',
      tamanho: item.tamanho || '',
      cor: item.cor || '',
      preco: item.preco,
      quantidade: item.quantidade || 1,
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
