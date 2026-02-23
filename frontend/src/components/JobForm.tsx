import { useEffect, useState, type FormEvent } from "react";
import type { CreateJobRequest, Job, JobStatus } from "../types/job";
import type { Resume } from "../types/resume";

// form for creating/editing job application
interface JobFormProps {
  job: Job | null;
  resumes: Resume[]; // for linking resume
  onSubmit: (data: CreateJobRequest) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
// status options for dropdown
export const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "GHOSTED", label: "Ghosted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SAVED", label: "Saved" },
];

const JobForm = ({
  job,
  resumes,
  onSubmit,
  onCancel,
  isSubmitting,
}: JobFormProps) => {
  // form state
  const [company, setCompany] = useState(job?.company || ""); // set to empty if on create mod or retrieve from job if we editing existing
  const [position, setPosition] = useState(job?.position || "");
  const [url, setUrl] = useState(job?.url || "");
  const [status, setStatus] = useState<JobStatus>(job?.status || "APPLIED");
  const [notes, setNotes] = useState(job?.notes || "");
  const [resumeId, setResumeId] = useState(job?.resumeId || "");
  const [followUpAt, setFollowUpAt] = useState(
    job?.followUpAt ? job.followUpAt.split("T")[0] : "",
  ); // extract date

  // push new data into the state variables if the props change
  useEffect(() => {
    setCompany(job?.company || "");
    setPosition(job?.position || "");
    setUrl(job?.url || "");
    setStatus(job?.status || "APPLIED");
    setNotes(job?.notes || "");
    setResumeId(job?.resumeId || "");
    setFollowUpAt(job?.followUpAt ? job.followUpAt.split("T")[0] : "");
  }, [job]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      company,
      position,
      url: url || undefined,
      status,
      notes: notes || undefined,
      resumeId: resumeId || undefined,
      followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="company"> Company</label>
        <input
          type="text"
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g., CDPR"
          required
        />
      </div>
      <div>
        <label htmlFor="position"> Position</label>
        <input
          type="text"
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="e.g., Janitor"
          required
        />
      </div>
      <div>
        <label htmlFor="Url">Job URL</label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
        >
          {STATUS_OPTIONS.map((opts) => (
            <option key={opts.value} value={opts.value}>
              {opts.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="resumeId">Linked Resume</label>
        <select
          id="resumeId"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
        >
          <option value="">No resume linked</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="followUpAt">Follow Up Date</label>
        <input
          type="date"
          id="followUpAt"
          value={followUpAt}
          onChange={(e) => setFollowUpAt(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="notes"> Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about the application.."
          rows={3}
        />
      </div>

      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
      </button>
    </form>
  );
};

export default JobForm;
