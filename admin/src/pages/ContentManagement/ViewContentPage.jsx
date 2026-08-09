import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { contentApi } from '../../methods/api/content';
import { capitalizeName } from '../../utils/name';
import { fmtDateTime } from '../../utils/date';
import { useToast } from '../../components/common/Toast';
import { useConfirm } from '../../context/ConfirmContext';
import { useRecord } from '../../context/RecordContext';

const STATUS_META = {
  active: { label: 'Active', color: '#86efac', bg: 'rgba(34,197,94,0.15)', dot: '#10b981', glow: 'rgba(16,185,129,0.9)' },
  inactive: { label: 'Inactive', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', glow: 'rgba(239,68,68,0.9)' },
  deactive: { label: 'Deactive', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', glow: 'rgba(239,68,68,0.9)' },
};

export default function ViewContentPage() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { record, loading, notFound } = useEntity(contentApi.getById);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const status = record?.status || 'active';
  const meta = STATUS_META[status] || STATUS_META.active;
  const title = capitalizeName(record?.title) || 'Content';

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Content?',
      message: `This will permanently delete "${title}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await contentApi.delete({ id: record.id || record._id });
      showToast('Content deleted', 'success');
      navigate('/content-management');
    } catch (err) {
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete content', 'error');
    }
  };

  const metaTiles = [
    { label: 'Created', value: fmtDateTime(record?.createdAt), icon: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { label: 'Last updated', value: fmtDateTime(record?.updatedAt), icon: 'M21 12a9 9 0 1 1-9-9 7 7 0 0 1 7 7l3-3' },
  ];

  const keywordList = Array.isArray(record?.keywords) ? record.keywords : [];

  return (
    <FormPageLayout
      eyebrow="Site"
      title={title}
      subtitle={record?.meta_title && (
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Meta: {record.meta_title}</span>
      )}
      onBack={() => navigate('/content-management')}
      actions={record && (
        <>
          <button type="button" className="button-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            Delete
          </button>
          <button type="button" className="button-primary" onClick={() => { setActiveId(record.id || record._id); navigate('/content-management/edit', { state: { record } }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            Edit
          </button>
        </>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Content not found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              border: '1px solid var(--hairline)',
              background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)',
              padding: '26px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Content Page</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{title}</div>
              {record?.slug && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>/{record.slug}</div>}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 999, textTransform: 'capitalize', border: `1px solid ${meta.bg}`, background: meta.bg, color: meta.color, flexShrink: 0, marginLeft: 'auto' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, boxShadow: `0 0 10px ${meta.glow}` }} />
              {meta.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {metaTiles.map((m) => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon} /></svg>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Description</span>
            </div>
            <div style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{record?.description || '-'}</div>
          </div>

          {record?.videos?.length > 0 && (
            <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Videos ({record.videos.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {record.videos.map((v, i) => (
                  <div key={i} style={{ fontSize: 14, color: 'var(--body)' }}>
                    {v.title || v.url ? (
                      v.url ? <a href={v.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{v.title || v.url}</a> : v.title
                    ) : '-'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {keywordList.length > 0 && (
            <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 12 22 4 20 2 12l8.59-8.59a2 2 0 0 1 2.82 0z" /><path d="M6 6v5" /></svg>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Keywords</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keywordList.map((k, i) => (
                  <span key={i} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)', color: '#fde68a', fontSize: 12, fontWeight: 600 }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FormPageLayout>
  );
}
