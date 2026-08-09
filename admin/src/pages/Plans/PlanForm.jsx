import { useState, useEffect, useRef } from 'react';
import { plansApi } from '../../methods/api/plans';
import { featuresApi } from '../../methods/api/features';
import { useToast } from '../../components/common/Toast';

const pricingAmountFor = (pricing, interval) => {
  if (!Array.isArray(pricing)) return '';
  const entry = pricing.find((p) => p.interval === interval);
  return entry?.unit_amount || '';
};

const pricingStripeIdFor = (pricing, interval) => {
  if (!Array.isArray(pricing)) return '';
  const entry = pricing.find((p) => p.interval === interval);
  return entry?.stripe_price_id || '';
};

const featureId = (f) => (typeof f === 'string' ? f : f?._id || f?.id);

export default function PlanForm({ record, onDone, readOnly = false }) {
  const plan = record;
  const [form, setForm] = useState({
    name: '',
    type: 'free',
    description: '',
    recommended: 'no',
    monthlyAmount: '',
    yearlyAmount: '',
  });
  const [features, setFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const descRef = useRef(null);
  const errorRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [form.description]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  useEffect(() => {
    featuresApi.list({ count: 100 })
      .then((res) => setFeatures(res.data?.data || res.data?.docs || []))
      .catch(() => setError('Failed to load features'));
  }, []);

  useEffect(() => {
    const storedType = plan?.type || '';
    const planType = plan?.plan_type || '';
    const isFree = planType === 'free' || storedType === 'free';
    setForm({
      name: plan?.name || '',
      type: isFree ? 'free' : 'paid',
      description: plan?.description || '',
      recommended: plan?.recommended || 'no',
      monthlyAmount: pricingAmountFor(plan?.pricing, 'month'),
      yearlyAmount: pricingAmountFor(plan?.pricing, 'year'),
    });
    setSelectedFeatures(Array.isArray(plan?.features) ? plan.features.map(featureId).filter(Boolean) : []);
    setError('');
  }, [plan]);

  const toggleFeature = (id) => {
    if (readOnly) return;
    setSelectedFeatures((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Plan name is required'); return; }
    setError('');

    const pricing = [];
    if (form.type === 'free') {
      pricing.push({ interval: 'month', interval_count: 1, currency: 'usd', unit_amount: 0, stripe_price_id: '' });
    } else {
      const monthly = Number(form.monthlyAmount);
      const yearly = Number(form.yearlyAmount);
      if (monthly > 0) {
        pricing.push({ interval: 'month', interval_count: 1, currency: 'usd', unit_amount: monthly, stripe_price_id: pricingStripeIdFor(plan?.pricing, 'month') });
      }
      if (yearly > 0) {
        pricing.push({ interval: 'year', interval_count: 1, currency: 'usd', unit_amount: yearly, stripe_price_id: pricingStripeIdFor(plan?.pricing, 'year') });
      }
      if (pricing.length === 0) {
        setError('Enter a monthly or yearly price for paid plans');
        return;
      }
    }

    const payload = {
      id: plan?.id || plan?._id,
      name: form.name.trim(),
      plan_type: form.type === 'free' ? 'free' : 'premium',
      type: form.type,
      description: form.description,
      recommended: form.recommended,
      pricing,
      features: selectedFeatures,
    };

    setSaving(true);
    try {
      if (plan) await plansApi.update(payload);
      else {
        const { id, ...createPayload } = payload;
        await plansApi.create(createPayload);
      }
      showToast(plan ? 'Plan updated' : 'Plan created', 'success');
      onDone();
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save plan';
      setError(message);
      showToast(message, 'error');
    } finally { setSaving(false); }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <>
      {error && <div ref={errorRef} className="status-message status-error">{error}</div>}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1 1 440px', minWidth: 0 }}>
          <SectionTitle>Plan details</SectionTitle>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Field label="Plan name">
              <input type="text" placeholder="e.g. Starter" value={form.name} onChange={set('name')} required disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
            </Field>
            <Field label="Plan type">
              <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
                {[
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Paid' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setForm({ ...form, type: opt.value })}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: readOnly ? 'default' : 'pointer',
                      background: form.type === opt.value ? 'var(--primary)' : 'transparent',
                      color: form.type === opt.value ? '#fff' : 'var(--body)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Field label="Most popular">
            <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--hairline)' }}>
              {[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setForm({ ...form, recommended: opt.value })}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: readOnly ? 'default' : 'pointer',
                    background: form.recommended === opt.value ? 'var(--primary)' : 'transparent',
                    color: form.recommended === opt.value ? '#fff' : 'var(--body)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          </div>

          <SectionTitle
            subtitle={form.type === 'free' ? 'Free plans are always offered at $0.' : 'Charged per subscription interval. Add at least one price.'}
          >
            Pricing
          </SectionTitle>

          {form.type === 'free' ? (
            <div style={{ fontSize: 14, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--hairline)', borderRadius: 14, padding: '14px 16px' }}>
              This plan is <strong style={{ color: 'var(--body)' }}>Free</strong>. Switch to <strong style={{ color: 'var(--body)' }}>Paid</strong> to set monthly and annual pricing.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Field label="Monthly price (USD)">
                <input type="number" min="0" step="0.01" placeholder="e.g. 29" value={form.monthlyAmount} onChange={set('monthlyAmount')} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
              </Field>
              <Field label="Annual price (USD)">
                <input type="number" min="0" step="0.01" placeholder="e.g. 290" value={form.yearlyAmount} onChange={set('yearlyAmount')} disabled={readOnly} style={readOnly ? readOnlyStyle : inputStyle} />
              </Field>
            </div>
          )}

          <SectionTitle subtitle="Selected features are shown on the pricing page.">
            Features
          </SectionTitle>

          {features.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--hairline)', borderRadius: 14, padding: '14px 16px' }}>
              No features found. Add features first under <strong style={{ color: 'var(--body)' }}>Features</strong>.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {features.map((f) => {
                const id = featureId(f);
                const checked = selectedFeatures.includes(id);
                return (
                  <label
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--hairline)',
                      borderRadius: 12,
                      cursor: readOnly ? 'default' : 'pointer',
                      background: checked ? 'rgba(59,130,246,0.10)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={readOnly}
                      onChange={() => toggleFeature(id)}
                      style={{ width: 'auto' }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--body)' }}>{f?.name || 'Feature'}</span>
                  </label>
                );
              })}
            </div>
          )}

          <Field label="Description" style={{ flex: '0 0 auto' }}>
            <textarea ref={descRef} placeholder="Short tagline shown on the pricing page (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={1} disabled={readOnly} style={{ ...(readOnly ? readOnlyStyle : inputStyle), resize: 'none', overflow: 'hidden', minHeight: 0 }} />
          </Field>

          {!readOnly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={saving} className="button-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? 'Saving...' : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {plan ? 'Update' : 'Create'}
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
          <PlanPreview form={form} features={features} selectedFeatures={selectedFeatures} />
        </div>
      </div>
    </>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>{label}</span>
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

function PlanPreview({ form, features, selectedFeatures }) {
  const [cycle, setCycle] = useState('month');
  const monthly = Number(form.monthlyAmount) || 0;
  const yearly = Number(form.yearlyAmount) || 0;
  const amount = cycle === 'month' ? monthly : yearly;
  const suffix = cycle === 'month' ? '/mo' : '/yr';
  const savings = monthly > 0 && yearly > 0 ? Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100) : 0;
  const name = form.name.trim() || 'Plan';
  const chosen = features.filter((f) => selectedFeatures.includes(featureId(f)));

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(20,20,28,0.9) 0%, rgba(16,16,22,0.95) 100%)', color: '#fff', border: '1px solid var(--hairline)', borderRadius: 16, boxShadow: '0 20px 48px -16px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06)', padding: 26, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14, textAlign: 'center' }}>Live preview</div>
      {form.recommended === 'yes' && (
        <div style={{ position: 'absolute', top: 34, right: 12, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, boxShadow: '0 8px 20px -8px rgba(59,130,246,0.7)' }}>MOST POPULAR</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: '0 8px 20px -8px rgba(59,130,246,0.6)' }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{name}</div>
      </div>
      {form.description && <div style={{ fontSize: 12, color: 'var(--body)', marginTop: 8 }}>{form.description}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: cycle === 'month' ? 'var(--ink)' : 'var(--muted)' }}>Monthly</span>
        <div
          onClick={() => setCycle(cycle === 'month' ? 'year' : 'month')}
          style={{ width: 46, height: 26, borderRadius: 999, background: cycle === 'year' ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' : 'rgba(255,255,255,0.14)', position: 'relative', cursor: 'pointer', border: '1px solid var(--hairline)' }}
        >
          <span style={{ position: 'absolute', top: 3, left: cycle === 'year' ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: cycle === 'year' ? 'var(--ink)' : 'var(--muted)' }}>Annual</span>
      </div>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        {form.type === 'free' ? (
          <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)' }}>Free</div>
        ) : amount > 0 ? (
          <div>
            <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)' }}>${amount.toLocaleString()}</span>
            <span style={{ fontSize: 16, color: 'var(--muted)', marginLeft: 4 }}>{suffix}</span>
          </div>
        ) : (
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>Set a price above</div>
        )}
        {form.type === 'paid' && cycle === 'year' && savings > 0 && (
          <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginTop: 2 }}>Save {savings}% vs monthly</div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, textAlign: 'left', color: 'var(--ink)' }}>Included Features</div>
        {chosen.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--body)', listStyle: 'disc', lineHeight: 1.7, maxHeight: 150, overflowY: 'auto' }}>
            {chosen.map((f) => (
              <li key={featureId(f)}>{f?.name || 'Feature'}</li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'left' }}>No features selected</div>
        )}
      </div>

      <div style={{ width: '100%', marginTop: 16, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', color: '#fff', border: 'none', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, textAlign: 'center', boxShadow: '0 8px 24px -8px rgba(59,130,246,0.6)' }}>
        {form.type === 'free' ? 'Start Free Trial' : `Subscribe · $${amount > 0 ? amount.toLocaleString() : '—'}${amount > 0 ? suffix : ''}`}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid var(--hairline)', borderRadius: 14, fontSize: 14 };
const readOnlyStyle = { ...inputStyle, background: 'rgba(255,255,255,0.03)', opacity: 0.8 };
