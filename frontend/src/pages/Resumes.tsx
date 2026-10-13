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
import R_ToggleGroup, { R_ToggleItem } from "../components/ui/ToggleGroup";
import Tooltip from "../components/ui/tooltip";
import { queryClient } from "../services/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invalidateResumeData,
  normalizeResume,
  resumesQuery,
} from "../services/queries";
import { keys } from "../services/queryKeys";

const Resumes = () => {
  // data state
  const [error, setError] = useState(""); // store error message

  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null); // null = create, object = edit
  const [isSubmitting, setIsSubmitting] = useState(false); // for disabling buttons on API calls
  const { setHeaderTitle } = useAction();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const resumesQ = useQuery(resumesQuery);
  const isLoading = resumesQ.isPending;
  const loadFailed = resumesQ.isError;

  const savedResumes = resumesQ.data ?? [];
  let resumes = savedResumes;
  if (editingResume && editingResume.id === "-1") {
    // create new list (based on cached list) and place editingResume at top (index 0)
    resumes = [editingResume, ...savedResumes];
  }

  // ui stuff
  const [layout, setLayout] = useState("");

  function patchResumes(updatedFunction: (oldResumes: Resume[]) => Resume[]) {
    return queryClient.setQueryData<Resume[]>(keys.resumes, (currentCache) => {
      const existingResumes = currentCache ?? [];
      const updatedResume = updatedFunction(existingResumes);
      const sortedList = [...updatedResume].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      return sortedList;
    });
  }

  // load resumes on mount (like ngOnInit)
  useEffect(() => {
    setHeaderTitle(user?.email + " > Resume");
    const savedLayout = localStorage.getItem("layout");
    if (savedLayout) setLayout(savedLayout);
  }, []);

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
  }

  // events when the new resume input is focused
  const handleTitleInput: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Enter") {
      handleSubmit(editingResume!);
    }
    if (event.key === "Escape") {
      setEditingResume(null);
    }
  };

  function handleLostFocus() {
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
      // update existing
      if (editingResume && editingResume.id !== "-1") {
        const updated = await updateResume(editingResume.id, data);
        // replace in list
        patchResumes((old) =>
          old.map((r) => (r.id === updated.id ? normalizeResume(updated) : r)),
        );
      } else {
        // create new one
        // only set template source when the source is empty (this to avoid reseting the source when duplicating a resume)
        if (!data.source) {
          data.source =
            "\\documentclass{article}\\begin{document}My Resume\\end{document}";
        }
        const created = await createResume(data);
        patchResumes((old) => [normalizeResume(created), ...old]);
      }
      invalidateResumeData();
      handleClosePopup(); // success, close the popup
    } catch (error: any) {
      setError(error.response.data.error || "failed to save resume");
    } finally {
      setIsSubmitting(false);
    }
  }

  // handle resume duplication
  async function handleDuplicate(resume: Resume) {
    const dummy: Resume = {
      id: "-1",
      name: resume.name + "-copy",
      source: resume.source,
      pdfUrl: resume.pdfUrl,
      thumbnailUrl: resume.thumbnailUrl,
      createdAt: "",
      updatedAt: "",
      orderIndex: 0,
    };

    setEditingResume(dummy);
    handleSubmit({ name: dummy.name, source: dummy.source });
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
      patchResumes((old) => old.filter((r) => r.id !== resume.id));
      invalidateResumeData();
    } catch (error: any) {
      setError(error.response.data.error || "failed to delete resume");
    }
  }

  useEffect(() => {
    localStorage.setItem("layout", layout);
    // console.log("layout changed", layout);
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

    // cancel any ongoing fetching
    await queryClient.cancelQueries({ queryKey: keys.resumes });
    const previous = queryClient.getQueryData<Resume[]>(keys.resumes);

    patchResumes((old) =>
      old
        .map((r) =>
          r.id === draggedId ? { ...r, orderIndex: newOrderIndex } : r,
        )
        .sort((a, b) => a.orderIndex - b.orderIndex),
    );

    try {
      await updateResumeOrder(draggedId, newOrderIndex);
    } catch (error) {
      logger.error(error, "Failed to save order");
      queryClient.setQueryData(keys.resumes, previous);
    }
  };

  // show loading indic
  if (isLoading) {
    return (
      <div className="loading-holder">
        <div className="loader-spinner"></div>
        <span>Loading resumes</span>
      </div>
    );
  }

  return (
    <div className="resumes">
      <div className="page-title">
        <span>Resumes</span>
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
                            handleDuplicate(resume);
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
