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
import { useUIContext } from "../context/UIContext";
import { invalidateResumeData } from "../services/queries";
const Editor = () => {
  const { resumeId } = useParams<{ resumeId: string }>(); // get resume id from url params

  const [resume, setResume] = useState<Resume | null>(null);
  const [source, setSource] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { setPreviewAction, setCompileAndSaveAction, setHeaderTitle } =
    useAction();
  const [inSync, setInSync] = useState(false);

  // load resume on mount
  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [resumeId]);

  // change background style from resume to editor
  useEffect(() => {
    const mainC = document.querySelector(".main-content") as HTMLElement;

    // this when inside editor
    if (mainC) {
      mainC.style.boxShadow = "unset";
      mainC.style.backgroundColor = "transparent";
      mainC.style.padding = "0";
    }

    return () => {
      logger.log("LEAVING EDITOR");
      // reset to default when leaving the editor
      if (mainC) {
        mainC.style.boxShadow = "";
        mainC.style.backgroundColor = "";
        mainC.style.padding = "2rem";
      }
    };
  }, []);

  async function loadResume(resumeId: string) {
    try {
      const data = await getResume(resumeId!);
      setResume(data);
      logger.log("NAME ", data.name);
      setHeaderTitle(data?.name!);

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
  async function handleSave(): Promise<boolean> {
    if (!resumeId || !resume) return false;

    setIsSaving(true);
    try {
      const updated = await updateResume(resumeId, { source });
      setResume(updated);
      invalidateResumeData(); // updating resume will move that resume to the top of the resumes list, se need to refresh cache
      return true;
    } catch (error: any) {
      setError(error.response.data.error || "Failed to save");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // compile and save to s3
  async function handleCompileAndSave() {
    if (!resumeId) return;

    // first save source
    const saved = await handleSave();
    // if save failed just return and don't touch current blob and pdfUrl
    if (!saved) return;

    setIsCompiling(true);
    try {
      const result = await compileResume(resumeId, source);
      // load resume to get updated pdfUrl
      // this's needed when the resume is created it doesn't have an attacheed pdfUrl to it
      if (resume)
        setResume({
          ...resume,
          pdfUrl: result.pdfUrl,
          thumbnailUrl: result.thumbnailUrl,
        });
      // clear preview blob so PdfPreview fall back to (newer) pdfURL
      setPdfBlob(null);
      invalidateResumeData();
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
