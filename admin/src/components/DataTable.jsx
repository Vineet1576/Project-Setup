export default function DataTable({ columns, data, onEdit, onDelete, loading }) {
  if (loading) return <div className="panel-card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div className="panel-card" style={{ overflowX: 'auto', padding: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(239,233,222,0.7)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{col.label}</th>
            ))}
            <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} style={{ borderTop: '1px solid var(--hairline)' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '12px 16px', fontSize: 14, color: 'var(--body)' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                </td>
              ))}
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {onEdit && <button onClick={() => onEdit(row)} style={{ ...btn, background: 'var(--primary)', marginRight: 6 }}>Edit</button>}
                {onDelete && <button onClick={() => onDelete(row)} style={{ ...btn, background: '#c64545' }}>Delete</button>}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length + 1} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No records found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const btn = { padding: '7px 12px', border: 'none', borderRadius: 999, color: '#fff', fontSize: 12, cursor: 'pointer' };
