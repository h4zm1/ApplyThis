import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  compileResume,
  getResume,
  previewCompile,
  updateResume,
} from "../services/resumeService";
import type { Resume } from "../types/resume";
import LateXEditor from "../components/LaTeXEditor";
import PdfPreview from "../components/PdfPreview";
import { useAction } from "../context/AppContext";
import logger from "../services/logger";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
const Editor = () => {
  const { resumeId } = useParams<{ resumeId: string }>(); // get resume id from url params

  const [resume, setResume] = useState<Resume | null>(null);
  const [source, setSource] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { setPreviewAction, setCompileAndSaveAction } = useAction();

  // load resume on mount
  useEffect(() => {
    if (resumeId) loadResume(resumeId);
  }, [resumeId]);

  async function loadResume(resumeId: string) {
    try {
      const data = await getResume(resumeId!);
      setResume(data);

      // set source from feteched data
      // fallback to template if feteched source is empty
      setSource(data.source || getDefaultTamplate());
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

  // save current source to database
  async function handleSave() {
    if (!resumeId || !resume) return;

    setIsSaving(true);
    try {
      const updated = await updateResume(resumeId, { source });
      setResume(updated);
    } catch (error: any) {
      setError(error.response.data.error || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  // compile and save to s3
  async function handleCompileAndSave() {
    if (!resumeId) return;

    // first save source
    await handleSave();

    setIsCompiling(true);
    try {
      const result = await compileResume(resumeId, source);
      // load resume to get updated pdfUrl
      // this's needed when the resume is created it doesn't have an attacheed pdfUrl to it
      await loadResume(resumeId);
      // also update preview
      await handlePreview();
    } catch (error: any) {
      setError(error.response.data.error || "Failed to compile and save");
    } finally {
      setIsCompiling(false);
    }
  }

  // everytime handlePreview change (due to [source]), update the context
  useEffect(() => {
    setPreviewAction({ run: handlePreview });
    setCompileAndSaveAction({ run: handleCompileAndSave });
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
      <Group className="editor-container">
        <Panel className="editor-side" minSize={400}>
          <LateXEditor value={source} onChange={setSource} />
        </Panel>
        <Separator data-separator="inactive" className="separator">
          <GripVertical className="grip-vertical" />
        </Separator>
        {/* <div data-separator="active" /> */}
        <Panel className="preview-side" minSize={400}>
          <PdfPreview pdfBlob={pdfBlob} pdfUrl={resume?.pdfUrl}></PdfPreview>
        </Panel>
      </Group>
    </div>
  );
};
// return basic latex template for new resumes
function getDefaultTamplate(): string {
  return `\\documentclass{article}

    \\begin{document}

    \\section* {NAME}
    Contact info.

    \\section* {Experience}
    Experience here.

    \\section* {Education}
    Education here.

\\end{document}
    `;
}
export default Editor;
