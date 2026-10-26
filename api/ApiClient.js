const env = require('../config/env');
const ep = require('../config/endpoints');

/** Pulls the array out of {data:[...]}, {items:[...]}, {applications:[...]} ... or a bare array. */
function asList(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    for (const k of ['data', 'items', 'results', 'applications', 'products', 'riders', 'content']) {
      if (Array.isArray(body[k])) return body[k];
    }
  }
  return [];
}

const pick = (obj, keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null);
const idOf = (o) => pick(o, ['id', 'applicationId', 'application_id', 'productId', 'riderId', 'uuid']);

/**
 * Application status from a list item OR a response envelope ({ status: 'success', data: { application_status: 'DRAFT' } }).
 * The envelope's own `status` ("success"/"error") is NOT an application status and is ignored.
 */
const statusOf = (o) => {
  const inner = o && typeof o === 'object' && o.data && typeof o.data === 'object' && !Array.isArray(o.data) ? o.data : o;
  const v = pick(inner, ['application_status', 'applicationStatus', 'status', 'state']);
  const value = typeof v === 'object' && v ? pick(v, ['name', 'label', 'value', 'status']) : v;
  return value === 'success' || value === 'error' ? undefined : value;
};

/**
 * Thin wrapper over Playwright's APIRequestContext, matching the REAL contract (third project's API client):
 *  - Auth is a STATIC X-API-Key header; there is no per-user token (API_AUTH_MODE=key, the default).
 *  - The acting agent is chosen with `agent_email` (query on GET, body on POST). If it is forgotten the API silently acts as
 *    learner001, so this client adds it to EVERY call for the user it was created with.
 *  - Redirects are never followed, so a 302 to /login cannot masquerade as 200.
 *  - A client created WITHOUT a user sends no key at all (the "anonymous" client used by API-V02).
 */
class ApiClient {
  constructor(ctx, agentEmail = null) {
    this.ctx = ctx;
    this.agentEmail = agentEmail;
    this.token = null;
  }

  static async create(playwright, user) {
    // Content-Type is NOT set globally: Playwright adds application/json for object payloads and multipart for file uploads.
    const headers = { Accept: 'application/json' };
    if (env.apiKey && user) headers['X-API-Key'] = env.apiKey; // anonymous clients stay key-less on purpose (API-V02)
    const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl, extraHTTPHeaders: headers });
    const client = new ApiClient(ctx, user ? user.email : null);
    // key mode (default): nothing to log in to. bearer / session modes still call POST login.
    if (user && env.apiAuthMode !== 'key') {
      const res = await client.login(user);
      if (!res.ok()) throw new Error(`API login failed for ${user.email}: HTTP ${res.status()} ${await res.text()}`);
    }
    return client;
  }

  async login(user) {
    const res = await this.ctx.post(ep.login, { data: { email: user.email, username: user.email, password: user.password }, maxRedirects: 0 });
    if (res.ok()) {
      const body = await res.json().catch(() => ({}));
      this.token = pick(body, ['token', 'access_token', 'accessToken']) || pick(body?.data, ['token', 'access_token', 'accessToken']) || null;
    }
    return res;
  }

  authHeaders() {
    return this.token && env.apiAuthMode === 'bearer' ? { Authorization: `Bearer ${this.token}` } : {};
  }

  req(method, path, opts = {}) {
    return this.ctx[method](path, { maxRedirects: 0, ...opts, headers: { ...this.authHeaders(), ...(opts.headers || {}) } });
  }

  get(path, opts = {}) {
    const params = { ...(this.agentEmail ? { agent_email: this.agentEmail } : {}), ...(opts.params || {}) };
    return this.req('get', path, { ...opts, params });
  }

  post(path, data, opts = {}) {
    const withAgent = (obj) => ({ ...(this.agentEmail ? { agent_email: this.agentEmail } : {}), ...(obj || {}) });
    if (opts.multipart) return this.req('post', path, { ...opts, multipart: withAgent(opts.multipart) });
    return this.req('post', path, { ...opts, data: withAgent(data) });
  }

  put(path, data, opts = {}) {
    return this.req('put', path, { ...opts, data: { ...(this.agentEmail ? { agent_email: this.agentEmail } : {}), ...(data || {}) } });
  }

  async json(res) {
    return res.json().catch(() => ({}));
  }

  /** All applications visible to the acting agent. */
  async listApplications() {
    const res = await this.get(ep.applications);
    return { res, items: asList(await this.json(res)) };
  }

  /** Id of the first application (optionally the first one with a given status), or null. */
  async firstApplicationId(status) {
    const { items } = await this.listApplications();
    const hit = items.find((a) => !status || String(statusOf(a) || '').toLowerCase() === status.toLowerCase());
    return hit ? idOf(hit) : null;
  }

  async dispose() {
    await this.ctx.dispose();
  }
}

module.exports = { ApiClient, asList, idOf, statusOf };
