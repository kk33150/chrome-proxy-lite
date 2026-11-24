const $ = (id) => document.getElementById(id);

let state = null;
let messageTimer = null;

function showMessage(text, isError = false) {
  const box = $('message');
  box.textContent = text;
  box.classList.toggle('error', isError);
  box.classList.add('show');
  clearTimeout(messageTimer);
  if (!isError) {
    messageTimer = setTimeout(() => box.classList.remove('show'), 2600);
  }
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response || !response.ok) {
    throw new Error(response && response.error ? response.error : '操作失败');
  }
  return response;
}

function render() {
  if (!state) return;

  const active = state.proxies.find((item) => item.id === state.activeId) || null;
  const on = state.enabled && Boolean(active);

  $('enableSwitch').checked = state.enabled;
  $('statusDot').classList.toggle('on', on);
  $('statusText').textContent = on ? `已开启 · ${active.label}` : '已关闭';

  const list = $('proxyList');
  list.replaceChildren();

  if (!state.proxies.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = '还没有地址，先在上面添加一个';
    list.appendChild(empty);
    return;
  }

  for (const item of state.proxies) {
    const row = document.createElement('div');
    row.className = 'row' + (item.id === state.activeId ? ' active' : '');

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'proxy';
    radio.checked = item.id === state.activeId;
    radio.id = `radio-${item.id}`;

    const label = document.createElement('label');
    label.className = 'label';
    label.htmlFor = radio.id;
    label.textContent = item.label;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete';
    remove.textContent = '×';
    remove.title = '删除这个地址';

    remove.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        await send({ type: 'remove', id: item.id });
        await refresh();
        showMessage('已删除');
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    row.addEventListener('click', async () => {
      if (item.id === state.activeId) return;
      try {
        await send({ type: 'select', id: item.id });
        await refresh();
        showMessage('已切换代理地址');
      } catch (error) {
        showMessage(error.message, true);
      }
    });

    row.append(radio, label, remove);
    list.appendChild(row);
  }
}

async function refresh() {
  const response = await send({ type: 'getState' });
  state = response.state;
  render();
}

async function addProxy() {
  const input = $('proxyInput');
  try {
    await send({ type: 'add', raw: input.value });
    input.value = '';
    await refresh();
    showMessage('已添加');
  } catch (error) {
    showMessage(error.message, true);
  }
}

$('addBtn').addEventListener('click', addProxy);

$('proxyInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addProxy();
});

$('enableSwitch').addEventListener('change', async (event) => {
  try {
    await send({ type: 'toggle', enabled: event.target.checked });
    await refresh();
    showMessage(event.target.checked ? '代理已开启' : '代理已关闭');
  } catch (error) {
    showMessage(error.message, true);
    await refresh();
  }
});

refresh().catch((error) => showMessage(error.message, true));
