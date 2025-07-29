// /api/proxy.js
export default async function handler(req, res) {
  // 1) 参数校验
  const { address } = req.query;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return res.status(400).json({ error: 'invalid_address' });
  }

  const url =
    'https://claim.hyperlane.foundation/api/check-eligibility?address=' + address;

  try {
    // 2) 发起请求，尽量模拟浏览器
    const resp = await fetch(url, {
      headers: {
        referer: 'https://claim.hyperlane.foundation/',
        'user-agent':
          'Mozilla/5.0 (compatible; HyperlaneBatch/1.0; +https://example.com)',
      },
      redirect: 'follow',
    });

    const ct = resp.headers.get('content-type') || '';
    let payload;

    if (ct.includes('application/json')) {
      // 正常 JSON
      payload = await resp.json();
    } else {
      // 被 challenge 或其他错误，返回原始文本
      payload = { raw: await resp.text() };
    }

    res.status(resp.status).json(payload);
  } catch (e) {
    res.status(500).json({ error: 'proxy_fetch_failed', detail: String(e) });
  }
}

/* 若想强制在 Vercel Edge Runtime 运行可解开：
export const config = { runtime: 'edge' };
*/
