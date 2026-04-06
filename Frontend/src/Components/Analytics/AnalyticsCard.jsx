export default function AnalyticsCard({ title, value }) {
  return (
    <div className="col-md-4">
      <div className="card p-3 shadow-sm text-center">
        <h6 className="text-muted">{title}</h6>
        <h2>{value ?? 0}</h2>
      </div>
    </div>
  );
}