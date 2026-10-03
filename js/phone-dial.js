/**
 * Indicativo com bandeira (imagem CDN) — funciona no Windows/Chrome
 * onde emoji de bandeira no <select> nativo falha.
 */
(function (w) {
  var LIST = [
    { d: '258', c: 'mz', n: 'Moçambique' },
    { d: '27',  c: 'za', n: 'África do Sul' },
    { d: '351', c: 'pt', n: 'Portugal' },
    { d: '55',  c: 'br', n: 'Brasil' },
    { d: '244', c: 'ao', n: 'Angola' },
    { d: '238', c: 'cv', n: 'Cabo Verde' },
    { d: '245', c: 'gw', n: 'Guiné-Bissau' },
    { d: '239', c: 'st', n: 'São Tomé' },
    { d: '1',   c: 'us', n: 'EUA/Canadá' },
    { d: '44',  c: 'gb', n: 'Reino Unido' },
    { d: '33',  c: 'fr', n: 'França' },
    { d: '49',  c: 'de', n: 'Alemanha' },
    { d: '34',  c: 'es', n: 'Espanha' },
    { d: '39',  c: 'it', n: 'Itália' },
    { d: '91',  c: 'in', n: 'Índia' },
    { d: '86',  c: 'cn', n: 'China' },
    { d: '234', c: 'ng', n: 'Nigéria' },
    { d: '254', c: 'ke', n: 'Quénia' },
    { d: '255', c: 'tz', n: 'Tanzânia' },
    { d: '263', c: 'zw', n: 'Zimbabwe' },
    { d: '265', c: 'mw', n: 'Malawi' },
    { d: '260', c: 'zm', n: 'Zâmbia' },
    { d: '243', c: 'cd', n: 'RD Congo' },
    { d: '221', c: 'sn', n: 'Senegal' },
    { d: '225', c: 'ci', n: 'Costa do Marfim' },
    { d: '233', c: 'gh', n: 'Gana' },
    { d: '971', c: 'ae', n: 'EAU' }
  ];

  function flagUrl(code) {
    return 'https://flagcdn.com/w40/' + code + '.png';
  }

  function find(d) {
    d = String(d || '258');
    for (var i = 0; i < LIST.length; i++) if (LIST[i].d === d) return LIST[i];
    return LIST[0];
  }

  function cssOnce() {
    if (document.getElementById('phone-dial-css')) return;
    var s = document.createElement('style');
    s.id = 'phone-dial-css';
    s.textContent = [
      '.pd-wrap{position:relative;width:168px;flex-shrink:0;font-family:inherit}',
      '.pd-btn{width:100%;display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer;font-size:14px;font-weight:600;color:#0f172a;box-sizing:border-box;min-height:44px}',
      '.pd-btn:hover{border-color:#818cf8}',
      '.pd-btn img,.pd-item img{width:22px;height:16px;object-fit:cover;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}',
      '.pd-btn .pd-code{flex:1;text-align:left}',
      '.pd-btn .pd-caret{opacity:.5;font-size:10px}',
      '.pd-list{display:none;position:absolute;z-index:9999;left:0;right:0;top:calc(100% + 4px);max-height:260px;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 28px rgba(15,23,42,.15)}',
      '.pd-wrap.open .pd-list{display:block}',
      '.pd-item{display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;border:0;background:transparent;cursor:pointer;font-size:13px;text-align:left;color:#0f172a}',
      '.pd-item:hover,.pd-item.active{background:#eef2ff}',
      '.pd-item span{flex:1}',
      '.pd-item small{color:#64748b;font-weight:600}'
    ].join('');
    document.head.appendChild(s);
  }

  function enhance(sel) {
    if (!sel || sel._pdDone) return;
    sel._pdDone = true;
    cssOnce();

    // Preencher options limpas (sem emoji)
    sel.innerHTML = LIST.map(function (x) {
      return '<option value="' + x.d + '">+' + x.d + ' ' + x.n + '</option>';
    }).join('');
    if (!sel.value) sel.value = '258';
    sel.style.position = 'absolute';
    sel.style.opacity = '0';
    sel.style.pointerEvents = 'none';
    sel.style.width = '1px';
    sel.style.height = '1px';

    var wrap = document.createElement('div');
    wrap.className = 'pd-wrap';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pd-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    var list = document.createElement('div');
    list.className = 'pd-list';
    list.setAttribute('role', 'listbox');

    function paintBtn() {
      var x = find(sel.value);
      btn.innerHTML = '<img src="' + flagUrl(x.c) + '" alt="" width="22" height="16" loading="lazy">' +
        '<span class="pd-code">+' + x.d + '</span><span class="pd-caret">▼</span>';
    }

    LIST.forEach(function (x) {
      var it = document.createElement('button');
      it.type = 'button';
      it.className = 'pd-item' + (x.d === sel.value ? ' active' : '');
      it.innerHTML = '<img src="' + flagUrl(x.c) + '" alt="" width="22" height="16" loading="lazy">' +
        '<span>' + x.n + '</span><small>+' + x.d + '</small>';
      it.onclick = function (e) {
        e.preventDefault();
        sel.value = x.d;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        paintBtn();
        wrap.classList.remove('open');
        list.querySelectorAll('.pd-item').forEach(function (el) {
          el.classList.toggle('active', el === it);
        });
      };
      list.appendChild(it);
    });

    btn.onclick = function (e) {
      e.preventDefault();
      wrap.classList.toggle('open');
    };
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });

    paintBtn();
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(btn);
    wrap.appendChild(list);
    wrap.appendChild(sel);
  }

  function enhanceAll() {
    document.querySelectorAll('select#dial, select#rDial, select#fDial, select.phone-dial').forEach(enhance);
  }

  w.PhoneDial = { list: LIST, enhance: enhance, enhanceAll: enhanceAll, find: find };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAll);
  } else {
    enhanceAll();
  }
  // contas que preenchem dials depois
  setTimeout(enhanceAll, 400);
  setTimeout(enhanceAll, 1200);
})(window);
