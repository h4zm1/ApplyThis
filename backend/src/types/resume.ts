// what user needs when creating/updating resume
export interface CreateResumeDto {
  name: string;
  source: string;
}

export interface UpateResumeDto {
  name?: string;
  source?: string;
}

// what we return to client
export interface ResumeResponse {
  id: string;
  name: string;
  pdfUrl: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}
