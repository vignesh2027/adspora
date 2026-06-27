export default function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}
