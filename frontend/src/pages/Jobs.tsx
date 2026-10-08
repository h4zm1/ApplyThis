import type { CreateJobRequest, Job, JobStats, JobStatus } from "../types/job";
import { useEffect, useState } from "react";
import type { Resume } from "../types/resume";
import {
  createJob,
  deleteJob,
  getJobs,
  markStaleJobsAsGhosted,
  updateJob,
  updateJobOrder,
} from "../services/jobService";
import { getResumes } from "../services/resumeService";
import logger from "../services/logger";
import JobForm, { PRIME_STATUS, SECOND_STATUS } from "../components/JobForm";
import { ArrowBigDown, BrushCleaning, Edit, File, Trash2 } from "lucide-react";
import Popup from "../components/popUp";
import R_ToggleGroup from "../components/ui/ToggleGroup";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import SortableJobItem from "../components/SortableJobItem";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Tooltip from "../components/ui/tooltip";
import { useUIContext } from "../context/UIContext";

// filter options
export const STATUS_FILTERS: {
  value: JobStatus;
  label: string;
  disabled?: boolean;
}[] = [
  { value: "ALL", label: "All" },
  { value: "APPLIED", label: "Applied" },
  { value: "NO_REPLY", label: "Ghosted" },
  { value: "REJECTED", label: "Rejected" },
];

