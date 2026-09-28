import { Job, Prisma } from "@prisma/client";
import prisma from "../config/database";
import logger from "../config/logger";
import { createJobDto, JobStatus, updateJobDto } from "../types/job";

// get all jobs for a user
export async function getUserJobs(userId: string, status?: string) {
  const filter = status && status.toLowerCase() !== "all" ? status : undefined;
  return (
    await prisma.job.findMany({
      where: {
        userId,
        ...(filter && { status: filter as JobStatus }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        resume: {
          select: {
            id: true,
            name: true,
            pdfUrl: true,
          },
        },
      },
    })
  ).map((j: Job) => ({ ...j, orderIndex: j.orderIndex.toNumber }));
}

// get a single job by id
export async function getJobById(id: string, userId: string) {
  const job = await prisma.job.findFirst({
    where: { id, userId },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });
  /* this will return something liek this:
  "id": "job_123",
  "userId": "user_456",
  "status": "APPLIED",
  "updatedAt": "2026-02-22",
  "resume": {
    "id": "res_789",
    "name": "resume2.pdf",
    "pdfUrl": "https://s3..."
  }
  */

  if (!job) throw new Error("job not found");

  return job;
}

// create new job
export async function createJob(userId: string, data: createJobDto) {
  // if resume provided, verify it belong to user
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId },
    });

    if (!resume) throw new Error("resume not found");
  }

  // find the lowest orderIndex to put the new job on top of it
  const lastJob = await prisma.job.findFirst({
    where: { userId },
    orderBy: { orderIndex: "asc" },
  });

  // calculate new index: current lowest - 1000 (or 0 if it's first)
  const newOrder = lastJob
    ? new Prisma.Decimal(lastJob.orderIndex).minus(1000)
    : new Prisma.Decimal(0);

  // using transaction here so job creation and status history log fail or successed together
  const job = await prisma.$transaction(async (tx) => {
    const newJob = await tx.job.create({
      data: {
        company: data.company,
        position: data.position,
        url: data.url,
        status: "APPLIED",
        notes: data.notes,
        followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
        resumeId: data.resumeId,
        userId,
        orderIndex: newOrder,
      },
      include: {
        resume: {
          select: {
            id: true,
            name: true,
            pdfUrl: true,
          },
        },
      },
    });

    // initial status will be "applied" and "tostatus" is null cause there no previous status
    await tx.jobStatusHistory.create({
      data: {
        jobId: newJob.id,
        fromStatus: null,
        toStatus: "APPLIED",
      },
    });
    return newJob;
  });

  logger.info({ jobId: job.id, company: job.company, userId }, "job created");
  return job;
}

// update job
export async function updateJob(
  id: string,
  userId: string,
  data: updateJobDto,
) {
  const existing = await prisma.job.findFirst({
    where: { id, userId },
  });

  if (!existing) throw new Error("job not found");

  // if resumeId provided, verify it belong to user
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId, userId },
    });

    if (!resume) throw new Error("resume not found");
  }

  // only log status history if status actually changed
  const statusChanged = data.status && data.status !== existing.status;
  if (statusChanged) {
    const job = await prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          ...(data.company && { company: data.company }),
          ...(data.position && { position: data.position }),
          ...(data.url !== undefined && { url: data.url }), // if it's undefined, don't update
          ...(data.status && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.followUpAt !== undefined && {
            followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
          }),
          ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
        },
        include: {
          resume: {
            select: {
              id: true,
              name: true,
              pdfUrl: true,
            },
          },
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId: id,
          fromStatus: existing.status,
          toStatus: data.status!,
        },
      });
      return updatedJob;
    });
    logger.info(
      { jobId: id, userId, from: existing.status, to: data.status },
      "job status changed",
    );
    return job;
  }

  // no status changed, just updated job as normal
  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(data.company && { company: data.company }),
      ...(data.position && { position: data.position }),
      ...(data.url !== undefined && { url: data.url }), // if it's undefined, don't update
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.followUpAt !== undefined && {
        followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
      }),
      ...(data.resumeId !== undefined && { resumeId: data.resumeId }),
    },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
          pdfUrl: true,
        },
      },
    },
  });
  logger.info({ jobId: id, userId }, "job updated");
  return job;
}

// delete job
export async function deleteJob(id: string, userId: string) {
  // check it exist first
  const job = await prisma.job.findFirst({
    where: { id, userId },
  });

  if (!job) {
    throw new Error("job not found");
  }

  await prisma.job.delete({
    where: { id },
  });

  logger.info({ jobId: id, userId }, "job deleted");
}

