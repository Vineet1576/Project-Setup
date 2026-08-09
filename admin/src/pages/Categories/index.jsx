import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../../methods/api/categories';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';
import { useRecord } from '../../context/RecordContext';
import { capitalizeName } from '../../utils/name';

const toText = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? '-'));

export default function Categories() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { setActiveId } = useRecord();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const [viewC, setViewC] = useState(null);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined });
      setCategories(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, page, pageSize]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const goView = (category) => setViewC(category);
  const goEdit = (category) => { setActiveId(category.id || category._id); navigate('/categories/edit', { state: { record: category } }); };

  const handleDelete = async (category) => {
    const ok = await confirm({
      title: 'Delete Category?',
      message: `This will permanently delete "${toText(category.name)}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await categoriesApi.delete({ id: category.id || category._id });
      showToast('Category deleted', 'success');
      if (viewC && (viewC.id === category.id || viewC._id === category._id)) setViewC(null);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  const handleToggleStatus = async (category) => {
    const id = category.id || category._id;
    const next = category.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await categoriesApi.changeStatus({ id, status: next });
      showToast(`Category ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || err.response?.data || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (v) => capitalizeName(toText(v)) },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Categories">
        <button onClick={() => navigate('/categories/add')} className="button-primary">+ Add Category</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search categories..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable columns={columns} data={categories} onRowClick={goView} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />

      {viewC && (
        <div
          onClick={() => setViewC(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            className="panel-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden', animation: 'pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15)' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, padding: '24px 28px', background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)', borderBottom: '1px solid var(--hairline)' }}>
              <button
                onClick={() => setViewC(null)}
                aria-label="Close"
                style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.18s ease' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 12 22 4 20 2 12l8.59-8.59a2 2 0 0 1 2.82 0z" /><path d="M6 6v5" /></svg>
              </span>
              <div style={{ minWidth: 0, paddingRight: 40 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Category
                </span>
                <h3 style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{capitalizeName(toText(viewC.name))}</h3>
              </div>
            </div>

            <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingBottom: 16, borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: viewC.status === 'inactive' ? '#ef4444' : '#10b981', boxShadow: viewC.status === 'inactive' ? '0 0 12px rgba(239,68,68,0.8)' : '0 0 12px rgba(16,185,129,0.8)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: viewC.status === 'inactive' ? '#f87171' : '#34d399', textTransform: 'capitalize' }}>{viewC.status || 'active'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Created {fmtDateTime(viewC.createdAt)}</div>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  className="button-danger"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => handleDelete(viewC)}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                  Delete
                </button>
                <button
                  type="button"
                  className="button-primary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => { const id = viewC.id || viewC._id; setActiveId(id); setViewC(null); navigate('/categories/edit', { state: { record: viewC } }); }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  Edit Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
