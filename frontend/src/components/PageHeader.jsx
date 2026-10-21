/** Reusable page title row with optional actions slot. */
function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h1 className="h3 mb-0">{title}</h1>
        {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
      </div>
      {children && (
        <div className="d-flex flex-wrap gap-2 align-items-center">{children}</div>
      )}
    </div>
  );
}

export default PageHeader;
