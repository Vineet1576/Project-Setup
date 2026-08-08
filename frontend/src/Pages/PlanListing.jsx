import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import SiteFooter from '../components/common/SiteFooter';
import apiClient from '../methods/api/apiClient';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';

const PlanListing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState('month');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollPlans = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth / 3 + 24;
    el.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;

    const fetchPlans = async () => {
      try {
        const payload = { page: 1, count: 50, status: 'active', interval: billingCycle };
        const result = await apiClient.get('plans/list', { params: payload });
        if (!active) return;
        if (result.data?.success) {
          const plansData = Array.isArray(result.data) ? result.data : (result.data.plans || result.data.data || result.data.docs || []);
          const formattedPlans = plansData.map((plan) => ({
            id: plan._id || plan.id,
            name: plan.name || 'Unnamed Plan',
            type: plan.type || 'paid',
            plan_type: plan.plan_type || 'premium',
            description: plan.description || '',
            pricing: plan.pricing || [],
            features: plan.features || [],
            status: plan.status || 'active',
            recommended: plan.recommended || 'no',
            trial_period_days: plan.trial_period_days || 0,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          }));
          setPlans(formattedPlans);
        } else {
          setError('Failed to load plans');
        }
      } catch (err) {
        if (!active) return;
        console.error('Error fetching plans:', err);
        console.error('Error response:', err.response?.data);
        setError('Error fetching plans: ' + (err.message || 'Unknown error'));
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPlans();

    return () => {
      active = false;
    };
  }, [billingCycle]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(updateScrollButtons, 60);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [plans, billingCycle, loading]);

  const getPriceForPlan = (plan, cycle = 'month') => {
    const pricing = plan.pricing || [];
    const priceObj = pricing.find((p) => p.interval === cycle);
    if (!priceObj) return null;
    const amount = priceObj.unit_amount || 0;
    const intervalCount = priceObj.interval_count || 1;
    let displayAmount = amount;
    let suffix = '';
    if (cycle === 'year' && priceObj.interval === 'month') {
      displayAmount = amount * 12 * intervalCount;
      suffix = '/yr';
    } else if (cycle === 'month' && priceObj.interval === 'year') {
      displayAmount = Math.round(amount / 12);
      suffix = '/mo';
    } else if (priceObj.interval === 'month') {
      suffix = intervalCount > 1 ? `/${intervalCount}mo` : '/mo';
    } else if (priceObj.interval === 'year') {
      suffix = intervalCount > 1 ? `/${intervalCount}yr` : '/yr';
    }
    return {
      amount: displayAmount,
      display: `$${displayAmount.toLocaleString()}`,
      suffix: suffix,
      entry: priceObj,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
        <Navbar />
        <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Our Plans</h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a free trial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-b from-[#14141c] to-[#101018] rounded-2xl border border-white/10 p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-white/10 rounded w-full mb-6"></div>
                <div className="h-12 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>
                <div className="mt-8 h-12 bg-white/10 rounded w-full"></div>
              </div>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
        <Navbar />
        <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Our Plans</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a free trial.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex w-[320px] max-w-full items-center rounded-full border border-white/10 bg-[#101018] p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setBillingCycle('month')}
              aria-pressed={billingCycle === 'month'}
              className={`flex-1 px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'month' ? 'bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-white shadow-[0_6px_16px_-6px_rgba(59,130,246,0.7)]' : 'text-white/50 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('year')}
              aria-pressed={billingCycle === 'year'}
              className={`flex-1 px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'year' ? 'bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-white shadow-[0_6px_16px_-6px_rgba(59,130,246,0.7)]' : 'text-white/50 hover:text-white'}`}
            >
              Annual
            </button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/50">No plans available at the moment.</p>
          </div>
        ) : (
          <div className="relative">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollPlans(-1)}
                aria-label="Scroll plans left"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-[#101018]/90 backdrop-blur text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)] hover:border-blue-400/50 hover:bg-[#1a1a26] transition-all"
                style={{ marginLeft: -18 }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}

            <div
              ref={scrollRef}
              onScroll={updateScrollButtons}
              className="flex gap-6 overflow-x-auto py-1 plans-scroll no-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="shrink-0"
                  style={{ flex: '0 0 calc((100% - 48px) / 3)', minWidth: 280, scrollSnapAlign: 'start' }}
                >
                  <PlanCard
                    plan={plan}
                    billingCycle={billingCycle}
                    getPriceForPlan={getPriceForPlan}
                  />
                </div>
              ))}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollPlans(1)}
                aria-label="Scroll plans right"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full border border-white/15 bg-[#101018]/90 backdrop-blur text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)] hover:border-blue-400/50 hover:bg-[#1a1a26] transition-all"
                style={{ marginRight: -18 }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>
        )}

        {plans.length > 0 && (
          <div className="mt-10 text-center text-sm text-white/50">
            <p>
              All plans include a 3-day free trial. No credit card required.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

function PlanCard({ plan, billingCycle, getPriceForPlan }) {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { showToast } = useToast();
  const [subscribing, setSubscribing] = useState(false);

  const isFree = plan.type === 'free' || plan.plan_type === 'free';
  const isPopular = plan.recommended === 'yes';

  const monthlyPrice = getPriceForPlan(plan, 'month');
  const yearlyPrice = getPriceForPlan(plan, 'year');
  const priceInfo = billingCycle === 'year'
    ? (yearlyPrice || monthlyPrice)
    : (monthlyPrice || yearlyPrice);

  const monthlyAmount = monthlyPrice?.amount || 0;
  const yearlyAmount = yearlyPrice?.amount || 0;
  const savings = monthlyAmount > 0 && yearlyAmount > 0
    ? Math.round(((monthlyAmount * 12 - yearlyAmount) / (monthlyAmount * 12)) * 100)
    : 0;

  const showSavings = !isFree && billingCycle === 'year' && savings > 0;

  const subscription = auth?.user?.subscriptionId;
  const alreadyPurchased =
    !!subscription &&
    subscription.status === 'active' &&
    String(subscription.plan_id) === String(plan.id) &&
    subscription.interval?.type === billingCycle &&
    Number(subscription.interval?.interval_count) === 1;

  const handleSubscribe = async () => {
    if (!auth?.token) {
      navigate('/login', { state: { from: '/plans' } });
      return;
    }

    if (isFree) {
      try {
        setSubscribing(true);
        const res = await apiClient.post('/subscriptions/purchase', {
          plan_id: plan.id,
          interval: { type: 'month', interval_count: 1 },
        });
        const body = res.data || {};
        if (body.data) {
          window.location.href = body.data;
        } else {
          showToast('Free plan activated successfully', 'success');
        }
      } catch (err) {
        const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to activate free plan';
        showToast(message, 'error');
      } finally {
        setSubscribing(false);
      }
      return;
    }

    const entry = (plan.pricing || []).find((p) => p.interval === billingCycle) || (plan.pricing || [])[0];
    if (!entry?.stripe_price_id) {
      showToast('This plan is not available for purchase', 'error');
      return;
    }

    try {
      setSubscribing(true);
      const res = await apiClient.post('/subscriptions/purchase', {
        plan_id: plan.id,
        stripe_price_id: entry.stripe_price_id,
        interval: { type: entry.interval, interval_count: entry.interval_count || 1 },
      });
      const body = res.data || {};
      if (body.data) {
        window.location.href = body.data;
      } else {
        showToast('Checkout session created', 'success');
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to start checkout';
      showToast(message, 'error');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col h-full text-white rounded-[20px] p-[28px] overflow-hidden transition-all duration-300 border ${
        isPopular
          ? 'border-blue-400/50 bg-[linear-gradient(180deg,rgba(37,50,84,0.55)_0%,rgba(14,16,28,0.92)_60%)] shadow-[0_24px_60px_-16px_rgba(59,130,246,0.4),0_0_0_1px_rgba(59,130,246,0.12)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(24,24,34,0.92)_0%,rgba(13,13,20,0.96)_100%)] shadow-[0_18px_48px_-18px_rgba(0,0,0,0.6),0_0_0_1px_rgba(59,130,246,0.04)] hover:border-blue-400/30 hover:shadow-[0_24px_60px_-16px_rgba(59,130,246,0.25),0_0_0_1px_rgba(59,130,246,0.1)] hover:-translate-y-1'
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${isPopular ? 'bg-gradient-to-r from-[#93c5fd] via-[#3b82f6] to-[#1d4ed8]' : 'bg-gradient-to-r from-transparent via-blue-400/40 to-transparent'}`} />

      {isPopular && (
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[320px] h-[220px] bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
      )}

      {isPopular && (
        <div className="absolute top-[30px] right-3 bg-gradient-to-br from-[#60a5fa] to-[#2563eb] text-white py-1 px-3.5 rounded-full text-[11px] font-bold tracking-wide shadow-[0_8px_20px_-6px_rgba(59,130,246,0.8)]">
          MOST POPULAR
        </div>
      )}

      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-[44px] h-[44px] rounded-[14px] flex items-center justify-center text-white font-bold text-[18px] shrink-0 ${
          isPopular
            ? 'bg-gradient-to-br from-[#93c5fd] to-[#2563eb] shadow-[0_10px_24px_-8px_rgba(59,130,246,0.7)]'
            : 'bg-white/10 border border-white/10'
        }`}>
          {(plan.name || 'P').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-[19px] font-bold text-white leading-tight truncate">{plan.name}</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
            {isFree ? 'Free Plan' : billingCycle === 'year' ? 'Annual Billing' : 'Monthly Billing'}
          </div>
        </div>
      </div>

      {plan.description && (
        <p className="text-[13px] leading-relaxed text-white/55 mt-4">{plan.description}</p>
      )}

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-baseline justify-center gap-1">
          {isFree ? (
            <span className="text-[42px] font-extrabold text-white leading-none tracking-tight">Free</span>
          ) : priceInfo ? (
            <>
              <span className="text-[18px] font-bold text-blue-300/90">$</span>
              <span className="text-[42px] font-extrabold text-white leading-none tracking-tight">
                {priceInfo.amount.toLocaleString()}
              </span>
              <span className="text-[16px] font-medium text-white/40 ml-1">{priceInfo.suffix}</span>
            </>
          ) : (
            <span className="text-[15px] text-white/40">Price not available</span>
          )}
        </div>

        <div className="mt-2 text-center">
          <span className="text-[12px] text-white/35">
            {isFree ? 'No credit card required' : billingCycle === 'year' ? 'Billed annually' : 'Billed monthly'} · Cancel anytime
          </span>
          {showSavings && (
            <div className="mt-2.5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-400/25 text-[12px] font-bold text-green-400 whitespace-nowrap">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Save {savings}% vs monthly
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-sm text-white/90">What's included</div>
          <div className="text-[11px] font-semibold text-white/45 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
            {plan.features?.length || 0} features
          </div>
        </div>
        {plan.features && plan.features.length > 0 ? (
          <ul className="space-y-2.5 text-[13px] text-white/75 leading-snug max-h-[220px] overflow-y-auto pr-1 m-0">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-[18px] h-[18px] rounded-full bg-blue-500/15 border border-blue-400/25 flex items-center justify-center flex-shrink-0 mt-px">
                  <svg className="w-[10px] h-[10px] text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className="leading-relaxed">{feature.name || 'Feature'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[13px] text-white/40">No features listed</div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={subscribing || alreadyPurchased}
        className={`w-full mt-6 py-3.5 rounded-[12px] font-bold text-sm tracking-wide text-center transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
          alreadyPurchased
            ? 'bg-green-500/10 text-green-400 border border-green-400/30'
            : isPopular
              ? 'cursor-pointer bg-gradient-to-br from-[#60a5fa] to-[#2563eb] text-white shadow-[0_10px_28px_-8px_rgba(59,130,246,0.8)] hover:shadow-[0_14px_36px_-8px_rgba(59,130,246,0.9)] hover:brightness-110'
              : 'cursor-pointer bg-white/[0.06] text-white border border-white/15 hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-[#60a5fa] hover:to-[#2563eb] hover:shadow-[0_10px_28px_-8px_rgba(59,130,246,0.7)]'
        }`}
      >
        {alreadyPurchased
          ? `Subscribed${billingCycle === 'year' ? ' · Annual' : ''}`
          : subscribing
            ? 'Processing...'
            : isFree
              ? 'Start Free Trial'
              : `Subscribe · $${priceInfo ? priceInfo.amount.toLocaleString() : '\u2014'}${priceInfo ? priceInfo.suffix : ''}`}
      </button>

      <p className="mt-3.5 text-center text-[11px] text-white/30">
        {Number(plan.trial_period_days) > 0 ? 'Cancel anytime during your trial' : 'Manage or cancel anytime'}
      </p>
    </div>
  );
}

export default PlanListing;