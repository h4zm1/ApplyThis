import { useEffect, useRef } from "react";
import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Props {
  data: bData[];
  width?: number;
  height?: number;
}
interface bData {
  name: string;
  thisWeek: number;
  lastWeek: number;
}

export default function OverlappingBarChart({
  data,
  width = 400,
  height = 400,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        width={width}
        height={height}
        barGap="-93%" // this will force the overlap of the two bars
        barCategoryGap="3%"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {/* <CartesianGrid strokeDasharray="3 3" /> */}
        <XAxis
          dataKey="dayName"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: "15px", fill: "black", fontWeight: "300" }}
        />
        {/* <YAxis /> */}
        {/* <Tooltip cursor={false} /> */}
        <Tooltip content={CustomTooltip} cursor={false} />
        {/* <Legend /> */}
        <linearGradient id="lastWeekGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="20%" stop-color="#E7E7E7" />
          <stop offset="100%" stop-color="#a3a3a3" />
          {/* <stop offset="100%" stop-color="#B7B7B7FF" /> */}
        </linearGradient>

        {/* THISWEEK BAR */}
        <Bar
          className="bar1"
          dataKey="lastWeek"
          opacity={0.3}
          // barSize={90}
          radius={15}
        />

        {/* LASTWEEK BAR */}
        <Bar
          className="bar2"
          dataKey="thisWeek"
          fill="#9a9a9a"
          opacity={1}
          // barSize={90}
          // stroke="#413ea0"
          // strokeWidth={5}
          radius={15}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CustomTooltip = ({ active, payload }: any) => {
  // save the last valid payload using Ref
  const lastPayloadRef = useRef<typeof payload>(null);
  // this to make sure the tooltip won't return to 0.0 coordinate when the cursor isn't over the chart
  useEffect(() => {
    if (active && payload?.length) {
      lastPayloadRef.current = payload;
    }
  }, [active, payload]);

  const displayPayload = payload?.length ? payload : lastPayloadRef.current;

  if (!displayPayload || !displayPayload.length) {
    return null;
  }

  if (!lastPayloadRef.current) return null;
  const data = lastPayloadRef.current[0]?.payload;
  // const twColor = lastPayloadRef.current[0]?.color;
  // const lwColor = lastPayloadRef.current[1]?.color;
  if (!data) return null;

  return (
    <div className="chart-tooltip bar-char-tooltip">
      <span>
        {"This "}
        {data.dayName}:
        <span className="tt-value" style={{ color: "currentColor" }}>
          {"" + data.thisWeek}
        </span>
      </span>
      <span>
        {"Last "}
        {data.dayName}:
        <span className="tt-value" style={{ color: "currentColor" }}>
          {"" + data.lastWeek}
        </span>
      </span>
    </div>
  );
};
