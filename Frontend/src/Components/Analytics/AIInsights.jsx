export default function AIInsights({ data }) {
  const insights = [];

  data.forEach(d => {
    if (d.attendancePct < 50)
      insights.push(`⚠️ ${d.student?.name}: Low attendance`);

    if (d.avgExamScore < 40)
      insights.push(`❌ ${d.student?.name}: Poor performance`);
  });

  return (
    <div className="card p-3 mt-4">
      <h5>🤖 AI Insights</h5>

      {insights.length === 0 ? (
        <p>No issues 🎉</p>
      ) : (
        <ul>
          {insights.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      )}
    </div>
  );
}