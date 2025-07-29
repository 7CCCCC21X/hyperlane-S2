export default async function handler(req, res) {
  const { address } = req.query;

  // 简单校验以免滥用
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }

  const url =
    'https://claim.hyperlane.foundation/api/check-eligibility?address=' + address;

  try {
    // 带上 referer 以模拟同站请求，避免被 Vercel Challenge 拦截
    const resp = await fetch(url, {
      headers: { referer: 'https://claim.hyperlane.foundation/' },
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'fetch_failed', detail: String(e) });
  }
}

/* 可选：如想在 Vercel Edge Runtime 运行，取消注释
export const config = { runtime: 'edge' };
*/
