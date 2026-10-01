import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getJobStats,
  getJobs,
  getSankeyData,
  getWeeklyData,
  getWeeklyStats,
} from "../services/jobService";
import { getResumes } from "../services/resumeService";
import type { JobStats, Job, WeeklyStats } from "../types/job";
import type { Resume } from "../types/resume";
import { useAction } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import SankeyChart from "../components/SankeyChart";
import NortheastIcon from "@mui/icons-material/NorthEast";
import WeeklyBarChart from "../components/BarChart";
import type { BData } from "../components/BarChart.tsx";

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
  const [barCharData, setBarChartData] = useState<BData[]>([]);
  const [weeklyStatsData, setWeeklyStatsData] = useState<WeeklyStats[]>([]);

  // useEffect will run code when component mounts (like ngOnInit in angular)
  // empty array [] means run once on mount
  useEffect(() => {
    loadDashboardData();
    setHeaderTitle(user?.email + " > Dashboard");
  }, []);

  function getPercentage(lw: number, tw: number) {
    if (lw === 0 && tw === 0) return 0;
    if (lw === 0 && tw > 0) return 100;
    const dif = tw - lw;
    const prcnt = (dif / lw) * 100;
    return Math.trunc(prcnt);
  }

  // calculate all change percentage in one go
  const percentages = weeklyStatsData.map((stat) =>
    getPercentage(stat.lastWeek, stat.thisWeek),
  );

  // load all dashboard data at same time
  async function loadDashboardData() {
    try {
      // Promise.all can run many async calls in parallel like forkJoin in rxjs (and wait for all to finish before emmiting)
      const [
        statsData,
        jobsData,
        resumesData,
        sankeyResult,
        weeklyResult,
        weeklyStatsResult,
      ] = await Promise.all([
        getJobStats(),
        getJobs(),
        getResumes(),
        getSankeyData(),
        getWeeklyData(),
        getWeeklyStats(),
      ]);
      console.log(statsData);
      setStats(statsData);
      setRecentJobs(jobsData.slice(0, 2)); // only show recent 5
      setRecentResumes(resumesData.slice(0, 2));
      setSankeyData(sankeyResult);
      setBarChartData(weeklyResult);
      setWeeklyStatsData(weeklyStatsResult);
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
        {/* <p>Track your job applications</p> */}
      </div>
      <div className="overview-content">
        <div className="card-holder">
          <div className="side-div"></div>
          <div className="c-1 status-card corner-highlight left-corners-highlight">
            <span className="status-name">Applied</span>
            <div>
              <span className="status-value">
                {weeklyStatsData[0].thisWeek}
              </span>
              <span
                className={`weekly-perecentage ${percentages[0] === 0 ? "zero" : percentages[0] > 0 ? "positive" : "negative"}`}
              >
                <NortheastIcon sx={{ fontSize: 15 }}></NortheastIcon>
                {percentages[0]}%
              </span>
            </div>
            <span className="lastweek-value">
              {weeklyStatsData[0].lastWeek} in last week
            </span>
          </div>
          <div className="c-2 status-card">
            <span className="status-name">Initial Interview</span>
            <div>
              <span className="status-value">
                {weeklyStatsData[1].thisWeek}
              </span>
              <span
                className={`weekly-perecentage ${percentages[1] === 0 ? "zero" : percentages[1] > 0 ? "positive" : "negative"}`}
              >
                <NortheastIcon sx={{ fontSize: 15 }}></NortheastIcon>
                {percentages[1]}%
              </span>
            </div>
            <span className="lastweek-value">
              {weeklyStatsData[1].lastWeek} in last week
            </span>
          </div>
          <div className="c-22 status-card">
            <span className="status-name">Ghosted</span>
            <div>
              <span className="status-value">
                {weeklyStatsData[2].thisWeek}
              </span>
              <span
                className={`weekly-perecentage ${percentages[2] === 0 ? "zero" : percentages[2] > 0 ? "positive" : "negative"}`}
              >
                <NortheastIcon sx={{ fontSize: 15 }}></NortheastIcon>
                {percentages[2]}%
              </span>
            </div>
            <span className="lastweek-value">
              {weeklyStatsData[2].lastWeek} in last week
            </span>
          </div>
          <div className="c-3 status-card corner-highlight right-corners-highlight">
            <span className="status-name">Rejected</span>
            <div>
              <span className="status-value">
                {weeklyStatsData[3].thisWeek}
              </span>
              <span
                className={`weekly-perecentage ${percentages[3] === 0 ? "zero" : percentages[3] > 0 ? "positive" : "negative"}`}
              >
                <NortheastIcon sx={{ fontSize: 15 }}></NortheastIcon>
                {percentages[3]}%
              </span>
            </div>
            <span className="lastweek-value">
              {weeklyStatsData[3].lastWeek} in last week
            </span>
          </div>
          <div className="side-div"></div>
        </div>
        <div className="extension-btn">
          <p>Start tracking jobs easily with this Firefox extension</p>
          <a href="https://addons.mozilla.org/en-US/firefox/addon/applythis/">
            ApplyThis
          </a>
        </div>
        <div className="bar-chart">
          <WeeklyBarChart data={barCharData}></WeeklyBarChart>
        </div>
        <div className="recent-jobs corner-highlight left-corners-highlight right-corners-highlight">
          <div className="rj-title">recent jobs</div>
          {recentJobs.length === 0 ? (
            <div className="no-recent-job">
              <p>No job applications yet</p>
              <Link to="/jobs">Add your first application</Link>
            </div>
          ) : (
            <div className="rj-list">
              {recentJobs.map((job) => (
                <div className="rj-job" key={job.id}>
                  <div>
                    <span>{job.position}</span>
                    <span>{job.company}</span>
                  </div>
                  <div>
                    <span>{job.status}</span>
                    <span>{job.appliedAt.substring(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rj-title">recent resumes</div>

          {recentResumes.length === 0 ? (
            <div className="empty-state">
              <p>No resumes yet</p>
              <Link to="/resumes">Create your first resume</Link>
            </div>
          ) : (
            <div>
              {recentResumes.map((resume) => (
                <div className="rj-list" key={resume.id}>
                  <div className="rj-job">
                    <span>{resume.name}</span>
                    <span>
                      {resume.pdfUrl ? "PDF compiled" : "Not compiled"}
                    </span>
                  </div>
                  <span>{resume.updatedAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="filler-div" style={{ gridArea: "topMid" }}></div>
        <div
          className="filler-div"
          style={{ gridArea: "midMid", borderTop: "unset" }}
        ></div>
        <div
          className="filler-div"
          style={{
            gridArea: "topRight2",
            borderLeft: "1px dashed #80808047",
            // borderBottom: "unset",
          }}
        ></div>
        <div
          className="filler-div"
          style={{
            gridArea: "midRight2",
            borderLeft: "1px dashed var(--border-color);",
            borderBottom: "unset",
            borderTop: "unset",
          }}
        ></div>
      </div>
      <SankeyChart data={sankeyData} width={800} height={200} />

      {/* recent jobs */}

      {/* recent resumes */}
    </div>
  );
};

export default Dashboard;
