import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getJobStats, getJobs, getSankeyData } from "../services/jobService";
import { getResumes } from "../services/resumeService";
import type { JobStats, Job } from "../types/job";
import type { Resume } from "../types/resume";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import SankeyChart from "../components/SankeyChart";

// only showing job stats, resumes and recent applications for now
const Dashboard = () => {
  // state for our data
  // useState returns [currentValue, setterFunction]
  const [stats, setStats] = useState<JobStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentResumes, setRecentResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { setHeaderTitle } = useAction();
  const [sankeyData, setSankeyData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });

  // useEffect will run code when component mounts (like ngOnInit in angular)
  // empty array [] means run once on mount
  useEffect(() => {
    loadDashboardData();
    setHeaderTitle(user?.email + " > Dashboard");
  }, []);

  // load all dashboard data at same time
  async function loadDashboardData() {
    try {
      // Promise.all can run many async calls in parallel like forkJoin in rxjs (and wait for all to finish before emmiting)
      const [statsData, jobsData, resumesData, sankeyResult] =
        await Promise.all([
          getJobStats(),
          getJobs(),
          getResumes(),
          getSankeyData(),
        ]);

      setStats(statsData);
      setRecentJobs(jobsData.slice(0, 5)); // only show recent 5
      setRecentResumes(resumesData.slice(0, 5));
      setSankeyData(sankeyResult);
    } catch (error) {
      setError("failed to load dashboard data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // show loading state
  if (isLoading) {
    return (
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div>
        <p className="title">Overview</p>
        <p>Track your job applications</p>
      </div>
      <div className="card-holder">
        <div className="c-1"></div>
        <div className="c-2"></div>
        <div className="c-3"></div>
      </div>
      <SankeyChart data={sankeyData} width={800} height={200} />

      {/* TODO: make these cards */}
      <div>
        <div>
          <div>Total Applications</div>
          <div>{stats?.total || 0}</div>
        </div>

        <div>
          <div>Applied</div>
          <div>{stats?.APPLIED || 0}</div>
        </div>

        <div>
          <div>Rejected</div>
          <div>{stats?.REJECTED || 0}</div>
        </div>

        <div>
          <div>Ghosted</div>
          <div>{stats?.NO_REPLY || 0}</div>
        </div>
      </div>

      {/* recent jobs */}
      <div>
        <h2>Recent Applications</h2>
        {/* if no job found put a link for job page*/}
        {recentJobs.length === 0 ? (
          <div>
            <p>No job applications yet</p>
            <Link to="/jobs">Add your first application</Link>
          </div>
        ) : (
          <ul>
            {/* 
              .map() loops over array and returns JSX for each item
              like @for in angular
              'key' prop here is like 'track'
            */}
            {recentJobs.map((job) => (
              <li key={job.id}>
                <div>
                  <h3>{job.position}</h3>
                  <p>{job.company}</p>
                </div>
                <div>
                  <span>{job.status}</span>
                  <span>{job.appliedAt}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* recent resumes */}
      <div>
        <h2>Resumes</h2>

        {recentResumes.length === 0 ? (
          <div className="empty-state">
            <p>No resumes yet</p>
            <Link to="/resumes">Create your first resume</Link>
          </div>
        ) : (
          <ul>
            {recentResumes.map((resume) => (
              <li key={resume.id}>
                <div>
                  <h3>{resume.name}</h3>
                  <p>{resume.pdfUrl ? "PDF compiled" : "Not compiled"}</p>
                </div>
                <span>{resume.updatedAt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
