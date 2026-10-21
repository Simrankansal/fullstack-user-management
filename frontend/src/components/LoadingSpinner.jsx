/** Centered loading indicator for async pages and sections. */
function LoadingSpinner({ label = "Loading…", className = "" }) {
  return (
    <div className={`text-center py-5 ${className}`.trim()}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
