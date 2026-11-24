function parseProxy(raw) {
  const fail = (error) => ({ ok: false, error });

  if (typeof raw !== 'string') return fail('请输入代理地址');

  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return fail('请输入代理地址');

  const parts = text.split(' ');
  if (parts.length < 2) {
    return fail('格式应为：PROXY 127.0.0.1:7890');
  }

  const token = parts[0].toUpperCase();
  const schemes = {
    PROXY: 'http',
    HTTP: 'http',
    SOCKS: 'socks5',
    SOCKS5: 'socks5',
    SOCKS4: 'socks4'
  };
  const scheme = schemes[token];
  if (!scheme) return fail('协议只支持 PROXY / SOCKS5');

  const endpoint = parts.slice(1).join('');
  let host;
  let portText;

  if (endpoint.startsWith('[')) {
    const close = endpoint.indexOf(']');
    if (close < 0 || endpoint[close + 1] !== ':') {
      return fail('地址格式不对，示例：PROXY 127.0.0.1:7890');
    }
    host = endpoint.slice(1, close);
    portText = endpoint.slice(close + 2);
  } else {
    const split = endpoint.lastIndexOf(':');
    if (split <= 0) {
      return fail('地址格式不对，示例：PROXY 127.0.0.1:7890');
    }
    host = endpoint.slice(0, split);
    portText = endpoint.slice(split + 1);
  }

  if (!host || !/^\d+$/.test(portText)) {
    return fail('端口必须是数字，示例：PROXY 127.0.0.1:7890');
  }

  const port = Number(portText);
  if (port < 1 || port > 65535) {
    return fail('端口需要在 1 到 65535 之间');
  }

  return {
    ok: true,
    scheme,
    host,
    port,
    label: `${token} ${host}:${port}`,
    key: `${scheme}://${host}:${port}`
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseProxy };
}
