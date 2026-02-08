export interface Resume {
  id: string;
  name: string;
  source: string;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// sperate request types for what the client will send (easier, cleaner and safer to handle)
export interface CreateResumeRequest {
  name: string;
  source: string;
}

export interface UpdateResumeRequest {
  name?: string;
  source?: string;
}
