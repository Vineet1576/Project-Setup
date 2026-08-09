import { useState, useEffect } from 'react';
import { contentApi } from '../../methods/api/content';
import { useToast } from '../../components/common/Toast';

const keywordsToString = (keywords) =>
  Array.isArray(keywords) ? keywords.join(', ') : (keywords || '');

const keywordsToArray = (str) =>
  str.split(',').map((s) => s.trim()).filter(Boolean);

const STATUS_META = {
  active: { label: 'Active', color: '#86efac', bg: 'rgba(34,197,94,0.15)', dot: '#10b981', glow: 'rgba(16,185,129,0.9)' },
  inactive: { label: 'Inactive', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', dot: '#ef4444', glow: 'rgba(239,68,68,0.9)' },
};

function Field({ label, icon, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <span style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>{label}</span>
        {hint && <span style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.75 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children, subtitle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: 8, marginBottom: 4 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{children}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export default function ContentForm({ record, onDone, readOnly = false }) {
  const item = record;
  const [form, setForm] = useState({
    title: '',
    description: '',
    meta_title: '',
    meta_description: '',
    meta_key: '',
    keywords: '',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({
      title: item?.title || '',
      description: item?.description || '',
      meta_title: item?.meta_title || '',
      meta_description: item?.meta_description || '',
      meta_key: item?.meta_key || '',
      keywords: keywordsToString(item?.keywords),
      status: item?.status || 'active',
    });
    setError('');
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        id: item?.id || item?._id,
        title: form.title.trim(),
        description: form.description,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
        meta_key: form.meta_key,
        keywords: keywordsToArray(form.keywords),
        status: form.status,
      };
      if (item) await contentApi.update(payload);
      else {
        const { id, ...createPayload } = payload;
        await contentApi.create(createPayload);
      }
      showToast(item ? 'Content updated' : 'Content created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save content';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1 1 440px', minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              border: '1px solid var(--hairline)',
              background: 'radial-gradient(circle at 12% 0%, rgba(96,165,250,0.28), transparent 42%), radial-gradient(circle at 90% 100%, rgba(139,92,246,0.22), transparent 45%), linear-gradient(135deg, #101323, #0b0b10)',
              padding: '24px 26px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{item ? 'Edit Content' : 'New Content'}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{item?.title || 'Create a new page'}</div>
              </div>
            </div>
            <Field label="Page title" hint={form.title ? `${form.title.length} / 120` : undefined}>
              <input
                type="text"
                placeholder="e.g. About Us, Terms & Conditions"
                value={form.title}
                maxLength={120}
                onChange={set('title')}
                required
                disabled={readOnly}
                style={{ ...(readOnly ? readOnlyStyle : inputStyle), fontWeight: 600 }}
              />
            </Field>
          </div>

          <Field label="Description" hint={form.description ? `${form.description.length} characters` : undefined}>
            <textarea
              placeholder="Write a clear description for this page..."
              value={form.description}
              onChange={set('description')}
              rows={8}
              disabled={readOnly}
              style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical', minHeight: 200, lineHeight: 1.7 }}
            />
          </Field>

          <SectionTitle subtitle="Used for search engine optimization.">SEO details</SectionTitle>

          <div style={{ borderRadius: 18, border: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.02)', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Meta title" hint={!readOnly ? 'The clickable headline in search results' : undefined}>
              <input type="text" placeholder="e.g. Terms & Conditions | Your Brand" value={form.meta_title} maxLength={70} onChange={set('meta_title')} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
              {!readOnly && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (form.meta_title.length / 60) * 100)}%`, height: '100%', borderRadius: 999, background: form.meta_title.length > 60 ? '#ef4444' : 'linear-gradient(135deg, #60a5fa, #3b82f6)', transition: 'width 0.2s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: form.meta_title.length > 60 ? '#ef4444' : 'var(--muted)', flexShrink: 0 }}>{form.meta_title.length} / 70</span>
                </div>
              )}
            </Field>

            <Field label="Meta description" hint={!readOnly ? 'A short summary shown under the headline' : undefined}>
              <textarea placeholder="e.g. Everything you need to know about using our platform and services." value={form.meta_description} maxLength={160} onChange={set('meta_description')} rows={3} disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical' }} />
              {!readOnly && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (form.meta_description.length / 150) * 100)}%`, height: '100%', borderRadius: 999, background: form.meta_description.length > 150 ? '#ef4444' : 'linear-gradient(135deg, #60a5fa, #3b82f6)', transition: 'width 0.2s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: form.meta_description.length > 150 ? '#ef4444' : 'var(--muted)', flexShrink: 0 }}>{form.meta_description.length} / 160</span>
                </div>
              )}
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              <Field label="Meta keywords" hint={!readOnly ? 'Comma separated' : undefined}>
                <input type="text" placeholder="e.g. terms, conditions, policy" value={form.meta_key} onChange={set('meta_key')} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
              </Field>
              <Field label="Keywords" hint={!readOnly ? 'Comma separated' : undefined}>
                <input type="text" placeholder="e.g. help, faq, support" value={form.keywords} onChange={set('keywords')} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
              </Field>
            </div>
          </div>

          {!readOnly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {item ? 'Update Content' : 'Create Content'}
                </>
              )}</button>
              <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Cancel
              </button>
            </div>
          )}
        </form>

        <div style={{ flex: '0 1 340px', minWidth: 280 }}>
          <ContentPreview form={form} />
        </div>
      </div>
    </>
  );
}

function ContentPreview({ form }) {
  const keywords = keywordsToArray(form.keywords);
  const title = form.title.trim() || 'Your Page Title';
  const status = form.status || 'active';
  const meta = STATUS_META[status] || STATUS_META.active;

  return (
    <div style={{ position: 'sticky', top: 24, background: 'linear-gradient(180deg, rgba(20,20,28,0.9) 0%, rgba(16,16,22,0.95) 100%)', color: '#fff', border: '1px solid var(--hairline)', borderRadius: 16, boxShadow: '0 20px 48px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06)', padding: 26, overflow: 'hidden', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14, textAlign: 'center' }}>Live preview</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: `1px solid ${meta.bg}`, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, boxShadow: `0 0 10px ${meta.glow}` }} />
          {meta.label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Content Page
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 10px 24px -8px rgba(59,130,246,0.7)', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      </div>

      {form.description ? (
        <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.7, marginTop: 14, maxHeight: 300, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>{form.description}</div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, fontStyle: 'italic', flex: 1 }}>Add a description to see it here.</div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--ink)' }}>Meta preview</div>
        <div style={{ border: '1px solid var(--hairline)', borderRadius: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#7aa2ff', lineHeight: 1.35, wordBreak: 'break-word' }}>{form.meta_title || title}</div>
          <div style={{ fontSize: 12, color: '#34d399', margin: '2px 0', wordBreak: 'break-all' }}>https://yoursite.com/{title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{form.meta_description || 'Short summary for search engines will appear here.'}</div>
        </div>
      </div>

      {keywords.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--ink)' }}>Keywords</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.slice(0, 10).map((k, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)', color: '#fde68a', fontSize: 11, fontWeight: 600 }}>{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14, background: 'transparent', color: 'var(--ink)' };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
