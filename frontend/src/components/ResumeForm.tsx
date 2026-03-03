import { useEffect, useState, type FormEvent } from "react";
import type { CreateResumeRequest, Resume } from "../types/resume";
import LateXEditor from "./LaTeXEditor";

interface ResumeFormProps {
  resume: Resume | null; // existing resume to edit (null for creating new)
  onSubmit: (data: CreateResumeRequest) => void; // callback with from data
  onCancel: () => void; // callback with user cancel
  isSubmitting: boolean; // disable form while submiting
}

const ResumeForm = ({
  resume,
  onSubmit,
  onCancel,
  isSubmitting,
}: ResumeFormProps) => {
  // initialize with existing resume data or start empty
  const [name, setName] = useState(resume?.name || "");

  // update form when resume prop change
  useEffect(() => {
    setName(resume?.name || "");
  }, [resume]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Resume Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Resume One"
          required
        />
      </div>
      <button type="button" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : resume ? "Update" : "Create"}
      </button>
    </form>
  );
};

export default ResumeForm;
