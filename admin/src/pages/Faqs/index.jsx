import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { faqsApi } from '../../methods/api/faqs';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';

export default function Faqs() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await faqsApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined, category: category || undefined });
      setFaqs(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load FAQs', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, category, page, pageSize]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, category]);

  useEffect(() => {
    let mounted = true;
    faqsApi
      .categories()
      .then((res) => {
        const list = res.data?.categories || [];
        if (mounted) setCategoryOptions(list.map((cat) => ({ value: cat, label: cat })));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const goView = (faq) => navigate(`/faqs/view/${faq.id || faq._id}`, { state: { record: faq } });
  const goEdit = (faq) => navigate(`/faqs/edit/${faq.id || faq._id}`, { state: { record: faq } });

  const handleDelete = async (faq) => {
    const ok = await confirm({
      title: 'Delete FAQ?',
      message: `This will permanently delete "${faq.question}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await faqsApi.delete({ id: faq.id || faq._id });
      showToast('FAQ deleted', 'success');
      fetchFaqs();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete FAQ', 'error');
    }
  };

  const handleToggleStatus = async (faq) => {
    const id = faq.id || faq._id;
    const next = faq.status === 'active' ? 'inactive' : 'active';
    setTogglingId(id);
    try {
      await faqsApi.changeStatus({ id, status: next });
      showToast(`FAQ ${next === 'active' ? 'activated' : 'deactivated'}`, 'success');
      fetchFaqs();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'question', label: 'Question' },
    { key: 'order', label: 'Order' },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'active'} loading={togglingId === (row.id || row._id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Support" title="FAQs">
        <button onClick={() => navigate('/faqs/add')} className="button-primary">+ Add FAQ</button>
      </PageHeader>

      <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search FAQs..."
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        secondaryValue={category}
        onSecondaryChange={setCategory}
        secondaryOptions={categoryOptions}
        secondaryPlaceholder="All categories"
      />

      <DataTable columns={columns} data={faqs} onView={goView} onEdit={goEdit} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
