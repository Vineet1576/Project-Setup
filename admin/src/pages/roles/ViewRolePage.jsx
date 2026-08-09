import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import EmptyState from '../../components/common/EmptyState';
import { rolesApi } from '../../methods/api/roles';
import { capitalizeName } from '../../utils/name';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import { useRecord } from '../../context/RecordContext';
import RoleForm from './RoleForm';

const STATUS_BADGE = {
  active: { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
  inactive: { bg: 'rgba(217,119,6,0.14)', border: 'rgba(217,119,6,0.4)', text: '#fbbf24' },
};

export default function ViewRolePage() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { record, notFound } = useEntity(null);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const name = capitalizeName(record?.name) || 'Role';
  const displayName = capitalizeName(record?.displayName) || '';
  const status = record?.status || 'active';
  const badge = STATUS_BADGE[status] || STATUS_BADGE.active;

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Role?',
      message: `This will permanently delete "${record?.name || 'this role'}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await rolesApi.delete({ id: record.id || record._id });
      showToast('Role deleted', 'success');
      navigate('/roles');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete role', 'error');
    }
  };

  return (
    <FormPageLayout
      eyebrow="Access"
      title={`View ${name}`}
      subtitle={record && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {displayName && <span style={{ fontSize: 13, color: 'var(--body)' }}>{displayName}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 999, border: `1px solid ${badge.border}`, background: badge.bg, color: badge.text }}>
            {status}
          </span>
        </span>
      )}
      onBack={() => navigate('/roles')}
      actions={record && (
        <>
          <button type="button" className="button-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            Delete
          </button>
          <button type="button" className="button-primary" onClick={() => { setActiveId(record.id || record._id); navigate('/roles/edit', { state: { record } }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            Edit
          </button>
        </>
      )}
    >
      {notFound ? (
        <EmptyState title="Role not found" description="Please open it from the roles list." />
      ) : (
        <RoleForm record={record} readOnly />
      )}
    </FormPageLayout>
  );
}
