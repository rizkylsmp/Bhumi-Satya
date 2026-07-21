import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-xl p-3 text-sm">
        {label && <p className="text-text-muted font-medium mb-1">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} className="text-text-primary flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-text-secondary">{item.name}:</span>
            <span className="font-semibold">
              {formatter ? formatter(item.value) : item.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Area Chart Component
export function AreaChartComponent({
  data,
  dataKey,
  xAxisKey = "name",
  color = "#3b82f6",
  gradientId = "colorGradient",
  height = 200,
  showGrid = true,
  formatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Line Chart Component
export function LineChartComponent({
  data,
  lines = [],
  xAxisKey = "name",
  height = 200,
  showGrid = true,
  showLegend = false,
  formatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
export function BarChartComponent({
  data,
  dataKey,
  xAxisKey = "name",
  color = "#3b82f6",
  height = 200,
  showGrid = true,
  horizontal = false,
  formatter,
  barRadius = [4, 4, 0, 0],
  onBarClick,
}) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={false}
            />
          )}
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            cursor={onBarClick ? "pointer" : "default"}
            onClick={onBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={barRadius}
          maxBarSize={40}
          cursor={onBarClick ? "pointer" : "default"}
          onClick={onBarClick}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Multi Bar Chart Component
export function MultiBarChartComponent({
  data,
  bars = [],
  xAxisKey = "name",
  height = 200,
  showGrid = true,
  showLegend = false,
  formatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Donut/Pie Chart Component
export function DonutChartComponent({
  data,
  nameKey = "name",
  dataKey = "value",
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
  showLabel = false,
  centerText,
  formatter,
  onCellClick,
}) {
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          nameKey={nameKey}
          dataKey={dataKey}
          label={showLabel ? renderCustomizedLabel : false}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
              className={`transition-all duration-300 hover:opacity-80${onCellClick ? " cursor-pointer" : ""}`}
              onClick={
                onCellClick ? () => onCellClick(entry, index) : undefined
              }
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatter={formatter} />} />
        {centerText && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-primary"
          >
            <tspan
              x="50%"
              dy="-0.5em"
              fontSize="24"
              fontWeight="bold"
              className="fill-text-primary"
            >
              {centerText.value}
            </tspan>
            <tspan x="50%" dy="1.5em" fontSize="12" className="fill-text-muted">
              {centerText.label}
            </tspan>
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// Mini Sparkline Chart
export function SparklineChart({
  data,
  dataKey = "value",
  color = "#3b82f6",
  height = 40,
  showDot = true,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#spark-${dataKey})`}
          dot={showDot ? { fill: color, strokeWidth: 0, r: 2 } : false}
          activeDot={showDot ? { r: 4, strokeWidth: 0 } : false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default {
  AreaChartComponent,
  LineChartComponent,
  BarChartComponent,
  MultiBarChartComponent,
  DonutChartComponent,
  SparklineChart,
};
