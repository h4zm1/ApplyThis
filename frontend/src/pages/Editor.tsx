import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  compileResume,
  getResume,
  previewCompile,
  saveResumeSource,
  updateResume,
} from "../services/resumeService";
import type { Resume } from "../types/resume";
import LateXEditor from "../components/LaTeXEditor";
import PdfPreview from "../components/PdfPreview";
import { useAction } from "../context/AppContext";
import logger from "../services/logger";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { invalidateResumeData } from "../services/queries";
const Editor = () => {
  const { resumeId } = useParams<{ resumeId: string }>(); // get resume id from url params
  const [resume, setResume] = useState<Resume | null>(null);
  const [source, setSource] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const {
    setPreviewAction,
    setCompileAndSaveAction,
    setHeaderTitle,
    setSyncStatus, // track the pdf sync to storage, -1 = unknow (just loaded), 0 = off sync, 1 = in sync
    saveStatus,
    setSaveStatus,
    setIsCompiling,
  } = useAction();

  const AUTOSAVE_DELAY = 1500; // ms of silence before saving
  // using refs here cause the values will be chaning alot and keep holding latest value all the time
  const sourceRef = useRef("");
  // hold the last text we know in database, it's set in 3 places
  // loadResume: the text we get from server
  // saveNow: after successful autosave
  // handleSave: after compile & save
  const lastSavedRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // track timer
  const savingRef = useRef(false); // track if we are currently saving

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
      const loadedSource = data.source || getDefaultTamplate();
      setResume(data);
      logger.log("NAME ", data.name);
      setHeaderTitle(data?.name! + " > editor");

      // set source from feteched data
      // fallback to template if feteched source is empty
      setSource(loadedSource);
      sourceRef.current = loadedSource;
      lastSavedRef.current = loadedSource;
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
      const errorBody = error.response.data;
      if (errorBody.error) {
        if (Array.isArray(errorBody.error))
          message = errorBody.error.join("\n");
        else message = errorBody.eror;
      }
      setError(message);
    } finally {
      setIsCompiling(false);
    }
  }, [source]);

  // save current source to database
  async function handleSave(): Promise<boolean> {
    if (!resumeId || !resume) return false;

    setIsSaving(true);
    try {
      const updated = await updateResume(resumeId, { source });
      setResume(updated);
      lastSavedRef.current = source;
      // only set "saved" if nothing got typed while updatng
      if (sourceRef.current === source) setSaveStatus("saved");
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

    //
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

      if (sourceRef.current === source)
        // nothing got typed while saving was happening
        setSyncStatus(1);
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

  // called on every keyperess
  function handleSourceChange(newSource: string) {
    setSource(newSource);
    sourceRef.current = newSource;

    // if typed something and undid it => do nothing
    if (newSource === lastSavedRef.current) return;
    if (!resumeId) return;

    setSaveStatus("unsaved");
    setSyncStatus(0); // PDF doesn't match the text

    // every keypress cancel the old timer and start new one
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveNow(resumeId), AUTOSAVE_DELAY);
  }

  async function saveNow(id: string) {
    // we are saving now, so clear out and stop the timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    // leave if a save is already running
    if (savingRef.current) return;

    const textToSave = sourceRef.current;

    // nothing changed (the user may have typed something and undone it)
    if (textToSave === lastSavedRef.current) {
      setSaveStatus("saved");
      return;
    }

    savingRef.current = true;
    setSaveStatus("saving");
    try {
      await saveResumeSource(id, textToSave);
      lastSavedRef.current = textToSave;
      invalidateResumeData(); // so dubplicating resumes won't carrythrough an old source
    } catch (error: any) {
      savingRef.current = false;
      setSaveStatus("error"); // the next keystroke will try again
      setError(error.response?.data?.error || "Autosave failed");
      return;
    }
    savingRef.current = false;

    // did the user keep typing while we were saving?
    if (sourceRef.current !== lastSavedRef.current) {
      setSaveStatus("unsaved");
      timerRef.current = setTimeout(() => saveNow(id), AUTOSAVE_DELAY);
    } else {
      setSaveStatus("saved");
    }
  }
  // leaving the editor trigger autosave
  useEffect(() => {
    return () => {
      if (resumeId) saveNow(resumeId);
    };
  }, [resumeId]);

  // confirm popup if tab get closed
  useEffect(() => {
    function handleTabClose(event: BeforeUnloadEvent) {
      if (saveStatus === "saved") return; // if text is saved then do nothing
      event.preventDefault(); // prevent default behaviour (prevent closing the tab)
    }
    window.addEventListener("beforeunload", handleTabClose);
    return () => window.removeEventListener("beforeunload", handleTabClose);
  }, [saveStatus]);

  return isLoading ? (
    <div className="loading-overlay" style={{ background: "unset" }}>
      <div className="loading-holder">
        <div className="loader-spinner"></div>
        <span>Loading editor</span>
      </div>
    </div>
  ) : (
    <div className="editor">
      <Group className="editor-container">
        <Panel className="editor-side" minSize={400}>
          <LateXEditor value={source} onChange={handleSourceChange} />
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
