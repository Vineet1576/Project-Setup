import { useNavigate } from 'react-router-dom';
import FormPageLayout from '../../components/common/FormPageLayout';
import useEntity from '../../components/common/useEntity';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { faqsApi } from '../../methods/api/faqs';
import { fmtDateTime } from '../../utils/date';
import { useRecord } from '../../context/RecordContext';

const CATEGORY_STYLES = {
  default: { from: '#3b82f6', to: '#6366f1', text: '#c7d2fe', bg: 'rgba(59,130,246,0.12)' },
};

const getCategoryStyle = (category = '') => {
  const h = String(category).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const palettes = [
    { from: '#3b82f6', to: '#6366f1', text: '#c7d2fe', bg: 'rgba(59,130,246,0.12)' },
    { from: '#8b5cf6', to: '#d946ef', text: '#ddd6fe', bg: 'rgba(139,92,246,0.12)' },
    { from: '#10b981', to: '#14b8a6', text: '#a7f3d0', bg: 'rgba(16,185,129,0.12)' },
    { from: '#f59e0b', to: '#ef4444', text: '#fde68a', bg: 'rgba(245,158,11,0.12)' },
    { from: '#06b6d4', to: '#3b82f6', text: '#a5f3fc', bg: 'rgba(6,182,212,0.12)' },
  ];
  return palettes[h % palettes.length] || CATEGORY_STYLES.default;
};

export default function ViewFaqPage() {
  const navigate = useNavigate();
  const { setActiveId } = useRecord();
  const { record, loading, notFound } = useEntity(faqsApi.getById);
  const faq = record;
  const category = faq?.category || 'Uncategorized';
  const catStyle = getCategoryStyle(category);
  const isActive = faq?.status !== 'inactive';

  return (
    <FormPageLayout
      eyebrow="Support"
      title="FAQ Details"
      subtitle={faq?.question ? (
        <span style={{ fontSize: 13, color: 'var(--body)' }}>{faq.question}</span>
      ) : undefined}
      onBack={() => navigate('/faqs')}
      actions={faq && (
        <button
          type="button"
          onClick={() => { setActiveId(faq.id || faq._id); navigate('/faqs/edit', { state: { record: faq } }); }}
          className="button-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          Edit FAQ
        </button>
      )}
    >
      {loading ? (
        <SkeletonLoader variant="detail" />
      ) : notFound || !faq ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>FAQ not found.</div>
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 999,
                  border: '1px solid rgba(147,197,253,0.35)', background: catStyle.bg, color: catStyle.text,
                  fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                {category}
              </span>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  background: isActive ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.12)',
                  color: isActive ? '#34d399' : '#f87171', fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444', boxShadow: `0 0 10px ${isActive ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)'}` }} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.35 }}>{faq.question}</h2>
            </div>
          </div>

          <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'var(--panel, rgba(255,255,255,0.02))', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: catStyle.bg, color: catStyle.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Answer</span>
            </div>
            <div style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Order', value: faq.order ?? 0, icon: 'M3 6h18M3 12h12M3 18h8' },
              { label: 'Created', value: fmtDateTime(faq.createdAt), icon: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
              { label: 'Last updated', value: fmtDateTime(faq.updatedAt), icon: 'M21 12a9 9 0 1 1-9-9 7 7 0 0 1 7 7l3-3' },
            ].map((m) => (
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
        </div>
      )}
    </FormPageLayout>
  );
}
