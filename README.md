# 极简浏览器代理

一个只有「添加地址 / 选一个 / 开关」的 Chrome 代理扩展，参考 Edge 插件《单独设置浏览器代理》做成 Manifest V3 版本。

## 功能

- 输入 `PROXY IP:端口` 或 `SOCKS5 IP:端口` 添加代理
- 保存多个地址，单选其中一个使用，可删除
- 一个开关控制开启 / 关闭，快捷键不需要记
- 开启后工具栏图标变绿并显示勾选标记，关闭后恢复灰色
- 设置只作用于当前 Chrome，不修改 Windows 系统代理
- 地址保存在本机 `chrome.storage.local`，不上传

## 安装

1. 打开 `chrome://extensions/`
2. 打开右上角「开发者模式」
3. 点「加载已解压的扩展程序」，选中 `chrome-proxy-lite` 文件夹
4. 点击工具栏里的扩展图标开始使用

## 使用

在弹出的面板里输入：

```text
PROXY 127.0.0.1:7890
```

或：

```text
SOCKS5 127.0.0.1:1080
```

点「添加」，然后打开左上角开关。图标变绿即表示浏览器代理已生效。

## 限制

- 只支持 `PROXY`（映射为 HTTP 代理）和 `SOCKS5`，不支持 PAC 自动脚本、按域名分流。
- Chrome 的代理扩展不支持代理账号密码认证；需要用户名密码的代理无法使用本扩展。
- 本地地址（localhost、127.0.0.1）默认直连，不走代理。
- 请仅用于合法合规的场景，例如本地开发调试或自己有权使用的代理服务器。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `manifest.json` | Manifest V3 配置与权限 |
| `background.js` | 应用 / 清除 Chrome 代理设置，维护图标状态 |
| `proxy-core.js` | 解析 `PROXY IP:端口` 输入 |
| `popup.html` / `popup.css` / `popup.js` | 弹出面板界面与交互 |
| `icons/` | 灰色（关闭）与绿色（开启）图标 |
| `tests/parse.test.cjs` | 地址解析单元测试 |
| `tests/background.test.cjs` | 后台状态流转测试 |
