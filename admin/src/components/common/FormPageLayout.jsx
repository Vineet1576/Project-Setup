import PageHeader from './PageHeader';

export default function FormPageLayout({ eyebrow, title, subtitle, onBack, backLabel = 'Back', actions, children }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle}>
        {actions}
        {onBack && (
          <button type="button" onClick={onBack} className="button-secondary">{backLabel}</button>
        )}
      </PageHeader>
      <div className="panel-card" style={{ padding: 24 }}>
        {children}
      </div>
    </div>
  );
}
