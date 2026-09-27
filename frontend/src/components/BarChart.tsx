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

const data = [
  { name: "Monday", mainData: 3, targetData: 5 },
  { name: "Tuesday", mainData: 6, targetData: 3 },
  { name: "Wednesday", mainData: 0, targetData: 2 },
  { name: "Thursay", mainData: 1, targetData: 1 },
  { name: "Friday", mainData: 1, targetData: 1 },
  { name: "Staturday", mainData: 8, targetData: 10 },
  { name: "Sunday", mainData: 5, targetData: 7 },
];

export default function OverlappingBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        barGap="-93%" // this will force the overlap of the two bars
        barCategoryGap="3%"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        {/* <CartesianGrid strokeDasharray="3 3" /> */}
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: "15px", fill: "black", fontWeight: "300" }}
        />
        {/* <YAxis /> */}
        <Tooltip />
        {/* <Legend /> */}
        <linearGradient id="lastWeekGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="20%" stop-color="#E7E7E7" />
          <stop offset="100%" stop-color="red" />
          {/* <stop offset="100%" stop-color="#B7B7B7FF" /> */}
        </linearGradient>
        <Bar
          className="bar1"
          dataKey="targetData"
          // fill="#82ca9d"
          opacity={0.3}
          // barSize={90}
          // stroke="#82ca9d"
          // strokeWidth={5}
          radius={15}
        />

        {/* FOREGROUND BAR */}
        <Bar
          className="bar2"
          dataKey="mainData"
          fill="#8884d8"
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
