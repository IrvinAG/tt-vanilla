export const auth = {
  setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  },

  getRole() {
    const u = this.getUser();
    return u ? u.rol : null;
  },

  getName() {
    const u = this.getUser();
    return u ? u.nombre_completo : '';
  },
};
