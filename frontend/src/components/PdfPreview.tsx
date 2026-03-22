import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import logger from "../services/logger";
// import "pdfjs-dist/web/pdf_viewer.css";
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

  const pageTextLayersRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderingRef = useRef(false);
  const renderedScaleRef = useRef<number | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);

  // === render all pages into their canvases with giving scale ===
  const renderPages = useCallback(async (targetScale: number) => {
    const pdf = pdfDocRef.current;
    const container = containerRef.current;
    if (!pdf || !container) return;

    if (renderingRef.current) {
      pendingScaleRef.current = targetScale;
      return;
    }
    if (renderedScaleRef.current === targetScale) return;

    renderingRef.current = true;
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
          canvas.className = "preview-canvas";
          canvas.style.display = "block";
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

        // === text layer ===

        // remove old text layer if it exist (scale changed, position is wrong)
        const oldTextLayer = pageTextLayersRef.current.get(i);
        if (oldTextLayer) oldTextLayer.remove();

        // create new div to hold the text layer
        const textLayerDiv = document.createElement("div");
        textLayerDiv.className = "textLayer";

        // apparently PDF.js need these 3 custom properties
        // to set the width, height and font size for the text layer
        // they were all undefinied in inspect element
        //
        // --scale-factor:       zoom level
        // --total-scale-factor: for our case this should be the same as scale factor
        // --scale-round-x/y:    rounding precision, 1px should work fine
        const totalScale = targetScale;
        textLayerDiv.style.setProperty("--scale-factor", String(targetScale));
        textLayerDiv.style.setProperty(
          "--total-scale-factor",
          String(totalScale),
        );
        textLayerDiv.style.setProperty("--scale-round-x", "1px");
        textLayerDiv.style.setProperty("--scale-round-y", "1px");
        pageDiv.appendChild(textLayerDiv);

        // get the text content from the pdf page
        // this should return the actual string and their position in PDF coordinates
        // const textContent = await page.getTextContent();
        const textContent = await page.getTextContent();

        // render the text layer (PDF.js create invisible <span> elements)
        // and position them on top of the canvas text
        const textLayer = new pdfjsLib.TextLayer({
          container: textLayerDiv,
          textContentSource: textContent,
          viewport: viewport,
        });
        await textLayer.render();

        // store reference so we remove it on next zoom
        pageTextLayersRef.current.set(i, textLayerDiv);
      }

      // renderedScaleRef.current = targetScale;
    } catch (error: any) {
      console.error("Render error:", error);
    } finally {
      renderingRef.current = false;

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
      pageTextLayersRef.current.clear();

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
      pageTextLayersRef.current.clear();
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
      // logger.log("zooming");
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
    <div className="preview-content">
      <div className="preview-header">
        <button
          className="zoom-btn"
          onClick={() =>
            setScale((s) => Math.max(0.25, Math.round((s - 0.25) * 100) / 100))
          }
          style={{ borderRadius: "6px 0px 0px 6px" }}
        >
          −
        </button>

        <span
          className="zoom-label"
          style={{ minWidth: "50px", textAlign: "center" }}
        >
          {Math.round(scale * 100)}%
        </span>

        <button
          className="zoom-btn"
          onClick={() =>
            setScale((s) => Math.min(5.0, Math.round((s + 0.25) * 100) / 100))
          }
          style={{ borderRadius: "0px 6px 6px 0px" }}
        >
          +
        </button>
      </div>
      <div
        ref={containerRef}
        className="pdf-container"
        // this needed to make the text layer render on top of the canvas
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          backgroundColor: "#404040",
          display: "flex",
          flexDirection: "column",
          // alignItems: "center",
          gap: "12px",
        }}
      />

      {!hasContent && <div>No preview available</div>}
    </div>
  );
}
