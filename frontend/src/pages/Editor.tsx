import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResume, previewCompile } from "../services/resumeService";
import type { Resume } from "../types/resume";
import LateXEditor from "../components/LaTeXEditor";
import PdfPreview from "../components/PdfPreview";
import { useAction } from "../context/AppContext";
import logger from "../services/logger";

const Editor = () => {
  const { resumeId } = useParams(); // get resume id from url
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const { setPreviewAction } = useAction();

  useEffect(() => {
    loadResume();
  }, [resumeId]);

  async function loadResume() {
    try {
      const data = await getResume(resumeId!);
      setResume(data);

      // set source from feteched data
      // fallback to template if feteched source is empty
      // setSource(data.source || getDefaultTamplate());
    } catch (error) {
      setError("failed to load resume");
    } finally {
      setIsLoading(false);
    }
  }

  // compile current source for preview (not saved in s3)
  // useCallback to memorize the function and prepare it for later (unlike useEffect that run immidiatly on component render)
  // any change to "source" will
  const handlePreview = useCallback(async () => {
    logger.log("inside handlePreviiew");
    setIsCompiling(true);
    try {
      const blob = await previewCompile(source);
      setPdfBlob(blob);
    } catch (error: any) {
      // try extract error message
      let message = "Compilation failed";
      if (error.response.data) {
        // if error response is blob, read it as text
        if (error.response.data instanceof Blob) {
          const text = await error.response.data.text();
          try {
            const json = await JSON.parse(text);
            message = json.error.join("\n") || json.error || message;
          } catch {
            message = error.response.data.error || message;
          }
        }
      }
    }
  }, [source]);

  // everytime handlePreview change (due to [source]), update the context
  useEffect(() => {
    setPreviewAction({ run: handlePreview });
    return () => setPreviewAction(null);
  }, [handlePreview, setPreviewAction]);

  if (isLoading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }
  return (
    <div className="editor">
      <div className="editor-side">
        <LateXEditor value={source} onChange={setSource} />
      </div>
      <div className="preview-side">
        <PdfPreview pdfBlob={pdfBlob} pdfUrl={resume?.pdfUrl}></PdfPreview>
      </div>
    </div>
  );
};

export default Editor;
