import { useState, useEffect } from 'react';
import { faqsApi } from '../../methods/api/faqs';
import CategoryDropdown from './CategoryDropdown';
import { useToast } from '../../components/common/Toast';

export default function FaqForm({ record, onDone, readOnly = false }) {
  const faq = record;
  const [form, setForm] = useState({
    category: '',
    question: '',
    answer: '',
    order: 0,
  });
  const [categories, setCategories] = useState([]);
  const [categoryMode, setCategoryMode] = useState('existing');
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm({
      category: faq?.category || '',
      question: faq?.question || '',
      answer: faq?.answer || '',
      order: faq?.order || 0,
    });
    setCategoryMode('existing');
    setNewCategory('');
    setError('');
  }, [faq]);

  useEffect(() => {
    let mounted = true;
    faqsApi
      .categories()
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.categories || [];
        setCategories(list);
        if (faq?.category && !list.includes(faq.category)) {
          setCategories((prev) => [...new Set([faq.category, ...prev])]);
        }
      })
      .catch(() => {
        // categories are optional; the form still works with a typed category
      });
    return () => { mounted = false; };
  }, [faq]);

  const effectiveCategory = categoryMode === 'new' ? newCategory.trim() : form.category;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveCategory) { setError('Category is required'); return; }
    if (!form.question.trim()) { setError('Question is required'); return; }
    if (!form.answer.trim()) { setError('Answer is required'); return; }
    const order = form.order === '' ? 0 : Number(form.order);
    if (!Number.isInteger(order) || order < 0) {
      setError('Order must be a whole number greater than or equal to 0');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = {
        id: faq?.id || faq?._id,
        category: effectiveCategory,
        question: form.question.trim(),
        answer: form.answer.trim(),
        order,
      };
      if (faq) {
        await faqsApi.update(payload);
      } else {
        const { id, ...createPayload } = payload;
        await faqsApi.create(createPayload);
      }
      showToast(faq ? 'FAQ updated' : 'FAQ created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save FAQ';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <>
      {error && <div className="status-message status-error">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categoryMode === 'existing' ? (
          <CategoryDropdown
            value={form.category}
            categories={categories}
            readOnly={readOnly}
            onSelect={(cat) => setForm({ ...form, category: cat })}
            onAddNew={() => setCategoryMode('new')}
          />
        ) : (
          <input
            type="text"
            placeholder="Enter new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            autoFocus
            required={!readOnly}
            disabled={readOnly}
            style={readOnly ? readOnlyStyle : inputStyle}
          />
        )}
        <input type="text" placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        <textarea placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} required disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'vertical' }} />
        <input type="number" min="0" step="1" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                {faq ? 'Update' : 'Create'}
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

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14, background: 'transparent', color: 'var(--ink)' };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
