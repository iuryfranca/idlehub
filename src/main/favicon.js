'use strict';
// Icone automatico dos jogos: baixa o favicon que o proprio site informa, pela sessao da conta
// (o mesmo acesso que o painel ja faz). So HTTPS, no maximo 256 KB e 8 s. Nada sai da maquina:
// o arquivo vira um data URL, a interface o reduz para PNG 64x64 e ele fica so no idlehub.json.
const MAX_BYTES = 256 * 1024;
const TIMEOUT_MS = 8000;
const TYPES = new Set(['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp', 'image/gif', 'image/jpeg', 'image/avif', 'image/bmp']);

// Tipo aceito a partir do Content-Type; muitos servidores mandam .ico como octet-stream.
function iconType(contentType, url) {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (TYPES.has(type)) return type;
  if ((type === 'application/octet-stream' || type === '') && /\.ico$/i.test(new URL(url).pathname)) return 'image/x-icon';
  return null;
}

function httpsUrl(raw) {
  try {
    const u = new URL(String(raw));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch { return null; }
}

// Le o corpo ate o limite; passou disso, desiste (nao baixa o resto).
async function readCapped(res, max) {
  const len = Number(res.headers.get('content-length'));
  if (len > max) return null;
  const reader = res.body.getReader();
  const parts = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { reader.cancel().catch(() => {}); return null; }
    parts.push(Buffer.from(value));
  }
  return Buffer.concat(parts);
}

/** @param {{ fetch(url: string, init?: object): Promise<Response> }} ses sessao da conta */
async function fetchIcon(ses, urls) {
  const list = (Array.isArray(urls) ? urls : []).map(httpsUrl).filter(Boolean).slice(0, 4);
  for (const url of list) {
    try {
      const res = await ses.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' });
      if (!res.ok || !httpsUrl(res.url || url)) continue;
      const type = iconType(res.headers.get('content-type'), url);
      if (!type) continue;
      const buf = await readCapped(res, MAX_BYTES);
      if (buf && buf.length) return `data:${type};base64,${buf.toString('base64')}`;
    } catch { /* tenta o proximo */ }
  }
  return null;
}

module.exports = { fetchIcon, iconType, httpsUrl, readCapped, MAX_BYTES };
