import type {
  CreateResumeRequest,
  Resume,
  UpdateResumeRequest,
} from "../types/resume";
import api from "./api";

// get all user resumes
export async function getResumes(): Promise<Resume[]> {
  const response = await api.get<Resume[]>("/resumes");
  return response.data;
}

// get one resume by id
export async function getResume(id: string): Promise<Resume> {
  const response = await api.get<Resume>("/resumes/" + id);
  return response.data;
}

// create new resume
export async function createResume(data: CreateResumeRequest): Promise<Resume> {
  const response = await api.post<Resume>("/resumes", data);
  return response.data;
}

// update existing resume
export async function updateResume(
  id: string,
  data: UpdateResumeRequest,
): Promise<Resume> {
  const response = await api.put<Resume>("/resumes/" + id, data);
  return response.data;
}

// delete resume
export async function deleteResume(id: string): Promise<void> {
  await api.delete<Resume>("/resumes/" + id);
}

// compile resume and save the pdf in s3
// return updated resume with pdfurl
export async function compileResume(
  id: string,
  source: string,
): Promise<{ pdfUrl: string }> {
  // just making sure the server reponse has 'success and pdfUrl'
  const response = await api.post<{ success: boolean; pdfUrl: string }>(
    "/compile/save",
    { source, resumeId: id },
  );
  return { pdfUrl: response.data.pdfUrl };
}

// preview compiled pdf, this should return a blob (no saving)
export async function previewCompile(source: string): Promise<Blob> {
  const response = await api.post(
    "/compile",
    { source },
    { responseType: "blob" }, // this needed so axios will know that we recieving a pdf file
  );
  return response.data;
}
