importScripts('proxy-core.js');

const DEFAULT_STATE = {
  proxies: [],
  activeId: null,
  enabled: false
};

const ICON_SIZES = [16, 32, 48, 128];

async function getState() {
  const data = await chrome.storage.local.get(DEFAULT_STATE);
  return {
    ...DEFAULT_STATE,
    ...data,
    proxies: Array.isArray(data.proxies) ? data.proxies : []
  };
}

async function saveState(state) {
  await chrome.storage.local.set(state);
  return state;
}

function getActiveProxy(state) {
  return state.proxies.find((item) => item.id === state.activeId) || null;
}

async function paintIcon(on) {
  const path = {};
  for (const size of ICON_SIZES) {
    path[size] = on ? `icons/icon${size}-on.png` : `icons/icon${size}.png`;
  }

  await chrome.action.setIcon({ path });
  await chrome.action.setBadgeBackgroundColor({ color: on ? '#1D9E75' : '#888780' });
  await chrome.action.setBadgeText({ text: on ? '✓' : '' });
  await chrome.action.setTitle({
    title: on ? '极简浏览器代理：已开启' : '极简浏览器代理：已关闭'
  });
}

async function apply(state) {
  const proxy = state.enabled ? getActiveProxy(state) : null;

  if (!proxy) {
    await chrome.proxy.settings.clear({ scope: 'regular' });
    await paintIcon(false);
    return { ok: true, enabled: false };
  }

  const value = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: proxy.scheme,
        host: proxy.host,
        port: proxy.port
      },
      bypassList: ['localhost', '127.0.0.1', '[::1]', '<local>']
    }
  };

  await chrome.proxy.settings.set({ value, scope: 'regular' });
  await paintIcon(true);
  return { ok: true, enabled: true, label: proxy.label };
}

function makeId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function handleMessage(message) {
  const state = await getState();

  switch (message && message.type) {
    case 'getState':
      return { ok: true, state };

    case 'add': {
      const parsed = parseProxy(message.raw);
      if (!parsed.ok) return parsed;

      if (state.proxies.some((item) => item.key === parsed.key)) {
        return { ok: false, error: '这个地址已经添加过了' };
      }

      const item = {
        id: makeId(),
        scheme: parsed.scheme,
        host: parsed.host,
        port: parsed.port,
        label: parsed.label,
        key: parsed.key
      };

      const next = {
        ...state,
        proxies: [...state.proxies, item],
        activeId: state.activeId || item.id
      };

      await saveState(next);
      const applied = await apply(next);
      return { ok: true, state: next, applied };
    }

    case 'select': {
      if (!state.proxies.some((item) => item.id === message.id)) {
        return { ok: false, error: '找不到这个地址' };
      }
      const next = { ...state, activeId: message.id };
      await saveState(next);
      const applied = await apply(next);
      return { ok: true, state: next, applied };
    }

    case 'remove': {
      const proxies = state.proxies.filter((item) => item.id !== message.id);
      if (proxies.length === state.proxies.length) {
        return { ok: false, error: '找不到这个地址' };
      }
      const activeId = state.activeId === message.id
        ? (proxies.length ? proxies[0].id : null)
        : state.activeId;
      const next = {
        ...state,
        proxies,
        activeId,
        enabled: proxies.length ? state.enabled : false
      };
      await saveState(next);
      const applied = await apply(next);
      return { ok: true, state: next, applied };
    }

    case 'toggle': {
      const enabled = Boolean(message.enabled);
      if (enabled && !getActiveProxy(state)) {
        return { ok: false, error: '请先添加一个代理地址' };
      }
      const next = { ...state, enabled };
      await saveState(next);
      const applied = await apply(next);
      return { ok: true, state: next, applied };
    }

    default:
      return { ok: false, error: '未知操作' };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ ok: false, error: error && error.message ? error.message : String(error) });
    });
  return true;
});

async function restore() {
  try {
    const state = await getState();
    await apply(state);
  } catch (error) {
    console.error('恢复代理设置失败：', error);
  }
}

chrome.runtime.onInstalled.addListener(restore);
chrome.runtime.onStartup.addListener(restore);
