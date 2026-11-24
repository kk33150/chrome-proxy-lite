const assert = require('node:assert/strict');
const { parseProxy } = require('../proxy-core.js');

let passed = 0;

function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`  PASS  ${name}`);
}

ok('解析 PROXY 地址', () => {
  const result = parseProxy('PROXY 1.1.1.1: 1000');
  assert.equal(result.ok, true);
  assert.equal(result.scheme, 'http');
  assert.equal(result.host, '1.1.1.1');
  assert.equal(result.port, 1000);
});

ok('解析 SOCKS5 地址并忽略大小写与多余空格', () => {
  const result = parseProxy('  socks5   127.0.0.1:1080  ');
  assert.equal(result.ok, true);
  assert.equal(result.scheme, 'socks5');
  assert.equal(result.port, 1080);
});

ok('支持域名和 IPv6 方括号写法', () => {
  const domain = parseProxy('PROXY proxy.example.com:8080');
  assert.equal(domain.ok, true);
  assert.equal(domain.host, 'proxy.example.com');

  const ipv6 = parseProxy('SOCKS5 [::1]:1080');
  assert.equal(ipv6.ok, true);
  assert.equal(ipv6.host, '::1');
  assert.equal(ipv6.port, 1080);
});

ok('拒绝无效输入', () => {
  const cases = [
    '',
    '127.0.0.1:7890',
    'PROXY 127.0.0.1',
    'PROXY 127.0.0.1:abc',
    'PROXY 127.0.0.1:0',
    'PROXY 127.0.0.1:65536',
    'HTTPS 127.0.0.1:443',
    'PROXY 127.0.0.1:7890 extra'
  ];
  for (const item of cases) {
    assert.equal(parseProxy(item).ok, false, `应当拒绝：${item}`);
  }
});

console.log(`\n${passed} 项测试全部通过`);
