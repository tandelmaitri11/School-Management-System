export default function RiskBadge({ risk }) {
  const colors = {
    HIGH: "danger",
    MEDIUM: "warning",
    LOW: "success",
  };

  return (
    <span className={`badge bg-${colors[risk] || "secondary"}`}>
      {risk}
    </span>
  );
}