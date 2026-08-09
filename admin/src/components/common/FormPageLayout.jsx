import PageHeader from './PageHeader';

export default function FormPageLayout({ eyebrow, title, subtitle, onBack, backLabel = 'Back', actions, children }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle}>
        {actions}
        {onBack && (
          <button type="button" onClick={onBack} className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            {backLabel}
          </button>
        )}
      </PageHeader>
      <div className="panel-card" style={{ padding: 24 }}>
        {children}
      </div>
    </div>
  );
}
