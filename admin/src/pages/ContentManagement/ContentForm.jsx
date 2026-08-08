import { useState, useEffect } from 'react';
import { contentApi } from '../../methods/api/content';
import { useToast } from '../../components/common/Toast';

const keywordsToString = (keywords) =>
  Array.isArray(keywords) ? keywords.join(', ') : (keywords || '');

const keywordsToArray = (str) =>
  str.split(',').map((s) => s.trim()).filter(Boolean);

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

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical' }} />
        <input type="text" placeholder="Meta title" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type="text" placeholder="Meta description" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type="text" placeholder="Meta keywords (comma separated)" value={form.meta_key} onChange={(e) => setForm({ ...form, meta_key: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <input type="text" placeholder="Keywords (comma separated)" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (item ? 'Update' : 'Create')}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
          </div>
        )}
      </form>
    </>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
