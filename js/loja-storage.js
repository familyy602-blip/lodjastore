/**
 * Camada de dados da Loja Virtual
 * Supabase (lv_*) com fallback localStorage se tabelas ainda não existirem
 */
const LojaDB = {
  _local: true,

  async init() {
    if (!window.supabaseClient && typeof initSupabase === 'function') initSupabase();
    if (!window.supabaseClient) {
      this._local = true;
      this._ensureSeed();
      return;
    }
    try {
      const { error } = await window.supabaseClient.from('lv_produtos').select('id').limit(1);
      this._local = !!error;
      if (this._local) console.warn('Tabelas lv_* indisponíveis — modo local', error?.message);
      else await this._seedRemoteIfEmpty();
    } catch (e) {
      this._local = true;
    }
    if (this._local) this._ensureSeed();
  },

  genId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // ----- LOCAL SEED -----
  _ensureSeed() {
    if (localStorage.getItem('lv_seeded')) return;
    const cats = [
      { id: 'cat_vest', nome: 'Vestuário', estado: 'activo', ordem: 1 },
      { id: 'cat_calc', nome: 'Calçados', estado: 'activo', ordem: 2 },
      { id: 'cat_bij', nome: 'Bijuterias', estado: 'activo', ordem: 3 }
    ];
    const subs = [
      { id: 'sub_calcas', categoria_id: 'cat_vest', nome: 'Calças', estado: 'activo' },
      { id: 'sub_vestidos', categoria_id: 'cat_vest', nome: 'Vestidos', estado: 'activo' },
      { id: 'sub_blusas', categoria_id: 'cat_vest', nome: 'Blusas', estado: 'activo' },
      { id: 'sub_tshirts', categoria_id: 'cat_vest', nome: 'T-shirts', estado: 'activo' },
      { id: 'sub_sand', categoria_id: 'cat_calc', nome: 'Sandálias', estado: 'activo' },
      { id: 'sub_tenis', categoria_id: 'cat_calc', nome: 'Ténis', estado: 'activo' },
      { id: 'sub_colares', categoria_id: 'cat_bij', nome: 'Colares', estado: 'activo' }
    ];
    const produtos = [
      {
        id: 'prod_jeans_bf', codigo: 'JN-BF-01', nome: 'Calça Jeans Boyfriend',
        descricao: 'Jeans confortável corte boyfriend, ideal para o dia a dia.',
        categoria_id: 'cat_vest', subcategoria_id: 'sub_calcas',
        preco: 1800, preco_promocional: 1500, estado: 'activo', destaque: true, tendencia: true,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1582418702059-97ebaf2e0a95?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [
          { tamanho: '36', cor: 'Azul', stock: 5 }, { tamanho: '38', cor: 'Azul', stock: 8 },
          { tamanho: '40', cor: 'Azul', stock: 4 }, { tamanho: '36', cor: 'Preto', stock: 3 },
          { tamanho: '38', cor: 'Preto', stock: 6 }, { tamanho: '40', cor: 'Preto', stock: 2 }
        ]
      },
      {
        id: 'prod_skinny', codigo: 'JN-SK-02', nome: 'Jeans Skinny',
        descricao: 'Modelo skinny moderno com elastano.',
        categoria_id: 'cat_vest', subcategoria_id: 'sub_calcas',
        preco: 1600, preco_promocional: null, estado: 'activo', destaque: true, tendencia: false,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [
          { tamanho: '36', cor: 'Azul', stock: 4 }, { tamanho: '38', cor: 'Azul', stock: 5 },
          { tamanho: '40', cor: 'Preto', stock: 3 }
        ]
      },
      {
        id: 'prod_vestido', codigo: 'VD-01', nome: 'Vestido Floral',
        descricao: 'Vestido leve para ocasiões especiais.',
        categoria_id: 'cat_vest', subcategoria_id: 'sub_vestidos',
        preco: 2200, preco_promocional: 1890, estado: 'activo', destaque: false, tendencia: true,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [
          { tamanho: 'S', cor: 'Floral', stock: 4 }, { tamanho: 'M', cor: 'Floral', stock: 5 },
          { tamanho: 'L', cor: 'Floral', stock: 2 }
        ]
      },
      {
        id: 'prod_tenis', codigo: 'TN-01', nome: 'Ténis Casual Branco',
        descricao: 'Conforto e estilo para o dia a dia.',
        categoria_id: 'cat_calc', subcategoria_id: 'sub_tenis',
        preco: 2500, preco_promocional: null, estado: 'activo', destaque: true, tendencia: true,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [
          { tamanho: '38', cor: 'Branco', stock: 3 }, { tamanho: '39', cor: 'Branco', stock: 4 },
          { tamanho: '40', cor: 'Branco', stock: 5 }, { tamanho: '41', cor: 'Branco', stock: 2 }
        ]
      },
      {
        id: 'prod_colar', codigo: 'BJ-01', nome: 'Colar Dourado Delicado',
        descricao: 'Bijuteria elegante para complementar o look.',
        categoria_id: 'cat_bij', subcategoria_id: 'sub_colares',
        preco: 450, preco_promocional: 350, estado: 'activo', destaque: false, tendencia: true,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [{ tamanho: 'Único', cor: 'Dourado', stock: 15 }]
      },
      {
        id: 'prod_tshirt', codigo: 'TS-01', nome: 'T-shirt Básica',
        descricao: 'Algodão premium, várias cores.',
        categoria_id: 'cat_vest', subcategoria_id: 'sub_tshirts',
        preco: 600, preco_promocional: null, estado: 'activo', destaque: false, tendencia: false,
        imagens: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', ordem: 0, tipo: 'principal' },
          { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', ordem: 1, tipo: 'secundaria' }
        ],
        variacoes: [
          { tamanho: 'S', cor: 'Branco', stock: 10 }, { tamanho: 'M', cor: 'Branco', stock: 12 },
          { tamanho: 'L', cor: 'Preto', stock: 8 }, { tamanho: 'M', cor: 'Preto', stock: 9 }
        ]
      }
    ];
    const promos = [{
      id: 'promo_3p', nome: '3 peças = 10% desconto',
      descricao: 'Leve 3 ou mais peças e desconte 10%',
      tipo: 'percentagem', valor: 10, quantidade_minima: 3,
      data_inicio: new Date().toISOString(),
      data_fim: new Date(Date.now() + 30 * 86400000).toISOString(),
      estado: 'activo'
    }];
    localStorage.setItem('lv_categorias', JSON.stringify(cats));
    localStorage.setItem('lv_subcategorias', JSON.stringify(subs));
    localStorage.setItem('lv_produtos', JSON.stringify(produtos));
    localStorage.setItem('lv_promocoes', JSON.stringify(promos));
    localStorage.setItem('lv_pedidos', JSON.stringify([]));
    localStorage.setItem('lv_seeded', '1');
  },

  async _seedRemoteIfEmpty() {
    try {
      const db = window.supabaseClient;
      if (!db) return;

      // 1) Migrar dados do localStorage (se existirem) para o Supabase
      await this._migrateLocalToRemote();

      // 2) Se ainda não houver produtos, criar catálogo de exemplo
      const { data: prods } = await db.from('lv_produtos').select('id').limit(1);
      if (prods && prods.length) return;

      // Força catálogo de exemplo se não houver nada local
      if (!this._getLocal('lv_produtos').length) {
        localStorage.removeItem('lv_seeded');
      }
      this._ensureSeed(); // garante seed no local
      const cats = this._getLocal('lv_categorias');
      const subs = this._getLocal('lv_subcategorias');
      const produtos = this._getLocal('lv_produtos');

      if (cats.length) await db.from('lv_categorias').upsert(cats);
      if (subs.length) await db.from('lv_subcategorias').upsert(subs);

      for (const prod of produtos) {
        const row = {
          id: prod.id,
          codigo: prod.codigo || null,
          nome: prod.nome,
          descricao: prod.descricao || null,
          categoria_id: prod.categoria_id || null,
          subcategoria_id: prod.subcategoria_id || null,
          preco: prod.preco || 0,
          preco_promocional: prod.preco_promocional != null ? prod.preco_promocional : null,
          estado: prod.estado || 'activo',
          destaque: !!prod.destaque,
          tendencia: !!prod.tendencia,
          data_criacao: prod.data_criacao || new Date().toISOString()
        };
        await db.from('lv_produtos').upsert(row);
        const imgs = (prod.imagens || []).map((im, i) => ({
          id: im.id || this.genId('img_'),
          produto_id: prod.id,
          url: im.url || im,
          ordem: im.ordem != null ? im.ordem : i,
          tipo: im.tipo || (i === 0 ? 'principal' : 'secundaria')
        }));
        if (imgs.length) await db.from('lv_produto_imagens').upsert(imgs);
        const vars = (prod.variacoes || []).map(v => ({
          id: v.id || this.genId('var_'),
          produto_id: prod.id,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          codigo: v.codigo || null,
          stock: v.stock != null ? v.stock : 0
        }));
        if (vars.length) await db.from('lv_variacoes').upsert(vars);
      }
      console.info('LojaDB: catálogo de exemplo gravado no Supabase');
    } catch (e) {
      console.warn('LojaDB seed remoto', e);
    }
  },

  async _migrateLocalToRemote() {
    try {
      const db = window.supabaseClient;
      if (!db) return;
      if (localStorage.getItem('lv_migrated_to_supabase') === '1') return;

      const cats = this._getLocal('lv_categorias');
      const subs = this._getLocal('lv_subcategorias');
      const produtos = this._getLocal('lv_produtos');
      const pedidos = this._getLocal('lv_pedidos');

      const hasLocal = cats.length || produtos.length || pedidos.length;
      if (!hasLocal) return;

      if (cats.length) {
        await db.from('lv_categorias').upsert(cats.map(c => ({
          id: c.id, nome: c.nome, descricao: c.descricao || null,
          imagem: c.imagem || null, estado: c.estado || 'activo', ordem: c.ordem || 0
        })));
      }
      if (subs.length) {
        await db.from('lv_subcategorias').upsert(subs.map(s => ({
          id: s.id, categoria_id: s.categoria_id, nome: s.nome,
          descricao: s.descricao || null, estado: s.estado || 'activo'
        })));
      }

      for (const prod of produtos) {
        await db.from('lv_produtos').upsert({
          id: prod.id,
          codigo: prod.codigo || null,
          nome: prod.nome,
          descricao: prod.descricao || null,
          categoria_id: prod.categoria_id || null,
          subcategoria_id: prod.subcategoria_id || null,
          preco: Number(prod.preco) || 0,
          preco_promocional: prod.preco_promocional != null ? Number(prod.preco_promocional) : null,
          estado: prod.estado || 'activo',
          destaque: !!prod.destaque,
          tendencia: !!prod.tendencia,
          data_criacao: prod.data_criacao || new Date().toISOString()
        });
        const imgs = (prod.imagens || []).map((im, i) => ({
          id: (im && im.id) || this.genId('img_'),
          produto_id: prod.id,
          url: typeof im === 'string' ? im : (im.url || ''),
          ordem: (im && im.ordem != null) ? im.ordem : i,
          tipo: (im && im.tipo) || (i === 0 ? 'principal' : 'secundaria')
        })).filter(x => x.url);
        if (imgs.length) await db.from('lv_produto_imagens').upsert(imgs);
        const vars = (prod.variacoes || []).map(v => ({
          id: v.id || this.genId('var_'),
          produto_id: prod.id,
          tamanho: v.tamanho || null,
          cor: v.cor || null,
          codigo: v.codigo || null,
          stock: v.stock != null ? v.stock : 0
        }));
        if (vars.length) await db.from('lv_variacoes').upsert(vars);
      }

      for (const ped of pedidos) {
        const { itens, ...rest } = ped;
        await db.from('lv_pedidos').upsert({
          id: rest.id,
          numero_pedido: rest.numero_pedido,
          cliente_id: rest.cliente_id || null,
          cliente_nome: rest.cliente_nome || null,
          cliente_telefone: rest.cliente_telefone || null,
          cliente_email: rest.cliente_email || null,
          subtotal: Number(rest.subtotal) || 0,
          desconto: Number(rest.desconto) || 0,
          taxa_entrega: Number(rest.taxa_entrega) || 0,
          total: Number(rest.total) || 0,
          estado: rest.estado || 'pendente',
          metodo_pagamento: rest.metodo_pagamento || null,
          metodo_entrega: rest.metodo_entrega || null,
          morada_entrega: rest.morada_entrega || null,
          observacoes: rest.observacoes || null,
          lodja_cliente: !!rest.lodja_cliente,
          lodja_sync: !!rest.lodja_sync,
          data_criacao: rest.data_criacao || new Date().toISOString(),
          data_confirmacao: rest.data_confirmacao || null,
          data_conclusao: rest.data_conclusao || null
        });
        if (itens && itens.length) {
          const rows = itens.map((it, i) => ({
            id: it.id || this.genId('pi_'),
            pedido_id: rest.id,
            produto_id: it.produto_id || null,
            variacao_id: it.variacao_id || null,
            nome_produto: it.nome_produto || it.nome || null,
            nome: it.nome || it.nome_produto || null,
            tamanho: it.tamanho || null,
            cor: it.cor || null,
            quantidade: Number(it.quantidade) || 1,
            preco_unitario: Number(it.preco_unitario || it.preco) || 0,
            preco: Number(it.preco || it.preco_unitario) || 0,
            desconto: Number(it.desconto) || 0,
            subtotal: Number(it.subtotal) || 0
          }));
          await db.from('lv_pedido_itens').upsert(rows);
        }
      }

      localStorage.setItem('lv_migrated_to_supabase', '1');
      console.info('LojaDB: dados locais migrados para Supabase', {
        cats: cats.length, produtos: produtos.length, pedidos: pedidos.length
      });
    } catch (e) {
      console.warn('Migração local→Supabase', e);
    }
  },

  _getLocal(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  },
  _setLocal(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ----- CATEGORIAS -----
  async getCategorias() {
    if (this._local) return this._getLocal('lv_categorias').filter(c => c.estado !== 'inactivo');
    const { data, error } = await window.supabaseClient.from('lv_categorias').select('*').order('ordem');
    if (error) return this._getLocal('lv_categorias');
    return data || [];
  },

  async getSubcategorias(categoriaId) {
    if (this._local) {
      let s = this._getLocal('lv_subcategorias');
      if (categoriaId) s = s.filter(x => x.categoria_id === categoriaId);
      return s;
    }
    let q = window.supabaseClient.from('lv_subcategorias').select('*');
    if (categoriaId) q = q.eq('categoria_id', categoriaId);
    const { data } = await q;
    return data || [];
  },

  // ----- PRODUTOS -----
  async getProdutos(filtros = {}) {
    let list;
    if (this._local) list = this._getLocal('lv_produtos');
    else {
      const { data, error } = await window.supabaseClient.from('lv_produtos').select('*').order('data_criacao', { ascending: false });
      if (error) list = this._getLocal('lv_produtos');
      else list = data || [];
      // Anexar imagens da tabela lv_produto_imagens (para o catálogo)
      try {
        const ids = (list || []).map(p => p.id).filter(Boolean);
        if (ids.length) {
          const { data: imgs } = await window.supabaseClient
            .from('lv_produto_imagens')
            .select('*')
            .in('produto_id', ids)
            .order('ordem');
          const byProd = {};
          (imgs || []).forEach(im => {
            if (!byProd[im.produto_id]) byProd[im.produto_id] = [];
            byProd[im.produto_id].push(im);
          });
          list = list.map(p => ({ ...p, imagens: byProd[p.id] || p.imagens || [] }));
        }
      } catch (e) {
        console.warn('imagens produtos', e);
      }
    }
    list = list.filter(p => p.estado !== 'oculto' && p.estado !== 'inactivo');
    if (filtros.categoria_id) list = list.filter(p => p.categoria_id === filtros.categoria_id);
    if (filtros.subcategoria_id) list = list.filter(p => p.subcategoria_id === filtros.subcategoria_id);
    if (filtros.destaque) list = list.filter(p => p.destaque);
    if (filtros.tendencia) list = list.filter(p => p.tendencia);
    if (filtros.q) {
      const q = filtros.q.toLowerCase();
      list = list.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q));
    }
    return list;
  },

  async getProduto(id) {
    if (this._local) return this._getLocal('lv_produtos').find(p => p.id === id) || null;
    const { data } = await window.supabaseClient.from('lv_produtos').select('*').eq('id', id).maybeSingle();
    if (data) {
      const { data: imgs } = await window.supabaseClient.from('lv_produto_imagens').select('*').eq('produto_id', id).order('ordem');
      const { data: vars } = await window.supabaseClient.from('lv_variacoes').select('*').eq('produto_id', id);
      return { ...data, imagens: imgs || [], variacoes: vars || [] };
    }
    return this._getLocal('lv_produtos').find(p => p.id === id) || null;
  },

  async saveProduto(prod) {
    if (!prod.id) prod.id = this.genId('prod_');
    if (this._local) {
      const list = this._getLocal('lv_produtos');
      const i = list.findIndex(p => p.id === prod.id);
      if (i >= 0) list[i] = { ...list[i], ...prod };
      else list.unshift(prod);
      this._setLocal('lv_produtos', list);
      return prod;
    }
    const row = {
      id: prod.id, codigo: prod.codigo, nome: prod.nome, descricao: prod.descricao,
      categoria_id: prod.categoria_id, subcategoria_id: prod.subcategoria_id,
      preco: prod.preco, preco_promocional: prod.preco_promocional,
      estado: prod.estado || 'activo', destaque: !!prod.destaque, tendencia: !!prod.tendencia
    };
    const { error } = await window.supabaseClient.from('lv_produtos').upsert(row);
    if (error) throw error;
    return prod;
  },

  async deleteProduto(id) {
    if (this._local) {
      this._setLocal('lv_produtos', this._getLocal('lv_produtos').filter(p => p.id !== id));
      return;
    }
    await window.supabaseClient.from('lv_produtos').delete().eq('id', id);
  },

  // ----- PROMOÇÕES -----
  async getPromocoesActivas() {
    const agora = Date.now();
    let list;
    if (this._local) list = this._getLocal('lv_promocoes');
    else {
      const { data } = await window.supabaseClient.from('lv_promocoes').select('*').eq('estado', 'activo');
      list = data || [];
    }
    return list.filter(p => {
      if (p.estado && p.estado !== 'activo') return false;
      if (p.data_inicio && new Date(p.data_inicio).getTime() > agora) return false;
      if (p.data_fim && new Date(p.data_fim).getTime() < agora) return false;
      return true;
    });
  },

  calcularDesconto(itens, promocoes) {
    const qty = itens.reduce((s, i) => s + i.quantidade, 0);
    const sub = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    let desconto = 0;
    let promoAplicada = null;
    for (const pr of promocoes) {
      if (qty >= (pr.quantidade_minima || 1)) {
        let d = 0;
        if (pr.tipo === 'percentagem') d = sub * (pr.valor / 100);
        else d = pr.valor;
        if (d > desconto) { desconto = d; promoAplicada = pr; }
      }
    }
    return { desconto, promoAplicada, subtotal: sub, total: Math.max(0, sub - desconto) };
  },

  // ----- PEDIDOS -----
  async nextNumeroPedido() {
    let n = 1;
    if (this._local) {
      const pedidos = this._getLocal('lv_pedidos');
      n = pedidos.length + 1;
    } else {
      const { count } = await window.supabaseClient.from('lv_pedidos').select('*', { count: 'exact', head: true });
      n = (count || 0) + 1;
    }
    return 'LOJA-' + String(n).padStart(6, '0');
  },

  async criarPedido(dados) {
    const numero = await this.nextNumeroPedido();
    const id = this.genId('ped_');
    const pedido = {
      id,
      numero_pedido: numero,
      cliente_id: dados.cliente_id || null,
      cliente_nome: dados.nome,
      cliente_telefone: dados.telefone,
      cliente_email: dados.email || '',
      subtotal: dados.subtotal,
      desconto: dados.desconto || 0,
      taxa_entrega: dados.taxa_entrega || 0,
      total: dados.total,
      estado: 'pendente',
      metodo_pagamento: dados.metodo_pagamento,
      metodo_entrega: dados.metodo_entrega,
      morada_entrega: dados.morada_entrega || '',
      observacoes: dados.observacoes || '',
      data_criacao: new Date().toISOString(),
      itens: dados.itens || []
    };

    if (this._local) {
      const pedidos = this._getLocal('lv_pedidos');
      pedidos.unshift(pedido);
      this._setLocal('lv_pedidos', pedidos);
      return pedido;
    }

    const { itens, ...row } = pedido;
    const { error } = await window.supabaseClient.from('lv_pedidos').insert(row);
    if (error) throw error;
    for (const it of itens) {
      await window.supabaseClient.from('lv_pedido_itens').insert({
        id: this.genId('pi_'),
        pedido_id: id,
        produto_id: it.produtoId,
        nome_produto: it.nome,
        tamanho: it.tamanho,
        cor: it.cor,
        quantidade: it.quantidade,
        preco_unitario: it.preco,
        subtotal: it.preco * it.quantidade
      });
    }
    return pedido;
  },

  async getPedidos(filtros = {}) {
    if (this._local) {
      let list = this._getLocal('lv_pedidos');
      if (filtros.telefone) list = list.filter(p => String(p.cliente_telefone).replace(/\D/g, '') === String(filtros.telefone).replace(/\D/g, ''));
      return list;
    }
    let q = window.supabaseClient.from('lv_pedidos').select('*').order('data_criacao', { ascending: false });
    if (filtros.telefone) q = q.eq('cliente_telefone', filtros.telefone);
    const { data } = await q;
    return data || [];
  },

  async getPedido(id) {
    if (this._local) return this._getLocal('lv_pedidos').find(p => p.id === id || p.numero_pedido === id) || null;
    const { data } = await window.supabaseClient.from('lv_pedidos').select('*').or(`id.eq.${id},numero_pedido.eq.${id}`).maybeSingle();
    if (!data) return null;
    const { data: itens } = await window.supabaseClient.from('lv_pedido_itens').select('*').eq('pedido_id', data.id);
    return { ...data, itens: itens || [] };
  },

  async actualizarEstadoPedido(id, estado) {
    const agora = new Date().toISOString();
    const extra = {};
    if (estado === 'confirmado') extra.data_confirmacao = agora;
    if (estado === 'concluido') extra.data_conclusao = agora;

    if (this._local) {
      const list = this._getLocal('lv_pedidos');
      const i = list.findIndex(p => p.id === id);
      if (i < 0) throw new Error('Pedido não encontrado');
      list[i].estado = estado;
      Object.assign(list[i], extra);
      this._setLocal('lv_pedidos', list);
      const pedido = list[i];
      if (['pago','pronto','concluido','entregue'].includes(estado)) {
        const _s = await this.getSettings();
        if (window.LodjaBridge) {
          const r = await LodjaBridge.sincronizarCompra(pedido, _s);
          if (r && r.ok) {
            list[i].lodja_sync = true;
            this._setLocal('lv_pedidos', list);
          }
        }
      }
      return list[i];
    }

    const { error } = await window.supabaseClient.from('lv_pedidos').update({ estado, ...extra }).eq('id', id);
    if (error) throw error;
    const pedido = await this.getPedido(id);
    if (['pago','pronto','concluido','entregue'].includes(estado)) {
      const _s = await this.getSettings();
      if (window.LodjaBridge) {
        const r = await LodjaBridge.sincronizarCompra(pedido, _s);
        if (r && r.ok) {
          try { await window.supabaseClient.from('lv_pedidos').update({ lodja_sync: true }).eq('id', id); } catch (e) {}
          pedido.lodja_sync = true;
        }
      }
    }
    return pedido;
  },


  // ----- SETTINGS / PROMOÇÕES / UPLOAD -----
  defaultSettings() {
    return {
      siteName: 'LODJA Store',
      adminPassword: localStorage.getItem('lv_admin_pass') || 'admin123',
      logoUrl: 'logo-lodja.png',
      whatsapp: '258862095655',
      syncClientesLodja: true,
      syncComprasLodja: true,
      mostrarBonusEspecial: true
    };
  },
  async getSettings() {
    try {
      if (!this._local && window.supabaseClient) {
        const { data } = await window.supabaseClient.from('lv_config').select('data').eq('id', 'main').maybeSingle();
        if (data && data.data) return { ...this.defaultSettings(), ...data.data };
      }
    } catch (e) {}
    try {
      const s = JSON.parse(localStorage.getItem('lv_settings') || 'null');
      return { ...this.defaultSettings(), ...(s || {}) };
    } catch (e) { return this.defaultSettings(); }
  },
  async saveSettings(partial) {
    const next = { ...(await this.getSettings()), ...partial };
    if (next.adminPassword) localStorage.setItem('lv_admin_pass', next.adminPassword);
    localStorage.setItem('lv_settings', JSON.stringify(next));
    if (!this._local && window.supabaseClient) {
      try { await window.supabaseClient.from('lv_config').upsert({ id: 'main', data: next }); } catch (e) {}
    }
    return next;
  },
  async getAllPromocoes() {
    if (this._local) return this._getLocal('lv_promocoes');
    try {
      const { data } = await window.supabaseClient.from('lv_promocoes').select('*').order('data_inicio', { ascending: false });
      return data || this._getLocal('lv_promocoes');
    } catch (e) { return this._getLocal('lv_promocoes'); }
  },
  async savePromocao(pr) {
    if (!pr.id) pr.id = this.genId('promo_');
    if (!pr.estado) pr.estado = 'activo';
    if (this._local) {
      const list = this._getLocal('lv_promocoes');
      const i = list.findIndex(x => x.id === pr.id);
      if (i >= 0) list[i] = pr; else list.unshift(pr);
      this._setLocal('lv_promocoes', list);
      return pr;
    }
    await window.supabaseClient.from('lv_promocoes').upsert(pr);
    return pr;
  },
  async deletePromocao(id) {
    if (this._local) {
      this._setLocal('lv_promocoes', this._getLocal('lv_promocoes').filter(p => p.id !== id));
      return;
    }
    await window.supabaseClient.from('lv_promocoes').delete().eq('id', id);
  },
  async marcarClienteLodja(pedidoId, tornar) {
    const pedido = await this.getPedido(pedidoId);
    if (!pedido) throw new Error('Pedido não encontrado');
    if (this._local) {
      const list = this._getLocal('lv_pedidos');
      const i = list.findIndex(p => p.id === pedidoId);
      if (i >= 0) { list[i].lodja_cliente = !!tornar; this._setLocal('lv_pedidos', list); }
    } else {
      try { await window.supabaseClient.from('lv_pedidos').update({ lodja_cliente: !!tornar }).eq('id', pedidoId); } catch (e) {}
    }
    if (tornar && window.LodjaBridge && LodjaBridge.garantirCliente) {
      const cliId = await LodjaBridge.garantirCliente({ nome: pedido.cliente_nome, telefone: pedido.cliente_telefone });
      // Se o pedido já foi pago/concluído, regista também a compra no LODJA
      if (['pago','pronto','concluido','entregue'].includes(pedido.estado)) {
        const _s = await this.getSettings();
        await LodjaBridge.sincronizarCompra({ ...pedido, lodja_cliente: true }, _s);
      }
      return { ok: true, clienteId: cliId };
    }
    return { ok: true };
  },
  readFileAsDataURL(file, maxSide = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || '').startsWith('image/')) return reject(new Error('Ficheiro inválido'));
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxSide || h > maxSide) {
            const r = Math.min(maxSide / w, maxSide / h);
            w = Math.round(w * r); h = Math.round(h * r);
          }
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },


  async saveCategoria(cat) {
    if (!cat.id) cat.id = this.genId('cat_');
    if (!cat.estado) cat.estado = 'activo';
    if (this._local) {
      const list = this._getLocal('lv_categorias');
      const i = list.findIndex(c => c.id === cat.id);
      if (i >= 0) list[i] = { ...list[i], ...cat }; else list.push(cat);
      this._setLocal('lv_categorias', list);
      return cat;
    }
    await window.supabaseClient.from('lv_categorias').upsert(cat);
    return cat;
  },
  async deleteCategoria(id) {
    if (this._local) {
      this._setLocal('lv_categorias', this._getLocal('lv_categorias').filter(c => c.id !== id));
      return;
    }
    await window.supabaseClient.from('lv_categorias').delete().eq('id', id);
  },
  async getAllCategorias() {
    if (this._local) return this._getLocal('lv_categorias');
    try {
      const { data } = await window.supabaseClient.from('lv_categorias').select('*');
      return data || this._getLocal('lv_categorias');
    } catch (e) { return this._getLocal('lv_categorias'); }
  },
  formatMT(v) {
    return (Number(v) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MT';
  },

  precoFinal(p) {
    if (p.preco_promocional != null && p.preco_promocional < p.preco) return p.preco_promocional;
    return p.preco;
  },

  imgPrincipal(p) {
    if (p.imagens && p.imagens.length) {
      const main = p.imagens.find(i => i.tipo === 'principal') || p.imagens[0];
      const url = typeof main === 'string' ? main : (main && main.url);
      if (url) return url;
    }
    if (p.imagem) return p.imagem;
    if (p.imagem_url) return p.imagem_url;
    const base = (typeof location !== 'undefined' && location.pathname.indexOf('/lodjastore') === 0)
      ? '/lodjastore/' : '';
    return base + 'logo-lodja.png';
  }
};
