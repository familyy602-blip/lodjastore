/**
 * Chat LODJA — fluxo conversacional (estilo Betway)
 * 1) Boas-vindas automáticas
 * 2) Pede nome → contacto → em que pode ajudar
 * 3) Depois só thread de mensagens (sem formulário)
 */
(function () {
  if (window.__lodjaChat) return;
  window.__lodjaChat = true;

  const STORAGE_KEY = 'lv_chat_profile';
  const THREAD_KEY = 'lv_chat_thread_local';

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
    width:min(360px,calc(100vw - 24px));height:min(520px,72vh);
    background:#fff;border-radius:18px;box-shadow:0 20px 50px rgba(15,23,42,.25);
    display:none;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;
  }
  @media(min-width:901px){ #lodja-chat-panel{ bottom:90px; } }
  #lodja-chat-panel.open{ display:flex; }
  #lodja-chat-panel header{
    background:linear-gradient(135deg,#128c7e,#25d366);color:#fff;padding:12px 14px;
    display:flex;justify-content:space-between;align-items:center;flex-shrink:0;
  }
  #lodja-chat-panel header strong{ font-size:15px; display:block; }
  #lodja-chat-panel header small{ font-size:11px; opacity:.9; }
  #lodja-chat-panel header button{ background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1; }
  #lodja-chat-body{
    flex:1;overflow-y:auto;padding:12px;background:#ece5dd;min-height:0;
  }
  .lc-bubble{
    max-width:88%;padding:8px 12px;border-radius:10px;margin:6px 0;font-size:13px;line-height:1.4;
    word-break:break-word;
  }
  .lc-bubble.me{ background:#dcf8c6;margin-left:auto;border-bottom-right-radius:2px; }
  .lc-bubble.bot,.lc-bubble.admin{ background:#fff;margin-right:auto;border-bottom-left-radius:2px; }
  .lc-bubble .t{ font-size:10px;color:#667;margin-top:4px; }
  #lodja-chat-composer{
    padding:10px;background:#f0f2f5;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;
  }
  #lodja-chat-composer input{
    flex:1;border:1px solid #ddd;border-radius:22px;padding:10px 14px;font:inherit;font-size:14px;
  }
  #lodja-chat-composer button{
    background:#128c7e;color:#fff;border:none;border-radius:50%;width:42px;height:42px;
    font-size:18px;cursor:pointer;flex-shrink:0;
  }
  #lodja-chat-composer button:disabled{ opacity:.5; }
  .lc-typing{ font-size:12px;color:#64748b;padding:4px 8px; }
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
      <div>
        <strong id="lc-title">Chat LODJA</strong>
        <small id="lc-status">Online · Resposta da loja</small>
      </div>
      <button type="button" id="lodja-chat-close" aria-label="Fechar">×</button>
    </header>
    <div id="lodja-chat-body"></div>
    <div id="lodja-chat-composer">
      <input id="lc-input" type="text" placeholder="Escreva aqui…" autocomplete="off">
      <button type="button" id="lc-send" aria-label="Enviar">➤</button>
    </div>`;

  function mount() {
    if (document.body.classList.contains('admin-pro')) return;
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    initStoreName();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  /** Estado da conversa */
  let step = 'boot'; // boot | nome | contacto | ajuda | chat
  let profile = loadProfile();
  let localThread = loadThread();
  let sending = false;

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}; } catch (e) { return {}; }
  }
  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (e) {}
  }
  function loadThread() {
    try { return JSON.parse(localStorage.getItem(THREAD_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveThread() {
    try { localStorage.setItem(THREAD_KEY, JSON.stringify(localThread.slice(-80))); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmt(iso) {
    try {
      return new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  async function initStoreName() {
    try {
      if (typeof LojaDB !== 'undefined') {
        if (typeof initSupabase === 'function' && !window.supabaseClient) initSupabase();
        await LojaDB.init();
        const s = await LojaDB.getSettings();
        const name = s.siteName || 'LODJA Store';
        const el = document.getElementById('lc-title');
        if (el) el.textContent = name;
      }
    } catch (e) {}
  }

  function pushLocal(role, text) {
    const msg = { role, text, at: new Date().toISOString() };
    localThread.push(msg);
    saveThread();
    return msg;
  }

  function renderBody() {
    const body = document.getElementById('lodja-chat-body');
    if (!body) return;
    body.innerHTML = localThread.map(m => {
      const cls = m.role === 'me' ? 'me' : (m.role === 'admin' ? 'admin' : 'bot');
      return `<div class="lc-bubble ${cls}">${esc(m.text)}<div class="t">${fmt(m.at)}</div></div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;
  }

  function setPlaceholder() {
    const input = document.getElementById('lc-input');
    if (!input) return;
    if (step === 'nome') input.placeholder = 'O seu nome…';
    else if (step === 'contacto') input.placeholder = 'Email ou WhatsApp…';
    else if (step === 'ajuda') input.placeholder = 'Em que podemos ajudar?';
    else input.placeholder = 'Escreva a sua mensagem…';
  }

  async function startFlow() {
    await initStoreName();
    // Já tem perfil completo → só chat
    if (profile.nome && profile.contacto) {
      step = 'chat';
      if (!localThread.length) {
        pushLocal('bot', `Olá ${profile.nome}! 👋 Em que podemos ajudar hoje?`);
      }
      await mergeRemoteThread();
      renderBody();
      setPlaceholder();
      return;
    }
    // Sessão de conta
    try {
      const sess = typeof LojaDB !== 'undefined' && LojaDB.getClienteSessao && LojaDB.getClienteSessao();
      if (sess && (sess.nome || sess.email)) {
        profile.nome = profile.nome || sess.nome;
        profile.contacto = profile.contacto || sess.email || sess.telefone;
        profile.conta_id = sess.id;
        saveProfile();
      }
    } catch (e) {}

    if (profile.nome && profile.contacto) {
      step = 'chat';
      if (!localThread.length) pushLocal('bot', `Olá ${profile.nome}! Em que podemos ajudar?`);
      await mergeRemoteThread();
      renderBody();
      setPlaceholder();
      return;
    }

    // Novo visitante — onboarding
    if (!localThread.length) {
      const store = (document.getElementById('lc-title') || {}).textContent || 'LODJA Store';
      pushLocal('bot', `Olá! 👋 Bem-vindo ao atendimento da ${store}.`);
      pushLocal('bot', 'Para o ajudar melhor, qual é o seu nome?');
      step = 'nome';
    } else {
      // retomar step a partir do perfil parcial
      if (!profile.nome) step = 'nome';
      else if (!profile.contacto) step = 'contacto';
      else step = 'ajuda';
    }
    renderBody();
    setPlaceholder();
  }

  async function mergeRemoteThread() {
    if (!profile.contacto || typeof LojaDB === 'undefined') return;
    try {
      await LojaDB.init();
      const isEmail = String(profile.contacto).includes('@');
      const email = isEmail ? profile.contacto : (profile.email || '');
      const tel = !isEmail ? String(profile.contacto).replace(/\D/g, '') : (profile.telefone || '');
      const list = await LojaDB.getMensagensCliente(email, tel);
      list.forEach(m => {
        const idKey = 'srv_' + m.id;
        if (localThread.some(x => x.sid === idKey)) return;
        localThread.push({ role: 'me', text: m.mensagem, at: m.created_at, sid: idKey });
        if (m.resposta) {
          localThread.push({ role: 'admin', text: m.resposta, at: m.respondido_em || m.created_at, sid: idKey + '_r' });
        }
      });
      localThread.sort((a, b) => new Date(a.at) - new Date(b.at));
      saveThread();
    } catch (e) {}
  }

  function botDelay(text, ms) {
    return new Promise(resolve => {
      const body = document.getElementById('lodja-chat-body');
      const tip = document.createElement('div');
      tip.className = 'lc-typing';
      tip.textContent = 'A escrever…';
      if (body) { body.appendChild(tip); body.scrollTop = body.scrollHeight; }
      setTimeout(() => {
        if (tip.parentNode) tip.remove();
        pushLocal('bot', text);
        renderBody();
        resolve();
      }, ms || 600);
    });
  }

  async function handleUserText(raw) {
    const text = String(raw || '').trim();
    if (!text || sending) return;
    const input = document.getElementById('lc-input');
    if (input) input.value = '';

    pushLocal('me', text);
    renderBody();

    if (step === 'nome') {
      profile.nome = text.slice(0, 80);
      saveProfile();
      step = 'contacto';
      setPlaceholder();
      await botDelay(`Prazer, ${profile.nome}! Qual é o seu email ou número de WhatsApp?`, 700);
      return;
    }

    if (step === 'contacto') {
      profile.contacto = text.slice(0, 120);
      if (text.includes('@')) profile.email = text.toLowerCase();
      else profile.telefone = text.replace(/\D/g, '');
      saveProfile();
      try {
        localStorage.setItem('lv_chat_email', profile.email || '');
        localStorage.setItem('lv_chat_tel', profile.telefone || '');
      } catch (e) {}
      step = 'ajuda';
      setPlaceholder();
      await botDelay('Obrigado! Em que podemos ajudar?', 700);
      return;
    }

    if (step === 'ajuda' || step === 'chat') {
      step = 'chat';
      setPlaceholder();
      // Gravar mensagem no backend
      sending = true;
      try {
        if (typeof initSupabase === 'function' && !window.supabaseClient) initSupabase();
        if (typeof LojaDB !== 'undefined') {
          await LojaDB.init();
          const isEmail = String(profile.contacto || '').includes('@');
          await LojaDB.enviarMensagemChat({
            nome: profile.nome || 'Cliente',
            email: isEmail ? profile.contacto : (profile.email || ''),
            telefone: !isEmail ? String(profile.contacto || '').replace(/\D/g, '') : (profile.telefone || ''),
            texto: text,
            conta_id: profile.conta_id || null
          });
        }
        await botDelay('Mensagem recebida ✅ A equipa vai responder em breve. Pode continuar a escrever aqui.', 800);
      } catch (err) {
        await botDelay('Não foi possível enviar agora. Tente de novo ou contacte-nos pelo WhatsApp.', 600);
      } finally {
        sending = false;
      }
    }
  }

  function open() {
    panel.classList.add('open');
    startFlow();
  }
  function close() { panel.classList.remove('open'); }

  btn.addEventListener('click', () => {
    if (panel.classList.contains('open')) close();
    else open();
  });
  panel.querySelector('#lodja-chat-close').addEventListener('click', close);

  document.getElementById('lc-send').addEventListener('click', () => {
    handleUserText(document.getElementById('lc-input').value);
  });
  document.getElementById('lc-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUserText(document.getElementById('lc-input').value);
    }
  });

  // Poll respostas do admin
  async function pollClientNotifs() {
    try {
      if (typeof LojaDB === 'undefined') return;
      await LojaDB.init();
      const email = profile.email || localStorage.getItem('lv_chat_email') || '';
      const tel = profile.telefone || localStorage.getItem('lv_chat_tel') || '';
      if (!email && !tel && !profile.contacto) return;

      const isEmail = String(profile.contacto || email).includes('@');
      const em = isEmail ? (profile.contacto || email) : email;
      const te = !isEmail ? String(profile.contacto || tel).replace(/\D/g, '') : tel;

      const list = await LojaDB.getMensagensCliente(em, te);
      let added = false;
      list.forEach(m => {
        if (m.resposta) {
          const sid = 'srv_' + m.id + '_r';
          if (!localThread.some(x => x.sid === sid)) {
            localThread.push({ role: 'admin', text: m.resposta, at: m.respondido_em || m.created_at, sid });
            added = true;
          }
        }
      });
      if (added) {
        localThread.sort((a, b) => new Date(a.at) - new Date(b.at));
        saveThread();
        if (panel.classList.contains('open')) renderBody();
        btn.innerHTML = '💬<span style="position:absolute;top:2px;right:2px;background:#ef4444;color:#fff;font-size:10px;min-width:16px;height:16px;border-radius:99px;display:grid;place-items:center">1</span>';
      }

      const notifs = await LojaDB.getNotificacoesCliente({
        email: em,
        telefone: te,
        conta_id: profile.conta_id
      });
      const unread = notifs.filter(n => n.estado === 'enviada' || n.estado === 'pendente');
      if (unread.length && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const lastId = sessionStorage.getItem('lv_last_ntf');
        if (unread[0].id !== lastId) {
          sessionStorage.setItem('lv_last_ntf', unread[0].id);
          try { new Notification(unread[0].titulo || 'LODJA Store', { body: unread[0].corpo || '' }); } catch (e) {}
        }
      } else if (unread.length && typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {}
  }
  setInterval(pollClientNotifs, 12000);
  setTimeout(pollClientNotifs, 4000);
})();
