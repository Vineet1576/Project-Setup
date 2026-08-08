import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoLayout from '../../components/common/InfoLayout';
import { useAuth } from '../../context/AuthContext';
import { faqApi } from '../../methods/api/faq';

const TOPIC_ICONS = [
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L20 5 V11 C20 16 16.6 19.6 12 21 C7.4 19.6 4 16 4 11 V5 Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>,
];

const fallbackFaqs = [
  {
    id: 'getting-started',
    num: '01',
    title: 'Getting started',
    icon: TOPIC_ICONS[0],
    items: [
      { q: 'How do I create an account?', a: 'Click "Get Started" in the navigation or visit /register. Fill in your name, email and password, then confirm your email address using the verification link we send you.' },
      { q: 'How do I verify my email?', a: 'After signing up, check your inbox for a single-use verification link. It expires after 24 hours — if it has expired, request a new one from the login page.' },
      { q: 'What happens after I log in?', a: 'You are taken to your profile page, where you can view and edit your personal details. All requests from that point are signed with your JWT.' },
    ],
  },
  {
    id: 'auth',
    num: '02',
    title: 'Authentication & accounts',
    icon: TOPIC_ICONS[1],
    items: [
      { q: 'I forgot my password. What do I do?', a: 'Visit /forgot-password, enter your email and you will receive a single-use OTP. Use it on the reset page to set a new password.' },
      { q: 'Can I use the same email for two accounts?', a: 'No. Each email address maps to exactly one user. If you try to register an existing email, the API returns an error explaining that the account already exists.' },
      { q: 'Why was I logged out?', a: 'Sessions end when your JWT expires or is invalidated. Simply sign in again to obtain a fresh token.' },
    ],
  },
  {
    id: 'encryption',
    num: '03',
    title: 'Encryption & security',
    icon: TOPIC_ICONS[2],
    items: [
      { q: 'Is my password stored in plaintext?', a: 'Never. Passwords are hashed with a secure one-way algorithm before storage. They cannot be recovered, only reset.' },
      { q: 'What is hybrid RSA + AES-GCM encryption?', a: 'Every request body is encrypted with AES-256-GCM and the session key is wrapped with a server RSA-2048 public key. The server unwraps and decrypts transparently — nothing sensitive travels in plaintext.' },
      { q: 'Where are the encryption keys stored?', a: 'The RSA keypair is generated on first run and written to your .env file. No keys are kept on disk in a separate directory, and private keys never leave the server.' },
    ],
  },
  {
    id: 'troubleshooting',
    num: '04',
    title: 'Troubleshooting',
    icon: TOPIC_ICONS[3],
    items: [
      { q: 'I never received the verification email.', a: 'Check your spam or promotions folder first. Make sure the email address is correct, then request a new link. Add our domain to your contacts so future mail lands in your inbox.' },
      { q: 'The page shows an error after signing in.', a: 'Hard-refresh the page (Ctrl+Shift+R) and try again. If the issue persists, contact us from the Feedback page and include the exact error message you saw.' },
      { q: 'My token expired while I was working.', a: 'Security tokens are intentionally short-lived. Sign back in to continue where you left off — your account data is untouched.' },
    ],
  },
];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'topic';

const mapFaqGroup = (group, index) => {
  const title = group.category || 'General';
  return {
    id: slugify(title),
    num: String(index + 1).padStart(2, '0'),
    title,
    icon: TOPIC_ICONS[index % TOPIC_ICONS.length],
    items: (group.items || []).map((item) => ({
      q: item.question,
      a: item.answer,
    })),
  };
};

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0d15]/60 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-[15px] font-semibold text-white/90">{q}</span>
        <span
          className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-lg border border-white/10 text-blue-400 transition-transform ${open ? 'rotate-45' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="px-5 pb-4 text-[14px] leading-relaxed text-white/55">{a}</p>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const { auth } = useAuth();
  const [open, setOpen] = useState(null);
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const totalAnswers = faqs.reduce((acc, g) => acc + g.items.length, 0);

  useEffect(() => {
    let mounted = true;
    faqApi
      .list()
      .then((res) => {
        const groups = res.data?.data;
        if (mounted && Array.isArray(groups) && groups.length) {
          setFaqs(groups.map(mapFaqGroup));
        }
      })
      .catch(() => {
        // keep the built-in fallback content if the API is unreachable
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <InfoLayout>
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.2),transparent_55%)]" />
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-14">
          <nav className="flex items-center gap-2 text-[13px] text-white/40">
            <Link to="/" className="hover:text-[#3b82f6] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Help Center</span>
          </nav>
          <div className="mt-6 max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              Help Center
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              How can we help?
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              Answers to the most common questions about accounts, security and
              encryption — or get in touch and we&apos;ll help you directly.
            </p>
            <p className="mt-4 text-[13px] text-white/35">
              {faqs.length} topics · {totalAnswers} answers
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-white/10 bg-[#0e0d15]/80 p-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-white/40">On this page</h2>
            <ul className="mt-4 space-y-1">
              {faqs.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-[#3b82f6]">{g.num}</span>
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e0d15]/60 px-5 py-4">
            <p className="text-[12px] leading-relaxed text-white/45">
              Can&apos;t find what you need?{' '}
              <Link to="/feedback" className="text-blue-300 hover:text-blue-200 transition-colors">
                Contact support
              </Link>{' '}
              and we&apos;ll get back to you.
            </p>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {faqs.map((g) => {
            const groupOpen = open;
            return (
              <section
                key={g.id}
                id={g.id}
                className="scroll-mt-28 rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8 hover:border-blue-400/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    {g.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">TOPIC {g.num}</p>
                    <h2 className="mt-1 text-lg font-semibold text-white/95">{g.title}</h2>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="mt-5 space-y-3">
                  {g.items.map((item, i) => {
                    const id = `${g.id}-${i}`;
                    return (
                      <FaqItem
                        key={id}
                        q={item.q}
                        a={item.a}
                        open={groupOpen === id}
                        onToggle={() => setOpen(groupOpen === id ? null : id)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-blue-400/25 bg-gradient-to-br from-[#0c1a3f] via-[#10142e] to-[#0a1025] p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-[#3b82f6]/25 blur-[110px]" />
          <h3 className="relative text-xl sm:text-2xl font-bold tracking-tight">Still need a hand?</h3>
          <p className="relative mt-3 max-w-[460px] mx-auto text-[14px] text-white/60">
            Our support team is happy to help with accounts, security and
            anything in between.
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
            >
              Contact support
            </Link>
            {!auth && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Create an account
              </Link>
            )}
          </div>
        </div>
      </div>
    </InfoLayout>
  );
}
