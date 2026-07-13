import "./polyfills.mjs";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";
import { getDocument } from "pdfjs-dist/build/pdf.mjs";
import { adaptCanvasContext } from "./context-adapter.mjs";
import { MiniProgramBinaryDataFactory, MiniProgramCanvasFactory, MiniProgramFilterFactory } from "./factories.mjs";

globalThis.pdfjsWorker = { WorkerMessageHandler };

function normalizeData(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data && typeof data.byteLength === "number") {
    try { return new Uint8Array(data); } catch (_error) {}
  }
  throw new TypeError("PDF data must be an ArrayBuffer or Uint8Array");
}

export function createPdfEngine(defaultOptions = {}) {
  const documents = new Set();
  return {
    async open(data, options = {}) {
      const loadingTask = getDocument({
        data: normalizeData(data),
        CanvasFactory: MiniProgramCanvasFactory,
        FilterFactory: MiniProgramFilterFactory,
        BinaryDataFactory: MiniProgramBinaryDataFactory,
        useWasm: false,
        isEvalSupported: false,
        disableFontFace: true,
        useSystemFonts: true,
        useWorkerFetch: false,
        isOffscreenCanvasSupported: true,
        isImageDecoderSupported: false,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
        ...defaultOptions,
        ...options
      });
      const pdf = await loadingTask.promise;
      const document = {
        pageCount: pdf.numPages,
        async getPageInfo(pageNumber) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          return { width: viewport.width, height: viewport.height, rotation: viewport.rotation };
        },
        async renderPage(pageNumber, canvas, renderOptions = {}) {
          const page = await pdf.getPage(pageNumber);
          const scale = Number(renderOptions.scale || 1);
          const pixelRatio = Number(renderOptions.pixelRatio || 1);
          const viewport = page.getViewport({ scale: scale * pixelRatio, rotation: renderOptions.rotation });
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          const context = adaptCanvasContext(canvas.getContext("2d"), canvas);
          await page.render({ canvas, canvasContext: context, viewport, background: renderOptions.background || "white" }).promise;
          return { width: viewport.width / pixelRatio, height: viewport.height / pixelRatio, pixelWidth: canvas.width, pixelHeight: canvas.height };
        },
        async destroy() {
          documents.delete(document);
          await loadingTask.destroy();
        }
      };
      documents.add(document);
      return document;
    },
    async destroy() {
      await Promise.all([...documents].map(document => document.destroy()));
    }
  };
}

export { MiniDOMMatrix, MiniPath2D } from "./polyfills.mjs";
