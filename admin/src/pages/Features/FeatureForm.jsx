import { useState, useEffect } from 'react';
import { featuresApi } from '../../methods/api/features';
import { useToast } from '../../components/common/Toast';

export default function FeatureForm({ record, onDone, readOnly = false }) {
  const feature = record;
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({ name: feature?.name || '' });
    setError('');
  }, [feature]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Feature name is required'); return; }
    setError('');
    setSaving(true);
    try {
      if (feature) {
        await featuresApi.update({ id: feature.id || feature._id, name: form.name.trim() });
      } else {
        await featuresApi.create({ name: [{ name: form.name.trim() }] });
      }
      showToast(feature ? 'Feature updated' : 'Feature created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save feature';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" placeholder="Feature name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : (feature ? 'Update' : 'Create')}</button>
            <button type="button" onClick={onDone} className="button-secondary" style={{ flex: 1 }}>Cancel</button>
          </div>
        )}
      </form>
    </>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
