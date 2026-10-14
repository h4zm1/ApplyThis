import type {
  CreateJobRequest,
  Job,
  JobStats,
  UpdateJobRequest,
  WeeklyStats,
} from "../types/job";
import api from "./api";

// get all jobs for current user, with optional status filter
export async function getJobs(status?: string): Promise<Job[]> {
  const params = status ? { status } : {};
  const response = await api.get<Job[]>("/jobs", { params });
  return response.data;
}

// get job statistics (count by status)
export async function getJobStats(): Promise<JobStats> {
  const response = await api.get<JobStats>("/jobs/stats");
  return response.data;
}

// get single job by id
export async function getJob(id: string): Promise<Job> {
  const response = await api.get<Job>("/jobs/" + id);
  return response.data;
}

// create new job
export async function createJob(data: CreateJobRequest): Promise<Job> {
  const response = await api.post<Job>("/jobs", data);
  return response.data;
}

// update job
export async function updateJob(id: string, data: UpdateJobRequest) {
  const response = await api.put("/jobs/" + id, data);
  return response.data;
}

// delete job
export async function deleteJob(id: string): Promise<void> {
  await api.delete<Job>("/jobs/" + id);
}

export async function updateJobOrder(
  id: string,
  newOrderIndex: number,
): Promise<void> {
  // console.log("Sending:", { id, orderIndex: newOrderIndex });
  await api.post<Job>("/jobs/order/" + id, { orderIndex: newOrderIndex });
}

export async function getSankeyData() {
  const response = await api.get("/jobs/sankey");
  return response.data;
}
export async function getWeeklyData() {
  const response = await api.get("/jobs/weekly");
  return response.data;
}
export async function getWeeklyStats() {
  const response = await api.get<WeeklyStats[]>("/jobs/weeklystats");
  return response.data;
}
export async function getStaleJobsCount() {
  const response = await api.get("/jobs/stalecount");
  return response.data;
}
export async function markStaleJobsAsGhosted() {
  const response = await api.get("/jobs/markallstale");
  return response.data;
}
