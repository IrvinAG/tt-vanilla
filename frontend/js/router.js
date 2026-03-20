export class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/login';
    // Try exact match first
    if (this.routes[hash]) {
      this.routes[hash]();
      return;
    }
    // Try pattern match (e.g., /patients/:id)
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        handler(...match.slice(1));
        return;
      }
    }
    // 404
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <div class="icon">404</div>
        <p>Página no encontrada</p>
      </div>`;
  }

  navigate(path) {
    window.location.hash = path;
  }
}
