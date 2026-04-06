import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from "recharts";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function AdvancedCharts({ data }) {

  const riskData = ["LOW", "MEDIUM", "HIGH"].map(r => ({
    name: r,
    value: data.filter(d => d.riskLevel === r).length
  }));

  return (
    <div className="row mt-4">

      <div className="col-md-6">
        <h5>Risk Distribution</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={riskData} dataKey="value">
              {riskData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="col-md-6">
        <h5>Performance</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="student.name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attendancePct" />
            <Bar dataKey="avgExamScore" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}