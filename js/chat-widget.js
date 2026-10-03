/**
 * Chat widget — cliente → administrador
 */
(function () {
  if (window.__lodjaChat) return;
  window.__lodjaChat = true;

  const css = `
  #lodja-chat-btn{
    position:fixed;right:16px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:9998;
    width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;
    background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-size:26px;
    box-shadow:0 8px 24px rgba(18,140,126,.4);display:grid;place-items:center;
  }
  @media(min-width:901px){ #lodja-chat-btn{ bottom:24px; } }
  #lodja-chat-panel{
    position:fixed;right:16px;bottom:calc(140px + env(safe-area-inset-bottom,0px));z-index:9999;
    width:min(360px,calc(100vw - 24px));max-height:min(480px,70vh);
    background:#fff;border-radius:18px;box-shadow:0 20px 50px rgba(15,23,42,.25);
    display:none;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;
  }
  @media(min-width:901px){ #lodja-chat-panel{ bottom:90px; } }
  #lodja-chat-panel.open{ display:flex; }
  #lodja-chat-panel header{
    background:linear-gradient(135deg,#128c7e,#25d366);color:#fff;padding:14px 16px;
    display:flex;justify-content:space-between;align-items:center;
  }
  #lodja-chat-panel header strong{ font-size:15px; }
  #lodja-chat-panel header button{ background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer; }
  #lodja-chat-body{ flex:1;overflow-y:auto;padding:12px;background:#ece5dd;min-height:180px; }
  .lc-bubble{ max-width:85%;padding:8px 12px;border-radius:10px;margin:6px 0;font-size:13px;line-height:1.4; }
  .lc-bubble.me{ background:#dcf8c6;margin-left:auto;border-bottom-right-radius:2px; }
  .lc-bubble.admin{ background:#fff;margin-right:auto;border-bottom-left-radius:2px; }
  .lc-bubble .t{ font-size:10px;color:#667;margin-top:4px; }
  #lodja-chat-form{ padding:10px;background:#f0f2f5;display:grid;gap:6px; }
  #lodja-chat-form input,#lodja-chat-form textarea{
    width:100%;border:1px solid #ddd;border-radius:10px;padding:8px 10px;font:inherit;font-size:13px;box-sizing:border-box;
  }
  #lodja-chat-form textarea{ min-height:56px;resize:none; }
  #lodja-chat-form button{
    background:#128c7e;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer;
  }
  `;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  const btn = document.createElement('button');
  btn.id = 'lodja-chat-btn';
  btn.type = 'button';
  btn.title = 'Fale connosco';
  btn.innerHTML = '💬';
  btn.setAttribute('aria-label', 'Abrir chat');

  const panel = document.createElement('div');
  panel.id = 'lodja-chat-panel';
  panel.innerHTML = `
    <header>
      <div><strong>Chat LODJA</strong><div style="font-size:11px;opacity:.9">Mensagem para a loja</div></div>
      <button type="button" id="lodja-chat-close" aria-label="Fechar">×</button>
    </header>
    <div id="lodja-chat-body"></div>
    <form id="lodja-chat-form">
      <input id="lc-nome" placeholder="O seu nome" autocomplete="name" required>
      <input id="lc-contacto" placeholder="Email ou WhatsApp" required>
      <textarea id="lc-texto" placeholder="Escreva a sua mensagem…" required></textarea>
      <button type="submit">Enviar mensagem</button>
    </form>`;

  function mount() {
    if (document.body.classList.contains('admin-pro')) return;
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  function open() {
    panel.classList.add('open');
    try {
      const sess = typeof LojaDB !== 'undefined' && LojaDB.getClienteSessao && LojaDB.getClienteSessao();
      if (sess) {
        if (sess.nome) document.getElementById('lc-nome').value = sess.nome;
        if (sess.email) document.getElementById('lc-contacto').value = sess.email;
        else if (sess.telefone) document.getElementById('lc-contacto').value = sess.telefone;
      }
    } catch (e) {}
    refreshThread();
  }
  function close() { panel.classList.remove('open'); }

  btn.addEventListener('click', () => {
    if (panel.classList.contains('open')) close();
    else open();
  });
  panel.querySelector('#lodja-chat-close').addEventListener('click', close);

  async function refreshThread() {
    const body = document.getElementById('lodja-chat-body');
    if (!body || typeof LojaDB === 'undefined') {
      body.innerHTML = '<p style="font-size:12px;color:#555;text-align:center">Carregando…</p>';
      return;
    }
    try {
      await LojaDB.init();
      const contacto = document.getElementById('lc-contacto').value.trim();
      const sess = LojaDB.getClienteSessao && LojaDB.getClienteSessao();
      const email = contacto.includes('@') ? contacto : (sess && sess.email) || '';
      const tel = !contacto.includes('@') ? contacto.replace(/\D/g, '') : (sess && sess.telefone) || '';
      if (!email && !tel) {
        body.innerHTML = '<p style="font-size:12px;color:#555;text-align:center;padding:20px">Escreva o seu contacto e envie uma mensagem. A equipa responde em breve.</p>';
        return;
      }
      const list = await LojaDB.getMensagensCliente(email, tel);
      if (!list.length) {
        body.innerHTML = '<p style="font-size:12px;color:#555;text-align:center;padding:20px">Ainda sem mensagens. Envie a primeira!</p>';
        return;
      }
      body.innerHTML = list.map(m => {
        let html = `<div class="lc-bubble me">${escapeHtml(m.mensagem)}<div class="t">${fmt(m.created_at)}</div></div>`;
        if (m.resposta) html += `<div class="lc-bubble admin">${escapeHtml(m.resposta)}<div class="t">Loja · ${fmt(m.respondido_em || m.created_at)}</div></div>`;
        return html;
      }).join('');
      body.scrollTop = body.scrollHeight;
    } catch (e) {
      body.innerHTML = '<p style="font-size:12px;color:#b91c1c;text-align:center">Não foi possível carregar o histórico.</p>';
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmt(iso) {
    try { return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  panel.querySelector('#lodja-chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('lc-nome').value.trim();
    const contacto = document.getElementById('lc-contacto').value.trim();
    const texto = document.getElementById('lc-texto').value.trim();
    if (!nome || !contacto || !texto) return;
    const isEmail = contacto.includes('@');
    const sess = (typeof LojaDB !== 'undefined' && LojaDB.getClienteSessao) ? LojaDB.getClienteSessao() : null;
    const btnS = e.target.querySelector('button[type=submit]');
    btnS.disabled = true;
    btnS.textContent = 'A enviar…';
    try {
      if (typeof initSupabase === 'function' && !window.supabaseClient) initSupabase();
      await LojaDB.init();
      await LojaDB.enviarMensagemChat({
        nome,
        email: isEmail ? contacto : (sess && sess.email) || '',
        telefone: !isEmail ? contacto : (sess && sess.telefone) || '',
        texto,
        conta_id: sess && sess.id
      });
      document.getElementById('lc-texto').value = '';
      await refreshThread();
      alert('Mensagem enviada! Responderemos em breve.');
    } catch (err) {
      alert('Erro: ' + (err.message || err));
    } finally {
      btnS.disabled = false;
      btnS.textContent = 'Enviar mensagem';
    }
  });
})();
