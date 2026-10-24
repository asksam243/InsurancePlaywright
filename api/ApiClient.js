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
const statusOf = (o) => {
  const v = pick(o, ['status', 'applicationStatus', 'state']) ?? o?.data?.status;
  return typeof v === 'object' && v ? pick(v, ['name', 'label', 'value', 'status']) : v;
};

/**
 * Thin wrapper over Playwright's APIRequestContext.
 *  - Authentication: POST auth/login, then either a Bearer token (API_AUTH_MODE=bearer) or the session cookie
 *    (API_AUTH_MODE=session). The real mechanism is open question Q03 - switch the mode in .env, not in code.
 *  - Optional X-API-Key header from INSURANCE_API_KEY.
 */
class ApiClient {
  constructor(ctx) {
    this.ctx = ctx;
    this.token = null;
  }

  static async create(playwright, user) {
    // Content-Type is NOT set globally: Playwright adds application/json for object payloads and multipart for file uploads.
    const headers = { Accept: 'application/json' };
    if (env.apiKey && user) headers['X-API-Key'] = env.apiKey; // anonymous clients stay key-less on purpose (API-V02)
    const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl, extraHTTPHeaders: headers });
    const client = new ApiClient(ctx);
    if (user) {
      const res = await client.login(user);
      if (!res.ok() && env.apiAuthMode !== 'key') throw new Error(`API login failed for ${user.email}: HTTP ${res.status()} ${await res.text()}`);
    }
    return client;
  }

  async login(user) {
    const res = await this.ctx.post(ep.login, { data: { email: user.email, username: user.email, password: user.password } });
    if (res.ok()) {
      const body = await res.json().catch(() => ({}));
      this.token = pick(body, ['token', 'access_token', 'accessToken']) || pick(body?.data, ['token', 'access_token', 'accessToken']) || null;
    }
    return res;
  }

  authHeaders() {
    return this.token && env.apiAuthMode !== 'session' ? { Authorization: `Bearer ${this.token}` } : {};
  }

  req(method, path, opts = {}) {
    return this.ctx[method](path, { ...opts, headers: { ...this.authHeaders(), ...(opts.headers || {}) } });
  }
  get(path, opts) {
    return this.req('get', path, opts);
  }
  post(path, data, opts = {}) {
    return this.req('post', path, { ...opts, data });
  }
  put(path, data, opts = {}) {
    return this.req('put', path, { ...opts, data });
  }

  async json(res) {
    return res.json().catch(() => ({}));
  }

  /** All applications visible to the authenticated agent. */
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
