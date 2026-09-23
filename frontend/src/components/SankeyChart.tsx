// src/components/SankeyChart.tsx
import { useEffect, useRef } from "react";
import {
  Sankey,
  Tooltip,
  Rectangle,
  Layer,
  type SankeyNodeProps,
  useChartWidth,
  ResponsiveContainer,
} from "recharts";
import { useUIContext } from "../context/UIContext";

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

const NODE_OPACITY: Record<string, number> = {
  Applied: 100,
  "No Reply": 100,
  Rejected: 100,
  "Replied Too Late": 100,
  "Initial Interview": 95,
  Technical: 85,
  "Second Interview": 90,
  "Third Interview": 80,
  "Final Interview": 75,
  Offer: 70,
  Withdrawn: 100,
};

// apperently recharts need x, y, width, height, index ,payload for custom nodes
function CustomNode({ x, y, width, height, index, payload }: any) {
  const { accentColor } = useUIContext();
  function getNodeColor(nodeName: string): string {
    const opacity = NODE_OPACITY[nodeName] ?? 60;
    return `color-mix(in srgb, ${accentColor} ${opacity}%, #1a1a1a)`;
  }
  const color = `color-mix(in srgb, ${accentColor} 60%, #1a1a1a)`;
  // const color = `color-mix(in srgb, ${accentColor} 0%, transparent)`;
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
        fill={color}
        // fill="#5192ca"
        fillOpacity="0.9"
      />
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="12"
        stroke="#3c3c3c"
      >
        {payload.name}
      </text>
      <text
        textAnchor={isOut ? "end" : "start"}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2 + 13}
        fontSize="12"
        stroke="#8a8a8a"
        strokeOpacity="0.5"
      >
        {`${payload.value}`}
      </text>
    </Layer>
  );
}

function CustomLink({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  index,
  payload,
}: any) {
  const { accentColor } = useUIContext();
  function getNodeColor(nodeName: string): string {
    const opacity = NODE_OPACITY[nodeName] ?? 60;
    return `color-mix(in srgb, ${accentColor} ${opacity}%, #1a1a1a)`;
  }
  const color = getNodeColor(payload.source.name);
  return (
    <Layer key={`link-${index}`}>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={color}
        strokeWidth={linkWidth}
        strokeOpacity={1}
      />
    </Layer>
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

  // if (!active || !payload?.length) return null;

  if (!lastPayloadRef.current) return null;
  const data = lastPayloadRef.current[0]?.payload;
  if (!data) return null;

  // different tooltip on node vs links
  const isLink = data.source !== undefined;

  return (
    <div className="chart-tooltip">
      {isLink ? (
        // link tooltip: "Applied - Rejected: 3 jobs"
        <span>
          {data.source.name} - {data.target.name}:{" "}
          <span>
            {data.value} job{data.value !== 1 ? "s" : ""}
          </span>
        </span>
      ) : (
        // node tooltip: "Rejected: 4 jobs"
        <span>
          {data.name}:{" "}
          <span>
            {data.value} job{data.value !== 1 ? "s" : ""}
          </span>
        </span>
      )}
    </div>
  );
};

function SankeyChart({ data, width = 800, height = 200 }: Props) {
  // don't render if no transitions yet
  if (!data.links.length) {
    return <div>start applying to see your journey</div>;
  }
  return (
    // seems like increasing aspect reduce the height of the chart
    <ResponsiveContainer width="100%" aspect={4}>
      <Sankey
        width={width}
        height={height}
        data={data}
        node={CustomNode}
        nodePadding={50}
        align="left"
        margin={{
          bottom: 30,
        }}
        // link={{ stroke: "#77c878" }}
        link={CustomLink}
      >
        <svg xmlns="http://w3.org" className="dotted-bg">
          <defs>
            <pattern
              id="_r_21_-bg-dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="currentColor"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#_r_21_-bg-dots)"></rect>
        </svg>

        <Tooltip
          content={CustomTooltip}
          cursor={false}
          isAnimationActive={true}
        />
      </Sankey>
    </ResponsiveContainer>
  );
}

export default SankeyChart;
