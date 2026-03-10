/**
 * display pdf in iframe from either:
 * - url (existing compiled pdf from S4)
 * - blol (freshly compiled pdf from api)
 *
 * most likely change iframe to PDF.js or something in the future
 */

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import logger from "../services/logger";
import { useAction } from "../context/AppContext";

interface PdfPreviewProps {
  pdfUrl?: string | null;
  pdfBlob?: Blob | null;
}
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
const PdfPreview = ({ pdfUrl, pdfBlob }: PdfPreviewProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPage] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(2);
  const [scale, setScale] = useState<number>(1);
  const { setZoomInAction, setZoomOutAction } = useAction();
  const [renderedPageNumber, setRenderedPageNumber] = useState<number | null>(
    null,
  );
  const [renderedScale, setRenderedScale] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else setBlobUrl(null);
  }, [pdfBlob]);
  useEffect(() => {
    setZoomInAction({ run: increaseScale });
    setZoomOutAction({ run: decreaseScale });
  }, []);

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3.0));
      }
    };

    div.addEventListener("wheel", handleWheel, { passive: false });
    return () => div.removeEventListener("wheel", handleWheel);
  }, []);
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPage(numPages);
    // setRenderedPageNumber(1); // testing double page
    // setRenderedScale(scale);
  }
  function changeScale(offset: number) {
    setScale((prevScale) => prevScale + offset);
  }

  function decreaseScale() {
    changeScale(-0.1);
  }

  function increaseScale() {
    changeScale(0.1);
  }
  // function handleZoom(e: React.WheelEvent) {
  //   logger.log("zooming");
  //   if (e.ctrlKey) {
  //     e.preventDefault();
  //     const delta = e.deltaY > 0 ? -0.1 : 0.1;
  //     setScale((prev) => Math.min(Math.max(prev + delta, 0.5), 3.0)); // Range 50% to 300%
  //   }
  // }

  const displayUrl = blobUrl || pdfUrl;
  const isLoading =
    renderedPageNumber !== pageNumber || renderedScale !== scale;
  if (!displayUrl) return <div> no preview available</div>;
  return (
    <div className="display-holder" ref={containerRef}>
      <Document file={displayUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => {
          const pageIdx = index + 1;
          return (
            <div
              key={`page_container_${pageIdx}`}
              style={{ position: "relative", marginBottom: "10px" }}
            >
              {isLoading && renderedPageNumber && renderedScale ? (
                <Page
                  key={`prev_${pageIdx}_${renderedScale}`}
                  pageNumber={pageIdx}
                  scale={renderedScale}
                />
              ) : null}

              <Page
                key={`${pageIdx}_${scale}`}
                pageNumber={pageIdx}
                scale={scale}
                onRenderSuccess={() => setRenderedScale(scale)}
              />
            </div>
          );
        })}
      </Document>
    </div>
  );

  // return (
  //   <div className="display-holder" onWheel={handleZoom}>
  //     <Document file={displayUrl} onLoadSuccess={onDocumentLoadSuccess}>
  //       {Array.from(new Array(numPages), (_el, index) => (
  //         <Page
  //           key={`page_${index + 1}`}
  //           pageNumber={index + 1}
  //           scale={scale}
  //         />
  //       ))}
  //     </Document>
  //     {/* <iframe src={displayUrl}> */}
  //     {/*   <p>not working</p> */}
  //     {/* </iframe> */}
  //   </div>
  // );
};

export default PdfPreview;
