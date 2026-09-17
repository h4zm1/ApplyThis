import { useEffect, useState, type FormEvent } from "react";
import type { CreateJobRequest, Job, JobStatus } from "../types/job";
import type { Resume } from "../types/resume";
import R_Select from "./ui/Select";
import R_ToggleGroup, { R_ToggleItem } from "./ui/ToggleGroup";

// form for creating/editing job application
interface JobFormProps {
  job: Job | null;
  resumes: Resume[]; // for linking resume
  onSubmit: (data: CreateJobRequest) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isNew: boolean;
}
// status options for dropdown
export const PRIME_STATUS: {
  value: JobStatus;
  label: string;
  disabled?: boolean;
}[] = [
  { value: "ALL", label: "All" },
  { value: "APPLIED", label: "Applied" },
  { value: "NO_REPLY", label: "Ghosted", disabled: true },
  { value: "REJECTED", label: "Rejected", disabled: true },
];
export const SECOND_STATUS: { value: JobStatus; label: string }[] = [
  { value: "INITIAL_INTERVIEW", label: "1st Interview" },
  { value: "SECOND_INTERVIEW", label: "2nd Interview" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "THIRD_INTERVIEW", label: "3nd Interview" },
  { value: "FINAL_INTERVIEW", label: "Final Interview" },
  { value: "OFFER", label: "Offer" },
];

const JobForm = ({
  job,
  resumes,
  onSubmit,
  onCancel,
  isSubmitting,
  isNew,
}: JobFormProps) => {
  // form state
  const [company, setCompany] = useState(job?.company || ""); // set to empty if on create mod or retrieve from job if we editing existing
  const [position, setPosition] = useState(job?.position || "");
  const [url, setUrl] = useState(job?.url || "");
  const isSubStatus = SECOND_STATUS.some((ss) => ss.value === job?.status)
    ? true
    : false;
  const [status, setStatus] = useState<JobStatus>(
    isSubStatus ? "APPLIED" : job?.status || "APPLIED",
  );
  // if there's a job status AND it one of the sub status then assign it to subStatus
  const [subStatus, setSubStatus] = useState<JobStatus | "">(
    isSubStatus ? job!.status : "",
  );
  const [notes, setNotes] = useState(job?.notes || "");
  const [resumeId, setResumeId] = useState(job?.resumeId || "");
  const [followUpAt, setFollowUpAt] = useState(
    job?.followUpAt ? job.followUpAt.split("T")[0] : "",
  ); // extract date
  const primeStatus = PRIME_STATUS.slice(1).map((ps) => ({
    ...ps,
    disabled: isNew && ps.value !== "APPLIED",
  }));
  // push new data into the state variables if the props change
  // this to update the form ui whenever we create/edit a job
  useEffect(() => {
    setCompany(job?.company || "");
    setPosition(job?.position || "");
    setUrl(job?.url || "");
    setStatus(status);
    setSubStatus(subStatus);
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
      status: status === "APPLIED" && subStatus ? subStatus : status,
      notes: notes || undefined,
      resumeId: resumeId || undefined,
      followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="popup-line">
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
      <div className="popup-line">
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
      <div className="popup-line">
        <label htmlFor="Url">Job URL</label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="status-popup-line">
        <div className="top">
          <label htmlFor="status">Status</label>
          <R_ToggleGroup
            value={status}
            onChange={(e) => {
              setStatus(e as JobStatus);
            }}
            items={primeStatus}
            // items={PRIME_STATUS.slice(1)}
          />
        </div>

        <div
          // only show extra status while editing "applied" job
          className={`second-toggle ${!isNew && status === "APPLIED" ? "visible" : ""}`}
        >
          <R_ToggleGroup
            value={subStatus}
            onChange={(e) => {
              setSubStatus(e as JobStatus);
            }}
            items={SECOND_STATUS}
            type="sub"
          />
        </div>
        {/* )} */}

        {/* <R_Select */}
        {/*   value={status} */}
        {/*   onChange={(e) => setStatus(e as JobStatus)} */}
        {/*   options={STATUS_OPTIONS.slice(1)} // we don't want "All" to appear in the list */}
        {/*   className="r-select" */}
        {/* /> */}
      </div>
      <div className="popup-line">
        <label htmlFor="resumeId">Linked Resume</label>
        <R_Select
          value={resumeId}
          onChange={(e) => setResumeId(e)}
          options={resumes}
          placeholder="No resume linked"
          className="r-select"
        />
      </div>
      <div className="popup-line">
        <label htmlFor="followUpAt">Follow Up Date</label>
        <input
          type="date"
          id="followUpAt"
          value={followUpAt}
          onChange={(e) => setFollowUpAt(e.target.value)}
        />
      </div>
      <div className="popup-line">
        {/* <label htmlFor="notes"> Notes</label> */}
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about the application.."
          rows={3}
        />
      </div>

      {/* <button type="button" onClick={onCancel} disabled={isSubmitting}> */}
      {/*   Cancel */}
      {/* </button> */}
      <button className="submit-btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
      </button>
    </form>
  );
};

export default JobForm;
