import type { CreateJobRequest, Job } from "../types/job";
import { useEffect, useState } from "react";
import type { Resume } from "../types/resume";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
  updateJobOrder,
} from "../services/jobService";
import { getResumes } from "../services/resumeService";
import logger from "../services/logger";
import JobForm, { STATUS_OPTIONS } from "../components/JobForm";
import { Briefcase, Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import Popup from "../components/popUp";
import R_ToggleGroup from "../components/ui/ToggleGroup";
import R_Select from "../components/ui/Select";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import SortableJobItem from "../components/SortableJobItem";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

// filter options
const STATUS_FILTERS = STATUS_OPTIONS;

const Jobs = () => {
  // data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsloading] = useState(true);
  const [error, setError] = useState("");
  const [statusColor, setStatusColor] = useState("")
  // filter state
  const [statusFilter, setStatusFilter] = useState(() => {
    const saved = localStorage.getItem("JOB-FILTER")
    return saved !== null ? saved : "ALL"
  });
  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSumitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { setHeaderTitle } = useAction();
  const { user } = useAuth()


  // load data on mount and when filter change
  useEffect(() => {
    loadData();
    localStorage.setItem("JOB-FILTER", statusFilter)
    setHeaderTitle(user?.email + " > Jobs");

  }, [statusFilter]);

  async function loadData() {
    try {
      // load jobs in resumes at smae time
      const [jobsData, resumeData] = await Promise.all([
        getJobs(statusFilter || undefined),
        getResumes(),
      ]);
      const normalized = jobsData.map((j) => ({
        ...j,
        orderIndex: Number(j.orderIndex || 0)
      }))
      setJobs(normalized);
      setResumes(resumeData);
    } catch (error) {
      setError("failed to load job data");
      logger.error(error);
    } finally {
      setIsloading(false);
    }
  }
  function handleCreate() {
    setEditingJob(null);
    setIsPopupOpen(true);
  }
  function handleEdit(job: Job) {
    setEditingJob(job);
    setIsPopupOpen(true);
  }
  function handleClosePopup() {
    setIsPopupOpen(false);
    setEditingJob(null);
  }
  async function handleSubmit(data: CreateJobRequest) {
    setIsSumitting(true);
    try {
      if (editingJob) {
        const updated = await updateJob(editingJob.id, data);
        setJobs(jobs.map((j) => (j.id === updated.id ? updated : j)));
      } else {
        const created = await createJob(data);
        setJobs([created, ...jobs]);
      }
    } catch (error: any) {
      setError(error.response.data.error || "failed to save job");
      setIsSumitting(false);
    }
  }
  async function handleDelete(job: Job) {
    if (!window.confirm("Delete " + job.company + "? This cannot be undone"))
      return;
    try {
      await deleteJob(job.id);
      setJobs(jobs.filter((j) => j.id !== job.id));
    } catch (error: any) {
      setError(error.response.data.error || "failed to delete job");
    }
  }
  // drag and drop handler
  const handleDragEnd = async (event: any) => {
    console.log("inside handle drag")
    // take the current array, and drag event and return new array
    // based on where the item got dropped
    const newArray = move(jobs, event);

    // resume got dropped in same spot or outside
    if (!newArray || newArray === jobs) {
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

    const updatedJob = { ...currentItem, orderIndex: newOrderIndex };
    const finalArray = newArray.map((r) =>
      r.id === draggedId ? updatedJob : r,
    );

    setJobs(finalArray);

    try {
      await updateJobOrder(draggedId, newOrderIndex);
    } catch (error) {
      logger.error(error, "Failed to save order");
      setJobs(jobs); // rollback
    }
  };


  const STATUS_MAP: Record<string, { label: string, color: string }> = {
    GHOSTED: { label: "Ghosted", color: "Gray" },
    APPLIED: { label: "Ghosted", color: "Green" },
    REJECTED: { label: "Ghosted", color: "Red" },
    SAVED: { label: "Saved", color: "Transparent" },
  }

  return (
    <div className="jobs">
      <div className="title">
        <h1>Jobs</h1>
        {/* <p>Track job applications</p> */}
      </div>
      <div className="container-header">
        <button className="new-btn" onClick={handleCreate}>
          <div>+</div> Add Job
        </button>
        <R_ToggleGroup
          value={statusFilter}
          onChange={setStatusFilter}
          items={STATUS_FILTERS}
        />
      </div>
      {jobs.length === 0 ? (
        <div>
          {/* <Briefcase /> */}
          <p>
            {statusFilter
              ? "No " + statusFilter.toLowerCase() + " jobs found"
              : "No job application yet. Start tracking!"}
          </p>
        </div>
      ) : (
        <div className={`item-holder${isDragging ? " dragging" : ""}`}>
          <DragDropProvider onDragEnd={handleDragEnd}>
            {jobs.map((job, index) => {
              const statusInfo = STATUS_MAP[job.status?.toString()] || STATUS_MAP.SAVED;
              return (
                <SortableJobItem
                  key={job.id}
                  id={job.id}
                  index={index}
                  onDragChange={setIsDragging}
                >

                  <div className="job-body" onClick={() => handleEdit(job)}>
                    <div className="topline">
                      <div className="job-status" title={
                        statusInfo.label
                      }
                        style={{
                          backgroundColor: statusInfo.color
                        }}
                      >
                        {job.status.substring(0, 1)}
                      </div>


                    </div>
                    <div className="midline">
                      <h3>{job.position}</h3>

                    </div>
                    <div className="bottomline">
                      <p >{job.appliedAt.substring(0, 10)}</p>
                      <p>{job.company}</p>
                    </div>

                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink />
                      </a>
                    )}
                    <div className="context-bar">
                      <button
                        title="Edit Job"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(job)
                        }
                        }>
                        <Edit />
                      </button>
                      <button
                        title="Delete"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(job)
                        }}>
                        <Trash2 />
                      </button>
                    </div>

                  </div>
                </SortableJobItem>
              );
            })}

          </DragDropProvider>
        </div>
      )}
      {/* create/edit popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title={editingJob ? "Edit Job" : "Add Job"}
      >
        <JobForm
          job={editingJob}
          resumes={resumes}
          onSubmit={handleSubmit}
          onCancel={handleClosePopup}
          isSubmitting={isSubmitting}
        />
      </Popup>
    </div>
  );
};

export default Jobs;
