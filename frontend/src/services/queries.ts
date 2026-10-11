import { queryOptions } from "@tanstack/react-query";
import { keys } from "./queryKeys";
import {
  getJobs,
  getJobStats,
  getSankeyData,
  getWeeklyData,
  getWeeklyStats,
} from "./jobService";
import { getResumes } from "./resumeService";
import type { Job } from "../types/job";
import { queryClient } from "./queryClient";

// since we gonna be using the same job list between the overview page and jobs page they both need to be the same
export const normalizeJob = (j: Job): Job => ({
  ...j,
  orderIndex: Number(j.orderIndex || 0),
});

export const statsQuery = queryOptions({
  queryKey: keys.stats,
  queryFn: getJobStats,
});
export const jobsQuery = queryOptions({
  queryKey: keys.jobs,
  queryFn: async () => (await getJobs()).map(normalizeJob),
});
export const resumesQuery = queryOptions({
  queryKey: keys.resumes,
  queryFn: getResumes,
});
export const sankeyQuery = queryOptions({
  queryKey: keys.sankey,
  queryFn: getSankeyData,
});
export const weeklyQuery = queryOptions({
  queryKey: keys.weekly,
  queryFn: getWeeklyData,
});
export const weeklyStatsQuery = queryOptions({
  queryKey: keys.weeklyStats,
  queryFn: getWeeklyStats,
});

export const dashboardQueries = [
  statsQuery,
  jobsQuery,
  resumesQuery,
  sankeyQuery,
  weeklyQuery,
  weeklyStatsQuery,
];

// this will get called after any change to jobs,
// loop through list of cache keys and invalidate them and force them to refetch fresh data
export function invalidateJobData() {
  return Promise.all(
    [keys.jobs, keys.stats, keys.sankey, keys.weekly, keys.weeklyStats].map(
      (queryKey) => queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
