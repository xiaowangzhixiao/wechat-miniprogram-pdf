# Requirements

## Goal

Provide an open-source PDF renderer that runs inside a native WeChat Mini Program page. It must render PDF pages to a 2D canvas without `web-view`, H5, `wx.openDocument`, or converting pages to downloadable image files.

## Public API

- `createPdfEngine(options?)` creates an isolated renderer.
- `engine.open(data)` accepts `ArrayBuffer` or `Uint8Array` and returns a document.
- `document.pageCount` reports the page count.
- `document.getPageInfo(pageNumber)` returns the original page dimensions.
- `document.renderPage(pageNumber, canvas, options?)` renders to a WeChat 2D canvas.
- `document.destroy()` and `engine.destroy()` release resources.

## Acceptance criteria

- A real CloudBase PDF opens and paints inside the JingEduBox material preview page.
- Previous/next page and zoom controls work without leaving the mini program.
- Preview does not expose an image long-press/save path and does not call the WeChat file reader.
- The npm tarball contains a CommonJS runtime that can be copied into a mini-program subpackage.
- CI builds, tests, and verifies `npm pack`; a release workflow publishes through npm Trusted Publishing.

## Constraints

- The rendering core is Mozilla PDF.js (Apache-2.0) with a WeChat Canvas adapter.
- No DOM, browser Worker, network font fetch, or browser-only canvas implementation at runtime.
- The initial release targets the current WeChat base library and 2D canvas API; complex interactive PDF forms and annotations are out of scope.

