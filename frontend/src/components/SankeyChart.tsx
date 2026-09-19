// src/components/SankeyChart.tsx
import {
  Sankey,
  Tooltip,
  Rectangle,
  Layer,
  type SankeyNodeProps,
  useChartWidth,
  ResponsiveContainer,
} from "recharts";

interface SNode {
  name: string;
}

interface SLink {
  source: number;
  target: number;
  value: number;
}

interface SData {
  nodes: SNode[];
  links: SLink[];
}

interface Props {
  data: SData;
  width?: number;
  height?: number;
}

const NODE_COLORS: Record<string, string> = {
  Applied: "lightgreen",
  "No Reply": "orange",
  "Replied Too Late": "gray",
  "Initial Interview": "green",
  Technical: "yellow",
  "Second Interview": "darkgreen",
  "Third Interview": "olive",
  "Final Interview": "purple",
  Offer: "yellow",
  Rejected: "darkred",
  Withdrawn: "blue",
};

// apperently recharts need x, y, width, height, index ,payload for custom nodes
function CustomNode({ x, y, width, height, index, payload }: SankeyNodeProps) {
  const containerWidth = useChartWidth();
  if (containerWidth == null) {
    return null;
  }
  const isOut = x + width + 6 > containerWidth;
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#5192ca"
        fillOpacity="0.9"
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="14"
        stroke="#333"
      >
        {payload.name}
      </text>
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 13}
        fontSize="12"
        stroke="#333"
        strokeOpacity="0.5"
      >
        {`${payload.value}k`}
      </text>
    </Layer>
  );
}

function SankeyChart({ data, width = 800, height = 400 }: Props) {
  // don't render if no transitions yet
  if (!data.links.length) {
    return <div>start applying to see your journey</div>;
  }
  return (
    <ResponsiveContainer width="100%" aspect={2}>
      <Sankey
        data={data}
        node={CustomNode}
        nodePadding={50}
        align="left"
        margin={{
          bottom: 30,
        }}
        link={{ stroke: "#77c878" }}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}

export default SankeyChart;
