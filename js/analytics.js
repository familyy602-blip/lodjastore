/**
 * Tracking de visitas + branding imediato a partir do localStorage
 */
(function () {
  // Branding síncrono (evita flash "LODJA Store" e logo antigo)
  try {
    var s = JSON.parse(localStorage.getItem('lv_settings') || 'null');
    if (s) {
      var name = s.siteName;
      var logo = s.logoUrl;
      if (name) {
        document.querySelectorAll('#brandName, #footerName').forEach(function (el) {
          if (el) el.textContent = name;
        });
        if (document.title === 'LODJA Store' || !document.title) document.title = name;
      }
      if (logo) {
        var src = logo;
        if (logo.indexOf('data:') !== 0 && logo.indexOf('http') !== 0 && logo.indexOf('/') !== 0) {
          src = (location.pathname.indexOf('/lodjastore') === 0 ? '/lodjastore/' : '') + logo;
        }
        document.querySelectorAll('#brandLogo').forEach(function (el) {
          if (el) {
            el.style.display = '';
            el.src = src;
          }
        });
      }
    }
  } catch (e) {}

  // Logo na home: não recarregar a página se já estiver no index
  document.addEventListener('DOMContentLoaded', function () {
    var logoLink = document.querySelector('a.logo');
    if (logoLink) {
      logoLink.addEventListener('click', function (e) {
        var path = (location.pathname || '').toLowerCase();
        if (path.endsWith('/') || path.endsWith('index.html') || path.endsWith('/lodjastore')) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  });

  // Visita
  window.LodjaAnalytics = {
    track: async function () {
      try {
        if (typeof initSupabase === 'function' && !window.supabaseClient) initSupabase();
        if (typeof LojaDB !== 'undefined') {
          await LojaDB.init();
          await LojaDB.registrarVisita(location.pathname + location.search);
        }
      } catch (e) {}
    }
  };
  // registar após load
  if (document.readyState === 'complete') {
    setTimeout(function () { window.LodjaAnalytics && LodjaAnalytics.track(); }, 800);
  } else {
    window.addEventListener('load', function () {
      setTimeout(function () { window.LodjaAnalytics && LodjaAnalytics.track(); }, 800);
    });
  }
})();
