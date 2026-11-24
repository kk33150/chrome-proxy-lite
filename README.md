> [!WARNING]
> 本扩展只负责把 Chrome 指向**你提供的**代理地址，不提供代理节点，也不实现任何网络绕过。请只用于本地开发调试、公司代理，或你有权使用的代理服务。

<div align="center">

<img src="icons/icon128-on.png" width="80" height="80" alt="极简浏览器代理图标" />

# 极简浏览器代理

**填一个地址，点一下开关。就这样。**

一个只有「添加地址 / 选一个 / 开关」的 Chrome 代理扩展，Manifest V3 版本，没有多余功能。

[GitHub 仓库](https://github.com/kk33150/chrome-proxy-lite)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
![Permissions](https://img.shields.io/badge/permissions-proxy%20%2B%20storage-1c1b1a)
![Dependencies](https://img.shields.io/badge/dependencies-none-1c1b1a)
![License](https://img.shields.io/badge/license-MIT-f6821f)

</div>

## ✨ 功能

- 🎯 **只做一件事**：填地址、开代理、关代理。没有规则引擎，没有分流策略，没有学习成本。
- ⚡ **一键开关**：工具栏图标就是开关，开启变绿并带 ✓，关闭恢复灰色。
- 📋 **多地址管理**：保存多个 `PROXY` / `SOCKS5` 地址，单选其中一个使用，随时删除。
- 🪶 **零依赖、不构建**：原生 JavaScript + CSS，没有 npm 依赖，没有打包步骤，源码就是能跑的代码。
- 🔒 **隐私优先**：只申请 `proxy` 和 `storage` 两个权限；不上传地址、不记录历史、不含分析或远程代码。
- 💾 **设置存在本机**：用 `chrome.storage.local` 保存，卸载扩展即清除。
- 🌐 **只影响浏览器**：不修改 Windows 系统代理，关闭开关后立即恢复直连。
- 🧪 **有测试**：地址解析与后台状态流转共 12 项测试，`node tests/*.test.cjs` 一键运行。

> [!TIP]
> **适合谁？** 有本地代理（如开发用的 `127.0.0.1:7890`）、只想让 Chrome 单独走代理、又不想装 SwitchyOmega 那种“全家桶”的人。

## 🪧 界面

<table>
  <tr>
    <td width="50%" align="center">
      <img src="icons/icon128.png" width="64" alt="关闭状态的灰色图标" /><br />
      <strong>关闭</strong>：灰色，浏览器直连
    </td>
    <td width="50%" align="center">
      <img src="icons/icon128-on.png" width="64" alt="开启状态的绿色图标" /><br />
      <strong>开启</strong>：绿色 + ✓，浏览器走代理
    </td>
  </tr>
</table>

弹窗里只有：一个开关、一个地址输入框、一个添加按钮、一个地址列表。

## 🚀 获取开始

1. 克隆或下载本仓库。
2. 打开 `chrome://extensions/`。
3. 打开右上角「开发者模式」。
4. 点「加载已解压的扩展程序」，选中 `chrome-proxy-lite` 文件夹。
5. 点击工具栏里的扩展图标，填一个地址，打开开关。

输入格式：

```text
PROXY 127.0.0.1:7890
```

或：

```text
SOCKS5 127.0.0.1:1080
```

冒号后面带空格也能识别，比如 `PROXY 1.1.1.1: 1000`。点「添加」保存，点列表里的某一条切换使用，点 `×` 删除。

## 🔧 工作原理

```text
你输入：PROXY 127.0.0.1:7890
        │
        ▼
parseProxy()
  → { scheme: "http", host: "127.0.0.1", port: 7890 }
        │
        ▼
chrome.proxy.settings.set({
  mode: "fixed_servers",
  rules: { singleProxy: { scheme, host, port } }
})
```

关掉开关时调用 `chrome.proxy.settings.clear()`，浏览器恢复直连。图标颜色由 Worker 根据当前状态设置。

## 🧱 技术栈

- **平台**：Chrome Manifest V3，Service Worker 后台
- **浏览器 API**：`chrome.proxy`（代理设置）、`chrome.storage.local`（本地保存）、`chrome.action`（图标与角标）
- **界面**：原生 HTML + CSS + JavaScript，无框架、无构建
- **测试**：Node.js 内置 `node:test` 风格的轻量断言脚本
- **许可证**：MIT

## 🚗 Roadmap

- [x] `PROXY` / `SOCKS5` 地址解析
- [x] 多地址保存、单选、删除
- [x] 一键开关与图标状态
- [x] 本地存储、零遥测、零依赖
- [x] 解析与状态流转测试
- [ ] 按域名分流规则（暂不做，保持极简）
- [ ] PAC 脚本支持（暂不做）

## 🙋 常见问题

**支持 SOCKS5 的账号密码吗？**  
不支持。Chrome 的扩展代理接口不支持 SOCKS5 认证，这一点和 Manifest V3 的限制有关。需要认证的代理请用客户端软件处理。

**支持 PAC 自动脚本或按域名分流吗？**  
不支持。这个扩展刻意只做固定单代理；需要复杂规则请考虑 ZeroOmega 等工具。

**它会上传我的代理地址或密码吗？**  
不会。所有设置只保存在本机 `chrome.storage.local`，扩展本身不发任何网络请求。

**为什么只需要 `proxy` 和 `storage` 两个权限？**  
因为不做代理认证、不拦截网页内容，所以不需要 `<all_urls>` 之类的宽泛权限。

**会影响系统或其他浏览器吗？**  
不会。`chrome.proxy` 只作用于当前 Chrome 配置文件。

**本地地址会走代理吗？**  
不会。`localhost`、`127.0.0.1`、`[::1]` 默认直连，避免本地开发服务被代理打断。

## 📚 文件说明

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | Manifest V3 配置与权限声明 |
| `background.js` | 应用 / 清除代理设置，维护图标与角标 |
| `proxy-core.js` | 解析 `PROXY IP:端口` 输入 |
| `popup.html` / `popup.css` / `popup.js` | 弹出面板界面与交互 |
| `icons/` | 灰色（关闭）与绿色（开启）图标 |
| `tests/parse.test.cjs` | 地址解析单元测试 |
| `tests/background.test.cjs` | 后台状态流转测试 |
| `tools/make_icons.py` | 生成两种状态的 PNG 图标 |

运行测试：

```bash
node tests/parse.test.cjs
node tests/background.test.cjs
```

## 📄 License

[MIT](LICENSE)

## ⭐ Support

如果这个小东西对你有用，给仓库点个 Star 就行。没有广告，没有统计，没有订阅。
