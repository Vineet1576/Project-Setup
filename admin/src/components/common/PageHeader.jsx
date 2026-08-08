export default function PageHeader({ eyebrow, title, subtitle, subtitleStyle, children }) {
  return (
    <div className="panel-card page-header">
      <div className="page-header-main">
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle" style={subtitleStyle}>{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}
