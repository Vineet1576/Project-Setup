import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/layout';
import ProfileSidebar from '../../components/global/profilePanels/ProfileSidebar';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { feedbackApi } from '../../methods/api/feedback';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '-');

const replyCount = (item) => {
  const replies = item?.replies || item?.detail?.replies;
  if (Array.isArray(replies)) return replies.length;
  return Number(item?.replyCount ?? 0);
};

const statusMeta = {
  read: { label: 'Read', color: 'var(--primary)', bg: 'rgba(59,130,246,0.12)' },
  unread: { label: 'Unread', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  resolved: { label: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export default function MyFeedback() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userEmail = auth?.user?.email;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchFeedbacks = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await feedbackApi.list({
        page,
        count: pageSize,
        email: userEmail,
      });
      setItems(res.data?.data || res.data?.docs || []);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Failed to load your feedback', 'error');
    } finally { setLoading(false); }
  }, [showToast, userEmail, page, pageSize]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  return (
    <Layout wide>
      <div className="flex flex-col lg:flex-row">
        <ProfileSidebar />

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-8">
          <PageHeader eyebrow="Support" title="My Feedback" subtitle="Feedback you've submitted" />

          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <SkeletonLoader variant="table" rows={5} />
            ) : items.length === 0 ? (
              <EmptyState
                title={userEmail ? "You haven't submitted any feedback yet" : 'No feedback found'}
                description={userEmail ? 'Share your feedback and track replies from support here.' : 'Sign in to view your feedback.'}
              />
            ) : (
              <>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((f) => {
                    const meta = statusMeta[f.status] || statusMeta.read;
                    return (
                      <li
                        key={f._id || f.id}
                        onClick={() => navigate(`/my-feedback/${f._id || f.id}`)}
                        style={{ padding: '18px 20px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer', transition: 'background 0.18s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span className="admin-eyebrow" style={{ marginBottom: 0 }}>{f.topic || 'Feedback'}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                              {meta.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: 12, fontWeight: 700 }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                              {replyCount(f)}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(f.createdAt)}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid var(--hairline)', color: 'var(--muted)', flexShrink: 0 }}>
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.6 }}>{f.message}</div>
                      </li>
                    );
                  })}
                </ul>
                <Pagination page={page} count={pageSize} total={total} onPageChange={setPage} onCountChange={(n) => { setPageSize(n); setPage(1); }} />
              </>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}
