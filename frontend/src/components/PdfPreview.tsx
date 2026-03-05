/**
 * display pdf in iframe from either:
 * - url (existing compiled pdf from S3)
 * - blol (freshly compiled pdf from api)
 *
 * most likely change iframe to PDF.js or something in the future
 */

import { useEffect, useState } from "react";

interface PdfPreviewProps {
  pdfUrl?: string | null;
  pdfBlob?: Blob | null;
}

const PdfPreview = ({ pdfUrl, pdfBlob }: PdfPreviewProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else setBlobUrl(null);
  }, [pdfBlob]);

  const displayUrl = blobUrl || pdfUrl;

  if (!displayUrl) return <div> no preview available</div>;
  return (
    <div className="display-holder">
      <iframe src={displayUrl}>
        <p>not working</p>
      </iframe>
    </div>
  );
};

export default PdfPreview;
