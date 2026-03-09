/**
 * display pdf in iframe from either:
 * - url (existing compiled pdf from S4)
 * - blol (freshly compiled pdf from api)
 *
 * most likely change iframe to PDF.js or something in the future
 */

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

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

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else setBlobUrl(null);
  }, [pdfBlob]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPage(numPages);
  }

  const displayUrl = blobUrl || pdfUrl;

  if (!displayUrl) return <div> no preview available</div>;
  return (
    <div className="display-holder">
      <Document file={displayUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>
      {/* <iframe src={displayUrl}> */}
      {/*   <p>not working</p> */}
      {/* </iframe> */}
    </div>
  );
};

export default PdfPreview;