const Jobs = () => {
  // data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsloading] = useState(true);
  const [error, setError] = useState("");
  const [statusColor, setStatusColor] = useState("");
  // filter state
  const [statusFilter, setStatusFilter] = useState(() => {
    const saved = localStorage.getItem("JOB-FILTER");
    return saved !== null ? saved : "ALL";
  });
  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSumitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { setHeaderTitle } = useAction();
  const { user } = useAuth();
  const { staleCount, setStaleCount } = useUIContext();
  const navigate = useNavigate();

  // load data on mount and when filter change
  useEffect(() => {
    loadData();
    localStorage.setItem("JOB-FILTER", statusFilter);
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
        orderIndex: Number(j.orderIndex || 0),
      }));
      setJobs(normalized);
      setResumes(resumeData);
    } catch (error) {
      setError("failed to load job data");
      logger.error(error);
    } finally {
      setIsloading(false);
    }
  }

  function isGhosted(SChangeDate: string, status: string) {
    const SCDate = new Date(SChangeDate);
    const difMs = Date.now() - SCDate.getTime();
    const difDays = Math.floor(difMs / (1000 * 60 * 60 * 24));
    // console.log(status + " days since last status change " + difDays);
    if (difDays >= 14 && status != "NO_REPLY") return true;
  }
  async function setGhosted(id: string) {
    try {
      const response = await updateJob(id, { status: "NO_REPLY" });
      const updatedJob = response.job;
      setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      setStaleCount(response.meta.stalecount);
    } catch (error) {
      console.error("Ghosted failed", error);
    }
  }

  const clearAllStale = async () => {
    setIsClearing(true);
    try {
      const response = await markStaleJobsAsGhosted();
      const updatedIds = new Set(response.updatedIds);

      setStaleCount(response.newStaleCount);
      setJobs(
        jobs.map((j) => {
          // if the job is stale, update it's status and date
          // if (isGhosted(j.lastStatusChangedAt, j.status)) {
          if (updatedIds.has(j.id)) {
            return {
              ...j,
              status: "NO_REPLY",
              lastStatusChangedAt: new Date().toISOString(),
            };
          }
          // otherwise keep it as it is
          return j;
        }),
      );
    } catch (error) {
      console.error("failed to clear stale jobs", error);
    } finally {
      setIsClearing(false);
    }
  };

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
  function openAttachedResume(job: Job) {
    navigate("/editor/" + job.resumeId);
  }
  async function handleSubmit(data: CreateJobRequest) {
    setIsSumitting(true);
    try {
      if (editingJob) {
        const updated = await updateJob(editingJob.id, data);
        setJobs(jobs.map((j) => (j.id === updated.job.id ? updated.job : j)));
      } else {
        const created = await createJob(data);
        setJobs([created, ...jobs]);
      }
      setIsPopupOpen(false);
      setIsSumitting(false);
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
    console.log("inside handle drag");
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

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NO_REPLY: { label: "Ghosted", color: "#d2d2d2" },
    APPLIED: { label: "Applied", color: "#b0ffb0" },
    REJECTED: { label: "Rejected", color: "#ffb1b1" },
    SAVED: { label: "Saved", color: "Transparent" },
  };
  let noJobMessage = "";
  switch (statusFilter) {
    case "NO_REPLY":
      noJobMessage = "No one ghosted you yet!";
      break;
    case "APPLIED":
      noJobMessage = "No jobs match the current filter";
      break;
    case "REJECTED":
      noJobMessage = "No rejections so far";
      break;
    default:
      noJobMessage = "Nothing to show";
  }

  // show loading indic
  if (isLoading) {
    return (
      <div className="loading-holder">
        <div className="loader-spinner"></div>
        <span>Loading jobs</span>
      </div>
    );
  }

  return (
    <div className="jobs">
      <div className="page-title">
        <span>Jobs</span>
        {/* <p>Track job applications</p> */}
      </div>
      <div className="container-header">
        <button className="new-btn" onClick={handleCreate}>
          <div>+</div> Add Job
        </button>
        <button
          className="clean-stale-btn"
          onClick={clearAllStale}
          disabled={staleCount === 0 ? true : false}
        >
          <BrushCleaning size={18}></BrushCleaning>
          {isClearing ? "Clearing..." : " Clear stale jobs"}
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
            {noJobMessage}
            {/* {statusFilter */}
            {/*   ? "No " + statusFilter.toLowerCase() + " jobs found" */}
            {/*   : "No job application yet. Start tracking!"} */}
          </p>
        </div>
      ) : (
        <div className={`item-holder${isDragging ? " dragging" : ""}`}>
          <DragDropProvider onDragEnd={handleDragEnd}>
            {jobs.map((job, index) => {
              const statusInfo =
                STATUS_MAP[job.status?.toString()] || STATUS_MAP.APPLIED;
              return (
                <SortableJobItem
                  key={job.id}
                  id={job.id}
                  index={index}
                  onDragChange={setIsDragging}
                >
                  <div className="job-body" onClick={() => handleEdit(job)}>
                    <div className="topline">
                      <Tooltip label={statusInfo.label}>
                        <div
                          className="job-status"
                          // title={statusInfo.label}
                          style={{
                            backgroundColor: statusInfo.color,
                          }}
                        >
                          {PRIME_STATUS.find(
                            (ps) => ps.value === job.status,
                          )?.label.substring(0, 1) ||
                            SECOND_STATUS.find(
                              (ss) => ss.value === job.status,
                            )?.label.substring(0, 1)}
                        </div>
                      </Tooltip>
                      <div
                        className={`ghost-switcher ${isGhosted(job.lastStatusChangedAt, job.status) ? "on" : "off"}`}
                      >
                        <Tooltip label={"You definitely got ghosted"}>
                          <ArrowBigDown
                            size={18}
                            style={{ color: "#4f4f4f40" }}
                          ></ArrowBigDown>
                        </Tooltip>
                        <Tooltip label={"Mark as Ghosted"}>
                          <h1
                            className="g-mark"
                            // title={statusInfo.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              setGhosted(job.id);
                            }}
                          >
                            G
                          </h1>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="midline">
                      <h3>{job.position}</h3>
                    </div>
                    <div className="bottomline">
                      <p>{job.appliedAt.substring(0, 10)}</p>
                      <p>{job.company}</p>
                    </div>

                    {/* {job.url && ( */}
                    {/*   <a href={job.url} target="_blank" rel="noopener noreferrer"> */}
                    {/*     <ExternalLink /> */}
                    {/*   </a> */}
                    {/* )} */}
                    <div className="context-bar">
                      <Tooltip label="Edit Job">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(job);
                          }}
                        >
                          <Edit />
                        </button>
                      </Tooltip>

                      <Tooltip label="Delete">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(job);
                          }}
                        >
                          <Trash2 />
                        </button>
                      </Tooltip>

                      <Tooltip label="Resume">
                        <button
                          disabled={job.resumeId ? false : true}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openAttachedResume(job);
                          }}
                        >
                          <File />
                        </button>
                      </Tooltip>
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
          isNew={editingJob ? false : true}
        />
      </Popup>
    </div>
  );
};

export default Jobs;
