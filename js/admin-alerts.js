/**
 * Alertas e pop-up de notificações no painel admin
 */
window.AdminAlerts = {
  async refreshBadge() {
    try {
      if (!window.LojaDB || !LojaDB.countNotificacoesNaoLidas) return 0;
      const n = await LojaDB.countNotificacoesNaoLidas();
      document.querySelectorAll('#ntfBadge, .adm-notif-badge').forEach(b => {
        if (n > 0) {
          b.style.display = 'grid';
          b.textContent = n > 99 ? '99+' : String(n);
        } else {
          b.style.display = 'none';
        }
      });
      return n;
    } catch (e) { return 0; }
  },

  ensureModal() {
    if (document.getElementById('admAlertModal')) return;
    const el = document.createElement('div');
    el.id = 'admAlertModal';
    el.style.cssText = 'display:none;position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.5);align-items:center;justify-content:center;padding:16px';
    el.innerHTML = `
      <div style="background:#fff;border-radius:18px;max-width:400px;width:100%;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.25)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:28px">🔔</span>
          <strong style="font-size:17px" id="admAlertTitle">Notificações</strong>
        </div>
        <div id="admAlertBody" style="font-size:14px;color:#334155;line-height:1.5;max-height:240px;overflow-y:auto"></div>
        <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
          <a href="notificacoes.html" style="flex:1;text-align:center;padding:12px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;font-weight:700;text-decoration:none">Ver caixa de notificações</a>
          <button type="button" id="admAlertClose" style="padding:12px 16px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-weight:600;cursor:pointer">Fechar</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) el.style.display = 'none'; });
    document.getElementById('admAlertClose').onclick = () => { el.style.display = 'none'; };
  },

  showPopup(title, htmlBody) {
    this.ensureModal();
    document.getElementById('admAlertTitle').textContent = title;
    document.getElementById('admAlertBody').innerHTML = htmlBody;
    document.getElementById('admAlertModal').style.display = 'flex';
  },

  /** Ao entrar no admin: alerta se houver notificações não lidas (ex.: novos pedidos) */
  async onAdminEnter() {
    try {
      await this.refreshBadge();
      const list = await LojaDB.getNotificacoes({ onlyUnread: true });
      if (!list || !list.length) return;

      // evita spam: no máximo 1 pop-up por sessão a cada entrada (mas actualiza se chegarem novas)
      const ids = list.map(n => n.id).sort().join(',');
      if (sessionStorage.getItem('lv_alert_shown_ids') === ids) return;
      sessionStorage.setItem('lv_alert_shown_ids', ids);

      const pedidos = list.filter(n => n.tipo === 'pedido');
      let title = 'Tens notificações novas';
      let body = '';

      if (pedidos.length === 1) {
        const n = pedidos[0];
        title = 'Tens um novo pedido';
        body = '<p style="margin:0 0 10px"><strong>' + this.esc(n.titulo) + '</strong></p>' +
          '<p style="margin:0;color:#64748b">' + this.esc(n.mensagem) + '</p>' +
          '<p style="margin:12px 0 0;font-size:13px;color:#4f46e5">Verifica a caixa de notificações.</p>';
      } else if (pedidos.length > 1) {
        title = 'Tens ' + pedidos.length + ' novos pedidos';
        body = '<p style="margin:0 0 10px">Recebeste <strong>' + pedidos.length + '</strong> notificações de pedidos.</p>' +
          '<ul style="margin:0;padding-left:18px;color:#64748b">' +
          pedidos.slice(0, 5).map(n => '<li style="margin-bottom:6px">' + this.esc(n.mensagem || n.titulo) + '</li>').join('') +
          '</ul><p style="margin:12px 0 0;font-size:13px;color:#4f46e5">Verifica a caixa de notificações.</p>';
      } else {
        title = 'Tens ' + list.length + ' notificação(ões) nova(s)';
        body = '<ul style="margin:0;padding-left:18px;color:#64748b">' +
          list.slice(0, 5).map(n => '<li style="margin-bottom:6px"><strong>' + this.esc(n.titulo) + '</strong> — ' + this.esc(n.mensagem) + '</li>').join('') +
          '</ul>';
      }
      this.showPopup(title, body);
    } catch (e) {
      console.warn('AdminAlerts', e);
    }
  },

  esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
