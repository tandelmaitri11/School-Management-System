export default function Filters({ setFilter }) {
  return (
    <div className="d-flex gap-3 mb-3">

      <select className="form-select"
        onChange={e => setFilter(f => ({ ...f, class: e.target.value }))}>
        <option value="">All Classes</option>
        {[...Array(12)].map((_, i) => (
          <option key={i} value={i + 1}>{i + 1}</option>
        ))}
      </select>

      <select className="form-select"
        onChange={e => setFilter(f => ({ ...f, section: e.target.value }))}>
        <option value="">All Sections</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>

    </div>
  );
}