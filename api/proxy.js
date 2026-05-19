module.exports = async function handler(req, res) {
  const path = (req.url || '').replace(/^\//, '');
  const match = path.match(/^(https?|wss?)\/(.+)/);
  if (!match) {
    return res.status(400).json({ error: 'Format: /{protocol}/{host}/{path}' });
  }
  const targetUrl = match[1] + '://' + match[2];
  try {
    const headers = Object.assign({}, req.headers);
    delete headers.host;
    delete headers['x-forwarded-for'];
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });
    res.status(response.status);
    response.headers.forEach(function(v, k) {
      if (!['transfer-encoding', 'content-encoding'].includes(k)) {
        res.setHeader(k, v);
      }
    });
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
