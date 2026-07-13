# Design

The package bundles the PDF.js display API and worker implementation into one CommonJS file. A fake-worker bridge runs parsing in the mini-program JavaScript context. Platform adapters provide `DOMMatrix`, `Path2D`, offscreen canvases, binary loading, and filter fallbacks expected by PDF.js.

The package intentionally separates downloading from rendering. Applications obtain PDF bytes themselves, then pass the bytes to `open`. This lets CloudBase applications use authenticated temporary URLs while keeping their explicit download button independent from the embedded preview.

The distributed CLI copies the prebuilt runtime into a selected mini-program directory. This avoids depending on WeChat npm construction behavior and makes it possible to locate the large renderer in a subpackage.

