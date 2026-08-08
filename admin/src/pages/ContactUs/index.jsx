import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactUsApi } from '../../methods/api/contactUs';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import TableFilters from '../../components/common/TableFilters';
import useDebouncedValue from '../../components/common/useDebouncedValue';
import { useToast } from '../../components/common/Toast';
import StatusToggle from '../../components/common/StatusToggle';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../context/ConfirmContext';

const TOPICS = ['Account help', 'Security & encryption', 'Bug report', 'Feature request', 'Something else'];
const topicOptions = TOPICS.map((t) => ({ value: t, label: t }));

const truncate = (s, n = 60) => (s && s.length > n ? `${s.slice(0, n)}...` : (s || '-'));

export default function ContactUs() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState('');
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactUsApi.list({ page, count: pageSize, search: debouncedSearch || undefined, status: status || undefined, topic: topic || undefined });
      setItems(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load messages', 'error');
    } finally { setLoading(false); }
  }, [showToast, debouncedSearch, status, topic, page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => { setPage(1); }, [debouncedSearch, status, topic]);

  const goView = (item) => navigate(`/feedback/view/${item._id || item.id}`, { state: { record: item } });

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete Message?',
      message: `This will permanently delete the message from "${item.email || item.fullName}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await contactUsApi.delete({ id: item._id || item.id });
      showToast('Message deleted', 'success');
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete message', 'error');
    }
  };

  const handleToggleStatus = async (item) => {
    const id = item._id || item.id;
    const isRead = item.status === 'read' || item.status === 'resolved';
    const next = isRead ? 'unread' : 'read';
    setTogglingId(id);
    try {
      await contactUsApi.changeStatus({ id, status: next });
      showToast(`Message marked as ${next}`, 'success');
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setTogglingId('');
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name', render: (v) => capitalizeName(v) || '-' },
    { key: 'email', label: 'Email', render: (v) => v || '-' },
    { key: 'topic', label: 'Topic', render: (v) => v || '-' },
    { key: 'message', label: 'Message', render: (v) => truncate(v) },
    { key: 'status', label: 'Status', render: (v, row) => (
      <StatusToggle value={v || 'new'} loading={togglingId === (row._id || row.id)} onToggle={() => handleToggleStatus(row)} />
    )},
    { key: 'createdAt', label: 'Created At', render: (v) => fmtDateTime(v) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Feedback">
        <button onClick={fetchItems} className="button-secondary">Refresh</button>
      </PageHeader>

       <TableFilters
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        searchPlaceholder="Search by name or email..."
        statusOptions={[
          { value: 'new', label: 'New' },
          { value: 'read', label: 'Read' },
          { value: 'resolved', label: 'Resolved' },
        ]}
        statusPlaceholder="All statuses"
        secondaryValue={topic}
        onSecondaryChange={setTopic}
        secondaryOptions={topicOptions}
        secondaryPlaceholder="All topics"
      />

      <DataTable columns={columns} data={items} onView={goView} onDelete={handleDelete} loading={loading} />
      <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
