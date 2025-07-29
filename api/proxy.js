// /api/proxy.js
// 获取 _vcrcs cookie 并缓存 25 分钟
let cachedCookie = null;
let cookieExpires = 0;

async function getCheckpointCookie() {
  const now = Date.now();
  if (cachedCookie && now < cookieExpires) return cachedCookie; // 命中缓存

  const resp = await fetch('https://claim.hyperlane.foundation/', {
    headers: { referer: 'https://claim.hyperlane.foundation/' },
  });

  if (!resp.ok) throw new Error('challenge_homepage_' + resp.status);

  // 解析 set-cookie
  const setCookie = resp.headers.get('set-cookie') || '';
  const match = setCookie.match(/_vcrcs=[^;]+/);
  if (!match) throw new Error('no_cookie');

  cachedCookie  = match[0];           // 只拿 _vcrcs=****
  cookieExpires = now + 25 * 60 * 1000;
  return cachedCookie;
}

export default async function handler(req, res) {
  const { address } = req.query;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return res.status(400).json({ error: 'invalid_address' });
  }

  try {
    // 1) 确保有 cookie
    const cookie = await getCheckpointCookie();

    // 2) 拉接口
    const apiURL =
      'https://claim.hyperlane.foundation/api/check-eligibility?address=' +
      address;

    const resp = await fetch(apiURL, {
      headers: {
        referer: 'https://claim.hyperlane.foundation/',
        cookie,
        // 伪装成正常浏览器，降低再次被 challenge 的概率
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await resp.json();
      return res.status(resp.status).json(data);
    }

    // 仍被 challenge
    const raw = await resp.text();
    return res.status(resp.status).json({ challenge: true, raw });
  } catch (e) {
    return res
      .status(502)
      .json({ error: 'proxy_failed', detail: String(e).slice(0, 200) });
  }
}

/* 如需 Edge Runtime 可启用：
export const config = { runtime: 'edge' };
*/
