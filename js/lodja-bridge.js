/**
 * Ponte Loja Virtual → LODJA v1 (mesmo projecto Supabase)
 */
const LodjaBridge = {
  async garantirCliente({ nome, telefone }) {
    const tel = String(telefone || '').replace(/\D/g, '');
    if (!tel) return null;
    if (!window.supabaseClient && typeof initSupabase === 'function') initSupabase();
    const db = window.supabaseClient;
    if (!db) return null;
    const { data: clientes } = await db.from('clientes').select('id').eq('telefone', tel).limit(1);
    if (clientes && clientes[0]) {
      if (nome) await db.from('clientes').update({ nome }).eq('id', clientes[0].id);
      return clientes[0].id;
    }
    const id = 'cli_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await db.from('clientes').insert({
      id,
      nome: nome || 'Cliente Loja',
      telefone: tel,
      total_pecas: 0,
      total_compras: 0,
      estado: 'activo',
      data_cadastro: new Date().toISOString()
    });
    return id;
  },

  async nextFacturaLodja(db) {
    try {
      const { data } = await db.from('compras').select('numero_factura');
      let max = 0;
      (data || []).forEach(c => {
        const n = String(c.numero_factura || '').replace(/\D/g, '');
        if (n) max = Math.max(max, parseInt(n, 10) || 0);
      });
      return String(max + 1).padStart(3, '0');
    } catch (e) {
      return String(Date.now()).slice(-3);
    }
  },

  async sincronizarCompra(pedido, settings) {
    if (!pedido) return { ok: false, erro: 'Pedido inválido' };
    const refLoja = pedido.numero_pedido || pedido.id;
    if (localStorage.getItem('lv_sync_' + refLoja) === 'ok') return { ok: true, duplicado: true };
    const qty = (pedido.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0), 0) || 1;
    const valor = Number(pedido.total) || 0;
    const nome = pedido.cliente_nome || '';
    const telefone = String(pedido.cliente_telefone || '').replace(/\D/g, '');
    try {
      if (!window.supabaseClient && typeof initSupabase === 'function') initSupabase();
      const db = window.supabaseClient;
      if (!db) return { ok: false, erro: 'Sem ligação Supabase' };
      if (settings && settings.syncComprasLodja === false) return { ok: true, skip: true };

      let clienteId = null;
      if (telefone) clienteId = await this.garantirCliente({ nome, telefone });
      if (!clienteId) return { ok: false, erro: 'Não foi possível registar o cliente no LODJA (telefone em falta?)' };

      // Evitar duplicados: procura referência da loja na observação
      try {
        const { data: existing } = await db.from('compras').select('id,numero_factura,observacao').eq('cliente_id', clienteId);
        const dup = (existing || []).find(c => String(c.observacao || '').indexOf(refLoja) >= 0);
        if (dup) {
          localStorage.setItem('lv_sync_' + refLoja, 'ok');
          return { ok: true, duplicado: true, clienteId, factura: dup.numero_factura };
        }
      } catch (e) {}

      // Factura LODJA: 001, 002, 003…
      const factura = await this.nextFacturaLodja(db);
      const dataCompra = (pedido.data_criacao
        ? new Date(pedido.data_criacao)
        : new Date()).toISOString().split('T')[0];
      const itensTxt = (pedido.itens || []).map(i =>
        (i.quantidade || 1) + 'x ' + (i.nome || '')
      ).join(', ');

      const row = {
        id: 'cmp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        cliente_id: clienteId,
        numero_factura: factura,
        quantidade_pecas: qty,
        valor: valor,
        data: dataCompra,
        observacao: 'Loja Virtual · ' + refLoja + (itensTxt ? ' · ' + itensTxt : '')
      };

      const { error } = await db.from('compras').insert(row);
      if (error) {
        console.error('insert compras', error);
        return { ok: false, erro: error.message || String(error) };
      }

      const { data: lista } = await db.from('compras').select('quantidade_pecas').eq('cliente_id', clienteId);
      const totalPecas = (lista || []).reduce((s, c) => s + (c.quantidade_pecas || 0), 0);
      const totalCompras = (lista || []).length;
      await db.from('clientes').update({
        total_pecas: totalPecas,
        total_compras: totalCompras,
        elegivel: totalPecas >= 5
      }).eq('id', clienteId);

      localStorage.setItem('lv_sync_' + refLoja, 'ok');
      localStorage.setItem('lv_sync_fact_' + refLoja, factura);
      return { ok: true, pecas: qty, factura, clienteId };
    } catch (e) {
      console.error(e);
      return { ok: false, erro: e.message || String(e) };
    }
  },

  async getBonusEspecialLodja() {
    try {
      if (!window.supabaseClient && typeof initSupabase === 'function') initSupabase();
      const db = window.supabaseClient;
      if (!db) return { activo: false };
      const { data } = await db.from('config').select('*').limit(8);
      if (!data) return { activo: false };
      for (const row of data) {
        let cfg = row.data || row.valor || row.value || row;
        if (typeof cfg === 'string') {
          try { cfg = JSON.parse(cfg); } catch (e) { continue; }
        }
        if (cfg && cfg.bonusEspecial) return cfg.bonusEspecial;
      }
      const { data: one } = await db.from('config').select('*').eq('id', 'main').maybeSingle();
      if (one) {
        let cfg = one.data || one.valor || one;
        if (typeof cfg === 'string') cfg = JSON.parse(cfg);
        if (cfg && cfg.bonusEspecial) return cfg.bonusEspecial;
      }
    } catch (e) { console.warn('bonus lodja', e); }
    return { activo: false };
  },

  whatsappPedidoUrl(pedido, settings) {
    const wa = String((settings && settings.whatsapp) || '258862095655').replace(/\D/g, '');
    const itens = (pedido.itens || []).map(i =>
      '• ' + i.quantidade + 'x ' + i.nome +
      (i.tamanho || i.cor ? ' (' + [i.tamanho, i.cor].filter(Boolean).join('/') + ')' : '')
    ).join('\n');
    const msg =
'Olá! Novo pedido *' + pedido.numero_pedido + '*\n\n' +
'👤 Cliente: ' + (pedido.cliente_nome || '') + '\n' +
'📞 Contacto: ' + (pedido.cliente_telefone || '') + '\n' +
(pedido.cliente_email ? '✉️ ' + pedido.cliente_email + '\n' : '') +
'\n📦 Itens:\n' + itens + '\n\n' +
'💰 Subtotal: ' + (pedido.subtotal || 0) + ' MT\n' +
'🏷️ Desconto: ' + (pedido.desconto || 0) + ' MT\n' +
'✅ *Total: ' + (pedido.total || 0) + ' MT*\n\n' +
'🚚 ' + (pedido.metodo_entrega || '-') + '\n' +
'💳 ' + (pedido.metodo_pagamento || '-') + '\n' +
'📍 ' + (pedido.morada_entrega || 'Levantamento') +
(pedido.observacoes ? '\n📝 ' + pedido.observacoes : '');
    return 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
  }
};