// get job stats for user
export async function getJobStats(userId: string) {
  // this will return something like: [{status:'APPLIED', _cound:{status:10},{status:'GHOSTED',_count:{status:10}}}]
  const stats = await prisma.job.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  // convert to object
  const result: Record<string, number> = {
    SAVED: 0,
    APPLIED: 0,
    GHOSTED: 0,
    REJECTED: 0,
    TOTAL: 0,
  };

  for (const stat of stats) {
    result[stat.status] = stat._count.status; // look for the status category and fill it
    result.TOTAL += stat._count.status; // keep adding to overall total
  }
  return result;
}

export async function updateJobOrderInDB(
  jobId: string,
  userId: string,
  orderIndex: number,
) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });
  if (!job) throw new Error("job not found");

  await prisma.job.update({
    where: { id: jobId },
    data: { orderIndex },
  });
}

// gather all transition for this user
// and prepare them for rechart sankey diagram
export async function getSankeyData(userId: string) {
  const history = await prisma.jobStatusHistory.findMany({
    where: {
      job: { userId },
      // sanky need source and target so we skipping the initial "applied" entries (cause they have no "from")
      fromStatus: { not: null },
    },
  });

  //if no history return empty
  if (history.length === 0) return { nodes: [], links: [] };

  // we need to create a map where the key is "fromStatus"=>"toStatus" and vlaue thier occurances
  const transitionCounts = new Map<string, number>();

  history.forEach((entry) => {
    const key = `${entry.fromStatus}->${entry.toStatus}`;
    const value = (transitionCounts.get(key) || 0) + 1; // on first encounter: undefined||0 = 0+1 = 1, 2nd encounter 1||1 = 1+1 = 2
    transitionCounts.set(key, value);
  });

  // only stores unique values
  const statusSet = new Set<string>();
  history.forEach((entry) => {
    if (entry.fromStatus) statusSet.add(entry.fromStatus);
    statusSet.add(entry.toStatus);
  });

  // convert to array of nodes for rechart
  // [{ name: "APPLIED" }, { name: "REJECTED" }, ...]
  const nodes = Array.from(statusSet).map((status) => ({
    // takes INITIAL_INTERVIEW and make it Initial Interview
    name: status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" "),
  }));

  // links for rechart
  // [{ source: 0, target: 1, value: 4 }, ...]
  // source and target are indexed into nodes
  const links: { source: number; target: number; value: number }[] = [];

  transitionCounts.forEach((count, key) => {
    const [from, to] = key.split("->");

    const fromFormatted = from
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");

    const toFormatted = to
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");

    const sourceIndex = nodes.findIndex((n) => n.name === fromFormatted);
    const targetIndex = nodes.findIndex((n) => n.name === toFormatted);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: count,
      });
    }
  });
  /* output will look like this
 {
  nodes: [
    { name: "Applied" },
    { name: "Initial Interview" },
    { name: "Technical" },
    { name: "Rejected" }
  ],

  links: [
    { source: 0, target: 1, value: 2 },
    { source: 1, target: 2, value: 1 },
    { source: 2, target: 3, value: 1 },
    { source: 0, target: 3, value: 1 }
  ]
}

*/

  return { nodes, links };
}

export async function getBarData(userId: string) {
  const jobs = await prisma.job.findMany({
    where: { userId },
  });
  if (jobs.length === 0) return {};

  // take the time out
  const trueDate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0=sunday 1=monday 6=saturday

  // this week
  // if today is sunday we go back 6 days, otherwise we go back (currentDayofweek - 1) days
  const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const thisMonday = trueDate(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysSinceMonday,
    ),
  );

  // last week boundries (from monday to sunday)
  const lastWeekMonday = trueDate(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysSinceMonday - 7,
    ),
  );
  const lastWeekSunday = trueDate(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - daysSinceMonday - 1,
    ),
  );
  const weeklyData: { dayName: string; thisWeek: number; lastWeek: number }[] =
    [
      { dayName: "Monday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Tuesday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Wednesday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Thursday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Friday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Saturday", thisWeek: 0, lastWeek: 0 },
      { dayName: "Sunday", thisWeek: 0, lastWeek: 0 },
    ];
  const dayIndex = [6, 0, 1, 2, 3, 4, 5];

  jobs.forEach((job, i) => {
    const jobDate = new Date(job.appliedAt);
    const dayName = jobDate.toLocaleDateString("en-US", { weekday: "long" });
    const applyDate = trueDate(job.appliedAt); // convert date to numbers
    const index = dayIndex[jobDate.getDay()];
    // if the date is between this monday and today
    if (applyDate >= thisMonday && applyDate <= trueDate(today)) {
      weeklyData[index].thisWeek += 1;
    }
    if (applyDate >= lastWeekMonday && applyDate <= lastWeekSunday) {
      weeklyData[index].lastWeek += 1;
    }
  });

  return weeklyData;
}
