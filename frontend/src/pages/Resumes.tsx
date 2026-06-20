import { useEffect, useState } from "react";
import type { CreateResumeRequest, Resume } from "../types/resume";
import {
  createResume,
  deleteResume,
  getResumes,
  updateResume,
  updateResumeOrder,
} from "../services/resumeService";
import {
  Copy,
  Download,
  LayoutGrid,
  List,
  PenLine,
  Play,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import logger from "../services/logger";

import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import SortableResumeItem from "../components/SortableResumeItem";
import R_Select from "../components/ui/Select";
import R_ToggleGroup, { R_ToggleItem } from "../components/ui/ToggleGroup";
import Tooltip from "../components/ui/tooltip";

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
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  // ui stuff
  const [layout, setLayout] = useState("grid");

  // load resumes on mount (like ngOnInit)
  useEffect(() => {
    loadResumes();
    setHeaderTitle(user?.email + " > Resume");
  }, []);

  async function loadResumes() {
    try {
      const data = await getResumes();
      const normalized = data.map((r) => ({
        ...r,
        orderIndex: Number(r.orderIndex || 0),
      }));
      setResumes(normalized); // "broadcast" data to UI
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
      thumbnailUrl: "",
      createdAt: "",
      updatedAt: "",
      orderIndex: 0,
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

  useEffect(() => {
    console.log("layout changed", layout);
  }, [layout]);

  // drag and drop handler
  const handleDragEnd = async (event: any) => {
    // take the current array, and drag event and return new array
    // based on where the item got dropped
    const newArray = move(resumes, event);

    // resume got dropped in same spot or outside
    if (!newArray || newArray === resumes) {
      return;
    }

    // get draggad resume id
    const draggedId = event.operation?.source?.id;
    if (!draggedId) return;

    // find where the new resume is now  vs where it was before
    const newIndex = newArray.findIndex((r) => r.id === draggedId);
    const oldIndex = resumes.findIndex((r) => r.id === draggedId);

    if (newIndex === oldIndex || newIndex === -1) return;

    // using fractional index strategy instead of reindexing all resumes
    // this mean we only update one resume in DB, not all of them

    // get items surroudning the new position
    const prevItem = newArray[newIndex - 1];
    const nextItem = newArray[newIndex + 1];
    const currentItem = newArray[newIndex];

    // convert to numbers (using Prisma.Decimal in the backend)
    const prevOrder = prevItem ? Number(prevItem.orderIndex) : null;
    const nextOrder = nextItem ? Number(nextItem.orderIndex) : null;

    let newOrderIndex: number;

    if (prevOrder === null && nextOrder !== null) {
      // dropped at the TOP of the list
      // not item is above, so pick smaller than first item
      newOrderIndex = nextOrder - 1000;
    } else if (nextOrder === null && prevOrder !== null) {
      // dropped at the BOTTOM of the list
      // no item below, so pick a number larger than the last item
      // ex: prev is -3000 => new is -4000 (-3000+(-1000))
      newOrderIndex = prevOrder + 1000;
      // dropped BETWEEn two items
      // pick the middle point between the two neighbours
    } else if (prevOrder !== null && nextOrder !== null) {
      newOrderIndex = (prevOrder + nextOrder) / 2;
    } else {
      // fallback
      newOrderIndex = 0;
    }

    // abort if the math above gave NaN, don't wait for srrver
    if (isNaN(newOrderIndex)) {
      logger.error("newOrderIndex is NaN", { prevOrder, nextOrder });
      return;
    }

    const updatedResume = { ...currentItem, orderIndex: newOrderIndex };
    const finalArray = newArray.map((r) =>
      r.id === draggedId ? updatedResume : r,
    );

    setResumes(finalArray);

    try {
      await updateResumeOrder(draggedId, newOrderIndex);
    } catch (error) {
      logger.error(error, "Failed to save order");
      setResumes(resumes); // rollback
    }
  };

  return (
    <div className="resumes">
      <div className="title">
        <h1>Resumes</h1>
      </div>
      <div className="container-header">
        {/* {resumes.length} resume{resumes.length !== 1 ? "s" : ""} */}
        <button className="new-btn" onClick={handleCreate}>
          <div>+</div> New Resume
        </button>
        <R_ToggleGroup value={layout} onChange={setLayout}>
          <R_ToggleItem className="toggle-item" value="list">
            <List className="toggle-icon" />
          </R_ToggleItem>
          <R_ToggleItem className="toggle-item" value="grid">
            <LayoutGrid className="toggle-icon" />
          </R_ToggleItem>
        </R_ToggleGroup>
      </div>
      {layout === "list" ? (
        <div className="list-header">
          <span className="first-half">Resume</span>
          <span className="second-half">
            <span style={{ paddingRight: "2rem" }}>Created</span>
            <span>Last modified</span>
            <span>Actions</span>
          </span>
        </div>
      ) : (
        <div></div>
      )}
      {resumes.length === 0 ? (
        <p>No resume yet. Create your first one!</p>
      ) : (
        <div
          className={`item-holder${" " + layout}${isDragging ? " dragging" : ""}`}
        >
          <DragDropProvider onDragEnd={handleDragEnd}>
            {resumes.map((resume, index) => (
              <SortableResumeItem
                key={resume.id}
                id={resume.id}
                index={index}
                onDragChange={setIsDragging}
              >
                <Link
                  to={`/editor/${resume.id}`}
                  draggable={false}
                  style={{ textDecorationLine: "none" }}
                >
                  <div className={`resume-body ${" " + layout}`}>
                    <div className="status"></div>
                    <div>
                      <img src={resume.thumbnailUrl!}></img>
                    </div>
                    <div className="resume-dates">
                      <span>{resume.createdAt.substring(0, 10)}</span>
                      <span>{resume.updatedAt.substring(0, 10)}</span>
                    </div>
                    <div className="context-bar">
                      <Tooltip label="Delete">
                        <button
                          onClick={(e) => {
                            handleDelete(resume);
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Trash2 />
                        </button>
                      </Tooltip>

                      <Tooltip label="Download PDF">
                        <button
                          disabled={resume.pdfUrl ? false : true}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(resume);
                          }}
                        >
                          <Download />
                        </button>
                      </Tooltip>

                      <Tooltip label="Rename">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(resume);
                          }}
                        >
                          <PenLine />
                        </button>
                      </Tooltip>

                      <Tooltip label="Duplicate">
                        <button
                          onClick={(e) => {
                            handleDelete(resume);
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Copy />
                        </button>
                      </Tooltip>

                      <Tooltip label="Open">
                        <button
                          onClick={(e) => {
                            handleOpen(resume);
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Play />
                        </button>
                      </Tooltip>
                    </div>
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
              </SortableResumeItem>
            ))}
          </DragDropProvider>
        </div>
      )}
    </div>
  );
};

export default Resumes;
