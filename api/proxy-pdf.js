module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const pdfUrl = req.query.url;
  if (!pdfUrl) {
    res.status(400).json({ error: 'Missing url query param' });
    return;
  }
  try {
    const response = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch PDF: ' + response.statusText });
      return;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  } catch (e) {
    console.error('PDF proxy error:', e);
    res.status(500).json({ error: 'Proxy error: ' + e.message });
  }
};
