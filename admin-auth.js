const AdminAuth = {
  async expectedPassword() {
    try {
      if (window.LojaDB) {
        const c = await LojaDB.getSettings();
        if (c && c.adminPassword) return c.adminPassword;
      }
    } catch (e) {}
    return localStorage.getItem('lv_admin_pass') || 'admin123';
  },
  isLogged() {
    return sessionStorage.getItem('lv_admin') === 'true';
  },
  async login(pass) {
    const expected = await this.expectedPassword();
    const ok = pass === expected;
    if (ok) sessionStorage.setItem('lv_admin', 'true');
    return ok;
  },
  logout() {
    sessionStorage.removeItem('lv_admin');
    location.href = 'login.html';
  },
  require() {
    if (!this.isLogged()) {
      location.href = 'login.html';
      return false;
    }
    return true;
  }
};
