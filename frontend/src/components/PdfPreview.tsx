import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import logger from "../services/logger";

// worker runs pdf parsing in a separate thread so UI doesn't freeze
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

interface Props {
  pdfUrl?: string | null;
  pdfBlob?: Blob | null;
}

export default function PdfPreview({ pdfUrl, pdfBlob }: Props) {
  // this will hold all the page canvases
  const containerRef = useRef<HTMLDivElement>(null);

  // loaded pdf document object to access pages
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // each pdf page will have an associate canvas and we gonna save them all in a map (faster retrieval)
  // this to avoid destroying and recreating (to avoid flicker issues)
  const pageCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // make sure that render calls don't happen together
  // we queue the new scale and handle it later after current renfer finish
  const pendingScaleRef = useRef<number | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);

  // === render all pages into their canvases with giving scale ===
  const renderPages = useCallback(async (targetScale: number) => {
    const pdf = pdfDocRef.current;
    const container = containerRef.current;
    if (!pdf || !container) return;

    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        // get the page object, which contains the drawing instructions
        const page = await pdf.getPage(i);

        // viewport = the dimension (width and hight) of this page should be based on this scale
        // each pdf page has it's own viewport, and it's scaled to the original size of thepdf
        // so if page is 600x800 "pdf points", with 1.5 scale it become 900x1200
        const viewport = page.getViewport({ scale: targetScale });

        // if there's an existing canvas, use it, or create new one
        let canvas = pageCanvasesRef.current.get(i);
        let pageDiv: HTMLDivElement;

        if (!canvas) {
          // this's the first time we rending this page, create the DOM element
          pageDiv = document.createElement("div");
          pageDiv.className = "pdf-page";

          canvas = document.createElement("canvas");
          pageDiv.appendChild(canvas);
          container.appendChild(pageDiv);

          // stone this canvas reference to reuse it next zoom
          pageCanvasesRef.current.set(i, canvas);
        } else {
          pageDiv = canvas.parentElement as HTMLDivElement;
        }

        // render the pdf in higher resolution 2x bigger internally
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        // but display it at 1x size with css for sharper text
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        // a 2d drawing surface, this's where PDF.js will paint into
        const context = canvas.getContext("2d")!;

        // scale the context to fit devicePixelRatio
        // without this everything will be bit blury (1x into 2x canvas)
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        // this's where the actual rendering happen,
        // PDF.js read the page's drawing instructions (getPage())
        // and excecute them on our canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;
      }

      // renderedScaleRef.current = targetScale;
    } catch (error: any) {
      console.error("Render error:", error);
    } finally {
      // renderingRef.current = false;

      // if zoom got triggerd again whle we were rendering, do that zoom now
      if (pendingScaleRef.current !== null) {
        const next = pendingScaleRef.current;
        pendingScaleRef.current = null;
        renderPages(next);
      }
    }
  }, []);

  // === load PDF when source (blob or url) change ===
  useEffect(() => {
    const loadPdf = async () => {
      // clean up previous pdf (trying to fix the lag issue)
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      pageCanvasesRef.current.clear();

      const container = containerRef.current;
      if (container) container.innerHTML = "";

      // check if source is blob or url
      let loadingTask;
      if (pdfBlob) {
        const arrayBuffer = await pdfBlob.arrayBuffer();
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      } else if (pdfUrl) {
        loadingTask = pdfjsLib.getDocument(pdfUrl);
      } else {
        setNumPages(0);
        return;
      }

      try {
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages); // will use it later
        renderPages(scale);
      } catch (error: any) {
        console.error("error loading PDFF: ", error);
      }
    };

    loadPdf();

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      pageCanvasesRef.current.clear();
    };
  }, [pdfBlob, pdfUrl]);

  // == rerender when scale change ==
  useEffect(() => {
    if (pdfDocRef.current) {
      renderPages(scale);
    }
  }, [scale]);

  // === ctrl + mouse wheel zoom ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleZoom = (e: WheelEvent) => {
      logger.log("zooming");
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3.0)); // Range 50% to 300%
      }
    };

    container.addEventListener("wheel", handleZoom);
    // remove listener when PdfPreivew is destroyed
    return () => container.removeEventListener("wheel", handleZoom);
  }, []);

  const hasContent = pdfBlob || pdfUrl;

  return (
    <div>
      <div ref={containerRef} />

      {!hasContent && <div>No preview available</div>}
    </div>
  );
}
