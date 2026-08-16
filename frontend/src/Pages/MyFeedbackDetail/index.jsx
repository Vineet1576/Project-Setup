import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/global/layout';
import ProfileSidebar from '../../components/global/profilePanels/ProfileSidebar';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { feedbackApi } from '../../methods/api/feedback';
import { useToast } from '../../components/common/Toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

const statusMeta = {
  read: { label: 'Read', color: 'var(--primary)', bg: 'rgba(59,130,246,0.12)' },
  unread: { label: 'Unread', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  resolved: { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export default function MyFeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    console.log(id, "njkvnhvjkdfjkvnnjkdfvn")
    feedbackApi
      .detail({ id })
      .then((res) => {
        if (mounted) setItem(res.data?.detail || res.data?.data || null);
      })
      .catch(() => {
        if (mounted) showToast('Failed to load feedback', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, showToast]);

  const meta = statusMeta[item?.status] || statusMeta.read;

  return (
    <Layout wide>
      <div className="flex flex-col lg:flex-row">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-8">
          <PageHeader
            eyebrow="Support"
            title="Feedback"
            subtitle={item?.topic || 'Feedback'}
            subtitleStyle={{ textTransform: 'capitalize' }}
          >
            <button onClick={() => navigate('/my-feedback')} className="button-secondary">Back to My Feedback</button>
          </PageHeader>

          {loading ? (
            <SkeletonLoader variant="detail" />
          ) : !item ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Feedback not found.</div>
          ) : (
            <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="admin-eyebrow" style={{ marginBottom: 0 }}>{item.topic || 'Feedback'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(item.createdAt)}</span>
              </div>

              <div style={{ padding: '20px 20px 24px' }}>
                <div style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{item.message}</div>

                {(item.replies || []).length > 0 && (
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reply from support</span>
                    </div>
                    {item.replies.map((r) => (
                      <div
                        key={r._id || r.id}
                        style={{ marginLeft: 30, padding: '12px 16px', borderRadius: 14, border: '1px solid var(--hairline)', background: 'rgba(59,130,246,0.06)', borderTopLeftRadius: 4 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Support Team</span>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(r.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>{r.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
