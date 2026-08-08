import RowMenu from './RowMenu';
import SkeletonLoader from './SkeletonLoader';

export default function DataTable({ columns, data, onEdit, onDelete, onView, loading }) {
  if (loading) return <SkeletonLoader variant="table" rows={6} />;

  return (
    <div className="panel-card" style={{ overflowX: 'auto', padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</th>
            ))}
            <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || row.id || i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s ease' }} className="table-row-hover">
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '12px 16px', fontSize: 14, textAlign: 'left', color: 'rgba(255,255,255,0.85)' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                </td>
              ))}
              <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <RowMenu
                  items={[
                    ...(onView ? [{ label: 'View', icon: ViewIcon, onClick: () => onView(row) }] : []),
                    ...(onEdit ? [{ label: 'Edit', icon: EditIcon, onClick: () => onEdit(row) }] : []),
                    ...(onDelete ? [{ label: 'Delete', icon: DeleteIcon, danger: true, onClick: () => onDelete(row) }] : []),
                  ]}
                />
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length + 1} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No records found</td></tr>
          )}
        </tbody>
      </table>
      <style>{`
        .table-row-hover:hover { background: rgba(59, 130, 246, 0.06); }
      `}</style>
    </div>
  );
}

const ViewIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);

const EditIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
);

const DeleteIcon = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
);
