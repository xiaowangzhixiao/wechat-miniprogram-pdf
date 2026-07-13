# wechat-miniprogram-pdf

在微信小程序页面内直接渲染 PDF。底层使用 Mozilla PDF.js，提供小程序缺失 Web API 的兼容层和 Canvas 2D 适配器，不依赖 `web-view`、H5 或 `wx.openDocument`。

> 当前为早期版本。已验证普通文本/图片 PDF、分页和缩放；加密 PDF、交互表单、注释编辑及少见的外部 CMap/字体资源不在首版支持范围内。

## 特性

- PDF 字节在小程序 JavaScript 环境解析，页面直接绘制到 `<canvas type="2d">`。
- 预览和“下载/微信阅读器”由业务层分别控制。
- 单文件 CommonJS 运行时，可放入独立分包。
- 不生成供用户长按保存的页面图片。
- 支持 `ArrayBuffer` / `Uint8Array`、页数、分页、缩放、旋转和资源释放。

## 安装与复制

```bash
npm install wechat-miniprogram-pdf
npx wechat-miniprogram-pdf copy --target miniprogram/packages/pdf-preview/vendor/wechat-miniprogram-pdf.js
```

建议把运行时和预览页放在同一独立分包。当前构建接近微信单分包上限，发布前应使用微信开发者工具的“预览/上传”再次检查代码包体积。

## 小程序页面示例

```js
const { createPdfEngine } = require("../../vendor/wechat-miniprogram-pdf");

Page({
  async onLoad() {
    this.engine = createPdfEngine();
    const bytes = await readPdfArrayBuffer();
    this.document = await this.engine.open(bytes);
    this.setData({ pageCount: this.document.pageCount });
  },

  async renderPage(pageNumber) {
    const query = wx.createSelectorQuery().in(this);
    query.select("#pdf-canvas").fields({ node: true, size: true }).exec(async result => {
      const canvas = result[0].node;
      const page = await this.document.getPageInfo(pageNumber);
      await this.document.renderPage(pageNumber, canvas, {
        scale: 343 / page.width,
        pixelRatio: wx.getWindowInfo().pixelRatio
      });
    });
  },

  onUnload() {
    if (this.document) this.document.destroy();
    if (this.engine) this.engine.destroy();
  }
});
```

```xml
<canvas type="2d" id="pdf-canvas"></canvas>
```

应用负责通过 `wx.downloadFile`、`wx.cloud.downloadFile` 或自己的鉴权接口取得 PDF 字节。包本身不发起业务下载，也不记录下载行为。

## API

### `createPdfEngine(options?)`

创建渲染器。`options` 会透传给 PDF.js 的 `getDocument`，但包内安全默认值会关闭浏览器 Worker、WASM 图片解码、网络流和字体注入。

### `engine.open(data, options?)`

打开 `ArrayBuffer` 或 `Uint8Array`，返回文档对象。

### `document.getPageInfo(pageNumber)`

页码从 1 开始，返回原始 `width`、`height` 和 `rotation`。

### `document.renderPage(pageNumber, canvas, options?)`

`options` 支持 `scale`、`pixelRatio`、`rotation` 和 `background`。返回 CSS 尺寸与实际像素尺寸。

## 开发与发布

```bash
npm ci
npm run build
npm test
npm run pack:check
```

GitHub Release 发布后，`publish.yml` 自动发布 npm：

1. 首次发布时，在 GitHub 仓库添加一次性的 `NPM_TOKEN` Secret，再创建 `v0.1.0` Release。
2. 包建立后，在 npm 包设置中绑定 Trusted Publisher：GitHub 用户 `xiaowangzhixiao`、仓库 `wechat-miniprogram-pdf`、工作流 `publish.yml`。
3. 删除 GitHub 的 `NPM_TOKEN` Secret。后续 Release 将只使用短期 OIDC 凭据发布并自动生成 provenance。

## License

Apache-2.0。PDF.js 的版权与第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
