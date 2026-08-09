import { useState, useEffect } from 'react';
import { categoriesApi } from '../../methods/api/categories';
import { useToast } from '../../components/common/Toast';

const toString = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''));

export default function CategoryForm({ record, onDone, readOnly = false }) {
  const category = record;
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({
      name: toString(category?.name),
    });
    setError('');
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required'); return; }
    setError('');
    setSaving(true);
    try {
      if (category) {
        await categoriesApi.update({ id: category.id || category._id, '0': { name: form.name } });
      } else {
        await categoriesApi.create({ name: form.name });
      }
      showToast(category ? 'Category updated' : 'Category created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save category';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                {category ? 'Update' : 'Create'}
              </>
            )}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              Cancel
            </button>
          </div>
        )}
      </form>
    </>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
