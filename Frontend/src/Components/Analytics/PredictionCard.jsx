export default function PredictionCard({ prob }) {
  const percent = Math.round((prob || 0) * 100);

  const color =
    percent > 70 ? "bg-success" :
    percent > 40 ? "bg-warning" :
    "bg-danger";

  return (
    <div className="card p-3 mt-3 shadow">
      <h5>🤖 AI Risk Analysis</h5>

      <h3>{percent}% Safe</h3>

      <div className="progress">
        <div className={`progress-bar ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}