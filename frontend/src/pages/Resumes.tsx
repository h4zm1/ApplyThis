import { useEffect, useState } from "react";
import type { CreateResumeRequest, Resume } from "../types/resume";
import {
  createResume,
  deleteResume,
  getResumes,
  updateResume,
} from "../services/resumeService";
import { Edit, Notebook, Trash, Trash2 } from "lucide-react";
import Popup from "../components/popUp";
import ResumeForm from "../components/ResumeForm";
import { Link } from "react-router-dom";

const Resumes = () => {
  // data state
  const [resumes, setResumes] = useState<Resume[]>([]); // list of all user's resumes
  const [isLoading, setIsLoading] = useState(true); // show/hide loading text
  const [error, setError] = useState(""); // store error message

  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null); // null = create, object = edit
  const [isSubmitting, setIsSubmitting] = useState(false); // for disabling buttons on API calls

  // load resumes on mount (like ngOnInit)
  useEffect(() => {
    loadResumes();
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
    setEditingResume(null); // null means create mode
    setIsPopupOpen(true);
  }

  /**
   * open popup for editing esixting resume
   **/
  function handleEdit(resume: Resume) {
    setEditingResume(resume);
    setIsPopupOpen(true);
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
      if (editingResume) {
        // update existing
        const updated = await updateResume(editingResume.id, data);
        // replace in list
        setResumes(resumes.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        // create new one
        const created = await createResume(data);
        // add to the list
        setResumes([created, ...resumes]);
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
    <div>
      <div>
        <h1>Resumes</h1>
        <p>Manage resume</p>
      </div>
      <div>
        {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
        <button onClick={handleCreate}>New Resume</button>
      </div>
      <div>
        {resumes.length === 0 ? (
          <p>No resume yet. Create your first one!</p>
        ) : (
          <div>
            {resumes.map((resume) => (
              <div className="resume" key={resume.id}>
                <Link to={`/editor/${resume.id}`}>
                  <div className="resume-body">
                    <div>
                      <p>
                        {resume.pdfUrl ? "PDF compiled" : "Not compiled yet"}
                      </p>
                      {/* show pdf linked if compiled */}
                      {resume.pdfUrl && (
                        <a
                          href={resume.pdfUrl}
                          target="_blank" // open in new tab
                          rel="noopener noreferer"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(resume);
                      }}
                    >
                      <Edit />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        handleDelete(resume);
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                </Link>
                <div className="resume-title">
                  <h1 className="title">{resume.name}</h1>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title={editingResume ? "Edit Resume" : "New Resume"}
      >
        <ResumeForm
          resume={editingResume}
          onSubmit={handleSubmit}
          onCancel={handleClosePopup}
          isSubmitting={isSubmitting}
        />
      </Popup>
    </div>
  );
};

export default Resumes;
