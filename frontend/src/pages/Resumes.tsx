import { useEffect, useState, type KeyboardEventHandler } from "react";
import type { CreateResumeRequest, Resume } from "../types/resume";
import {
  createResume,
  deleteResume,
  getResumes,
  updateResume,
} from "../services/resumeService";
import {
  Copy,
  Download,
  Edit,
  Notebook,
  PenLine,
  Play,
  Trash,
  Trash2,
} from "lucide-react";
import Popup from "../components/popUp";
import ResumeForm from "../components/ResumeForm";
import { Link, useNavigate } from "react-router-dom";
import { useAction } from "../context/AppContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import logger from "../services/logger";

const Resumes = () => {
  // data state
  const [resumes, setResumes] = useState<Resume[]>([]); // list of all user's resumes
  const [isLoading, setIsLoading] = useState(true); // show/hide loading text
  const [error, setError] = useState(""); // store error message

  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null); // null = create, object = edit
  const [isSubmitting, setIsSubmitting] = useState(false); // for disabling buttons on API calls

  const { setHeaderTitle } = useAction();
  const { user } = useAuth();

  // load resumes on mount (like ngOnInit)
  useEffect(() => {
    loadResumes();
    setHeaderTitle(user?.email + "> Resume");
  }, []);

  async function loadResumes() {
    try {
      const data = await getResumes();
      setResumes(data); // "broadcast" data to UI
    } catch (error) {
      setError("failed to load resumes");
    } finally {
      setIsLoading(false); // stop showing loading message
    }
  }

  /**
   * open popup for creating new resume
   **/
  function handleCreate() {
    // setEditingResume(null); // null means create mode
    setIsPopupOpen(true);
    const dummy: Resume = {
      id: "-1",
      name: "",
      source: "",
      pdfUrl: "",
      createdAt: "",
      updatedAt: "",
    };

    setEditingResume(dummy);
    // add to the list to update ui
    setResumes([dummy, ...resumes]);
  }

  // events when the new resume input is focused
  const handleTitleInput: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      handleSubmit(editingResume!);
    }
    if (event.key === "Escape") {
      setResumes((prev) => prev.filter((r) => r.id !== "-1"));
      setEditingResume(null);
    }
  };

  function handleLostFocus() {
    setResumes((prev) => prev.filter((r) => r.id !== "-1"));
    setEditingResume(null);
  }
  function handleOpen(resume: Resume) {
    const navigate = useNavigate();
    navigate("/editor/" + resume.id);
  }
  /**
   * open popup for editing esixting resume
   **/
  function handleEdit(resume: Resume) {
    setEditingResume(resume);
    setIsPopupOpen(true);
    // const toEditResume: Resume = { ...resume, id: "-1" };
    // setResumes([toEditResume, ...resumes]);
  }
  /**
   * close popup and reset state
   **/
  function handleClosePopup() {
    setIsPopupOpen(false);
    setEditingResume(null);
  }

  // handle form submition (edit or create)
  async function handleSubmit(data: CreateResumeRequest) {
    setIsSubmitting(true);
    try {
      if (editingResume && editingResume.id !== "-1") {
        // update existing
        const updated = await updateResume(editingResume.id, data);
        // replace in list
        setResumes(resumes.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        // create new one
        data.source =
          "\\documentclass{article}\\begin{document}My Resume\\end{document}";
        const created = await createResume(data);
        setResumes((prev) => [
          created,
          ...prev.filter((r) => r.id !== "-1"), // filter out dummy resume
        ]);
        // add to the list to update ui
      }
      handleClosePopup(); // success, close the popup
    } catch (error: any) {
      setError(error.response.data.error || "failed to save resume");
    } finally {
      setIsSubmitting(false);
    }
  }

  // delete resume (after confirmation)
  async function handleDelete(resume: Resume) {
    //TODO: make it nicer
    if (!window.confirm("Delete " + resume.name + "? This cannot be undone")) {
      return;
    }

    try {
      await deleteResume(resume.id);
      // remmove resume from the list (filter out the deleted ID)
      setResumes(resumes.filter((r) => r.id !== resume.id));
    } catch (error: any) {
      setError(error.response.data.error || "failed to delete resume");
    }
  }

  return (
    <div className="resumes">
      <div className="title">
        <h1>Resumes</h1>
        {/* <p>Manage resume</p> */}
      </div>
      <div>
        {/* {resumes.length} resume{resumes.length !== 1 ? "s" : ""} */}
        <button className="new-resume-btn" onClick={handleCreate}>
          <div>+</div> New Resume
        </button>
      </div>
      {resumes.length === 0 ? (
        <p>No resume yet. Create your first one!</p>
      ) : (
        <div className="resumes-holder">
          {resumes.map((resume) => (
            <div className="resume" key={resume.id}>
              <Link to={`/editor/${resume.id}`}>
                <div className="resume-body">
                  <div>
                    {/* <p>{resume.pdfUrl ? "PDF compiled" : "Not compiled yet"}</p> */}
                    {/* show pdf linked if compiled */}
                    {/*   {resume.pdfUrl && ( */}
                    {/*     <a */}
                    {/*       href={resume.pdfUrl} */}
                    {/*       target="_blank" // open in new tab */}
                    {/*       rel="noopener noreferer" */}
                    {/*     > */}
                    {/*       View PDF */}
                    {/*     </a> */}
                    {/*   )} */}
                  </div>
                  <div className="context-bar">
                    <button
                      title="Delete"
                      onClick={(e) => {
                        handleDelete(resume);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 />
                    </button>
                    <button
                      disabled={resume.pdfUrl ? true : false}
                      title="Download PDF"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(resume);
                      }}
                    >
                      <Download />
                    </button>

                    <button
                      title="Rename"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(resume);
                      }}
                    >
                      <PenLine />
                    </button>

                    <button
                      title="Duplicated"
                      onClick={(e) => {
                        handleDelete(resume);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Copy />
                    </button>

                    <button
                      title="Open"
                      onClick={(e) => {
                        handleOpen(resume);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Play />
                    </button>
                  </div>
                  <div className="status"></div>
                </div>
              </Link>
              <div className="resume-title">
                {resume.id == editingResume?.id ? (
                  <input
                    autoFocus={true}
                    onBlur={handleLostFocus}
                    onKeyDown={handleTitleInput}
                    placeholder="e.g., Resume One"
                    value={editingResume.name}
                    onChange={(e) => {
                      // this need to be done like this so we don't lose other props
                      setEditingResume((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev,
                      );
                    }}
                  />
                ) : (
                  <h1>{resume.name}</h1>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* <Popup */}
      {/*   isOpen={isPopupOpen} */}
      {/*   onClose={handleClosePopup} */}
      {/*   title={editingResume ? "Edit Resume" : "New Resume"} */}
      {/* > */}
      {/*   <ResumeForm */}
      {/*     resume={editingResume} */}
      {/*     onSubmit={handleSubmit} */}
      {/*     onCancel={handleClosePopup} */}
      {/*     isSubmitting={isSubmitting} */}
      {/*   /> */}
      {/* </Popup> */}
    </div>
  );
};

export default Resumes;
