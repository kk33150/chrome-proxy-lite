const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const store = {};
const calls = [];

const context = {
  console,
  Date,
  Math,
  JSON,
  importScripts() {},
  chrome: {
    storage: {
      local: {
        async get(defaults) {
          const result = {};
          for (const key of Object.keys(defaults)) {
            result[key] = key in store ? store[key] : defaults[key];
          }
          return result;
        },
        async set(data) {
          Object.assign(store, data);
        }
      }
    },
    proxy: {
      settings: {
        async set(config) {
          calls.push({ type: 'set', value: JSON.parse(JSON.stringify(config.value)) });
        },
        async clear() {
          calls.push({ type: 'clear' });
        }
      }
    },
    action: {
      async setIcon() {},
      async setBadgeBackgroundColor() {},
      async setBadgeText() {},
      async setTitle(info) {
        calls.push({ type: 'title', text: info.title });
      }
    },
    runtime: {
      onMessage: { addListener(fn) { context.onMessage = fn; } },
      onInstalled: { addListener(fn) { context.onInstalled = fn; } },
      onStartup: { addListener() {} }
    }
  }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'proxy-core.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'background.js'), 'utf8'), context);

function send(message) {
  return new Promise((resolve) => context.onMessage(message, {}, resolve));
}

function lastProxyCall() {
  return [...calls].reverse().find((call) => call.type === 'set' || call.type === 'clear');
}

(async () => {
  let response = await send({ type: 'getState' });
  assert.equal(response.state.proxies.length, 0);
  assert.equal(response.state.enabled, false);

  response = await send({ type: 'add', raw: 'PROXY 127.0.0.1:7890' });
  assert.equal(response.ok, true);
  assert.equal(response.state.proxies.length, 1);
  assert.equal(response.state.activeId, response.state.proxies[0].id);
  response = await send({ type: 'toggle', enabled: true });
  assert.equal(response.ok, true);
  assert.equal(lastProxyCall().value.rules.singleProxy.scheme, 'http');
  assert.equal(lastProxyCall().value.rules.singleProxy.host, '127.0.0.1');
  assert.equal(lastProxyCall().value.rules.singleProxy.port, 7890);

  response = await send({ type: 'toggle', enabled: false });
  assert.equal(response.ok, true);
  assert.equal(lastProxyCall().type, 'clear');
  assert.equal(calls.filter((c) => c.type === 'title').pop().text, '极简浏览器代理：已关闭');

  response = await send({ type: 'toggle', enabled: true });
  assert.equal(response.ok, true);
  assert.equal(lastProxyCall().type, 'set');

  response = await send({ type: 'add', raw: 'SOCKS5 127.0.0.1:1080' });
  const socksId = response.state.proxies[1].id;
  assert.equal(response.state.activeId, response.state.proxies[0].id);

  response = await send({ type: 'select', id: socksId });
  assert.equal(response.ok, true);
  assert.equal(lastProxyCall().value.rules.singleProxy.scheme, 'socks5');
  assert.equal(lastProxyCall().value.rules.singleProxy.port, 1080);

  response = await send({ type: 'remove', id: response.state.activeId });
  assert.equal(response.ok, true);
  assert.equal(lastProxyCall().value.rules.singleProxy.scheme, 'http');

  response = await send({ type: 'remove', id: response.state.proxies[0].id });
  assert.equal(response.ok, true);
  assert.equal(response.state.proxies.length, 0);
  assert.equal(response.state.enabled, false);
  assert.equal(lastProxyCall().type, 'clear');

  response = await send({ type: 'toggle', enabled: true });
  assert.equal(response.ok, false);
  assert.match(response.error, /请先添加/);

  console.log('  8 项后台状态流转测试全部通过');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
