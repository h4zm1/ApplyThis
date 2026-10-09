import { JobStatus } from "@prisma/client";

export const SAMPLE_LATEX = String.raw`\\documentclass{article}

    \\begin{document}

    \\section* {NAME}
    Contact info.

    \\section* {Experience}
    Experience here.

    \\section* {Education}
    Education here.

\\end{document}
    `;

type DemoJob = {
  company: string;
  position: string;
  status: JobStatus;
  history: { status: JobStatus; daysAgo: number }[];
};

export const DEMO_JOBS: DemoJob[] = [
  {
    company: "A",
    position: "Frontend Developer",
    status: "APPLIED",
    history: [{ status: "APPLIED", daysAgo: 2 }],
  },
  {
    company: "B",
    position: "Full Stack Engineer",
    status: "TECHNICAL",
    history: [
      { status: "APPLIED", daysAgo: 12 },
      { status: "INITIAL_INTERVIEW", daysAgo: 8 },
      { status: "TECHNICAL", daysAgo: 3 },
    ],
  },
  {
    company: "C",
    position: "Backend Developer",
    status: "REJECTED",
    history: [
      { status: "APPLIED", daysAgo: 20 },
      { status: "REJECTED", daysAgo: 9 },
    ],
  },
  {
    company: "D",
    position: "Software Engineer",
    status: "OFFER",
    history: [
      { status: "APPLIED", daysAgo: 30 },
      { status: "INITIAL_INTERVIEW", daysAgo: 24 },
      { status: "TECHNICAL", daysAgo: 17 },
      { status: "FINAL_INTERVIEW", daysAgo: 8 },
      { status: "OFFER", daysAgo: 1 },
    ],
  },
];
