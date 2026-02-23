import type { CreateJobRequest, Job } from "../types/job";
import { useEffect, useState } from "react";
import type { Resume } from "../types/resume";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJob,
} from "../services/jobService";
import { getResumes } from "../services/resumeService";
import logger from "../services/logger";
import JobForm, { STATUS_OPTIONS } from "../components/JobForm";
import { Briefcase, Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import Popup from "../components/popUp";

// filter options
const STATUS_FILTERS = STATUS_OPTIONS;

const Jobs = () => {
  // data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsloading] = useState(true);
  const [error, setError] = useState("");
  // filter state
  const [statusFilter, setStatusFilter] = useState("");
  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSumitting] = useState(false);

  // load data on mount and when filter change
  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    try {
      // load jobs in resumes at smae time
      const [jobsData, resumeData] = await Promise.all([
        getJobs(statusFilter || undefined),
        getResumes(),
      ]);
      setJobs(jobsData);
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
  return (
    <div>
      <div>
        <h1>Jobs</h1>
        <p>Track job applications</p>
      </div>
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleCreate}>
        <Plus />
        Add Job
      </button>
      {/* job list */}
      <div>
        {jobs.length === 0 ? (
          <div>
            <Briefcase />
            <p>
              {statusFilter
                ? "No " + statusFilter.toLowerCase() + " jobs found"
                : "No job application yet. Start tracking!"}
            </p>
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <div key={job.id}>
                <h3>{job.position}</h3>
                <p>{job.company}</p>
                {job.status}
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                  </a>
                )}
                <button onClick={() => handleEdit(job)}>
                  <Edit />
                </button>
                <button onClick={() => handleDelete(job)}>
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
