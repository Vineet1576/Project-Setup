import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoLayout from '../../components/common/InfoLayout';
import { contentApi } from '../../methods/api/content';
import { useToast } from '../../components/common/Toast';

const sections = [
  {
    id: 'collect',
    num: '01',
    title: 'Information we collect',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
    body: [
      'Account details: your name, email address, password (hashed) and profile information when you register or update your profile.',
      'Usage data: anonymized request metadata such as timestamps and IP addresses, used solely for rate limiting, logging and abuse prevention.',
    ],
  },
  {
    id: 'use',
    num: '02',
    title: 'How we use your information',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    ),
    body: [
      'To authenticate you and secure your sessions with JWT-based bearer tokens.',
      'To deliver transactional emails — verification links, OTPs and password resets.',
      'To operate, secure and improve the service, including rate limiting and threat monitoring.',
    ],
  },
  {
    id: 'encryption',
    num: '03',
    title: 'Encryption & data protection',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 L20 5 V11 C20 16 16.6 19.6 12 21 C7.4 19.6 4 16 4 11 V5 Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    body: [
      'Every request between your browser and the API is protected with hybrid RSA + AES-GCM encryption when crypto-secure mode is enabled.',
      'Passwords are never stored in plaintext. They are hashed before they reach the database.',
      'Server-side RSA keypairs are generated on first run and written to .env. Private keys never leave the server and no key files are kept on disk.',
    ],
  },
  {
    id: 'retention',
    num: '04',
    title: 'Data retention',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    body: [
      'We retain your account data for as long as your account is active. You may delete your account at any time by contacting us.',
      'Verification tokens and OTPs are single-use and short-lived; they expire automatically and are never stored in plaintext.',
    ],
  },
  {
    id: 'cookies',
    num: '05',
    title: 'Cookies',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01" />
      </svg>
    ),
    body: [
      'This service is deliberately stateless — authentication uses bearer tokens in memory, not cookies. We do not set tracking cookies or build advertising profiles.',
      'Your browser may still cache assets locally; that is standard browser behaviour and unrelated to the service.',
    ],
  },
  {
    id: 'rights',
    num: '06',
    title: 'Your rights',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    body: [
      'You may request a copy of the data we hold about you, ask us to correct inaccuracies, or request deletion.',
      'To exercise any of these rights, use the Feedback page. We will respond within a reasonable time.',
    ],
  },
  {
    id: 'third-party',
    num: '07',
    title: 'Third-party services',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    body: [
      'Transactional email delivery is the only third-party processor we rely on to send verification and recovery messages.',
      'We never sell, rent or share your personal data with third parties for marketing purposes.',
    ],
  },
];

export default function PrivacyPolicy() {
  const updated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const [cms, setCms] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    contentApi
      .getContent('privacy policy')
      .then((res) => {
        const content = res.data?.data;
        if (mounted && content?.description) setCms(content);
      })
      .catch((err) => {
        if (mounted) {
          toast.showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load content. Please try again.', 'error');
        }
      });
    return () => { mounted = false; };
  }, []);

  return (
    <InfoLayout>
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.2),transparent_55%)]" />
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-14">
          <nav className="flex items-center gap-2 text-[13px] text-white/40">
            <Link to="/" className="hover:text-[#3b82f6] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Privacy Policy</span>
          </nav>
          <div className="mt-6 max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-[12px] font-semibold text-blue-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 L20 5 V11 C20 16 16.6 19.6 12 21 C7.4 19.6 4 16 4 11 V5 Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Privacy
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Your data stays yours
            </h1>
            <p className="mt-4 text-white/60 leading-relaxed">
              We collect only what is required to run a secure, authenticated
              service — and encrypt it in transit.
            </p>
            <p className="mt-4 text-[13px] text-white/35">Last updated: {updated}</p>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-white/10 bg-[#0e0d15]/80 p-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-white/40">On this page</h2>
            {cms ? (
              <p className="mt-4 text-[14px] leading-relaxed text-white/50">
                Content managed by the admin and published from the content management system.
              </p>
            ) : (
              <ul className="mt-4 space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-[11px] font-bold text-[#3b82f6]">{s.num}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e0d15]/60 px-5 py-4">
            <p className="text-[12px] text-white/40">
              Last updated: <span className="text-white/60">{updated}</span>
            </p>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {cms ? (
            <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2 L20 5 V11 C20 16 16.6 19.6 12 21 C7.4 19.6 4 16 4 11 V5 Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">PRIVACY POLICY</p>
                  <h2 className="mt-1 text-lg font-semibold text-white/95">{cms.heading || cms.title}</h2>
                </div>
              </div>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
              <div className="mt-5 space-y-4">
                {cms.description.split(/\n+/).filter(Boolean).map((line) => (
                  <p key={line} className="text-[15px] leading-relaxed text-white/60">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ) : (
            sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-28 rounded-2xl border border-white/10 bg-gradient-to-b from-[#14141c] to-[#101018] p-6 sm:p-8 hover:border-blue-400/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl text-blue-400 bg-gradient-to-br from-[#60a5fa]/20 to-[#3b82f6]/20">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-widest text-[#3b82f6]">SECTION {s.num}</p>
                    <h2 className="mt-1 text-lg font-semibold text-white/95">{s.title}</h2>
                  </div>
                </div>
                <div className="mt-5 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                <div className="mt-5 space-y-3">
                  {s.body.map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-white/60">
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-blue-400/25 bg-gradient-to-br from-[#0c1a3f] via-[#10142e] to-[#0a1025] p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full bg-[#3b82f6]/25 blur-[110px]" />
          <h3 className="relative text-xl sm:text-2xl font-bold tracking-tight">Questions about your data?</h3>
          <p className="relative mt-3 max-w-[460px] mx-auto text-[14px] text-white/60">
            We're happy to explain exactly what we store and why.
          </p>
          <div className="relative mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] shadow-[0_12px_32px_-12px_rgba(59,130,246,0.8)] hover:opacity-90 transition-opacity"
            >
              Feedback
            </Link>
            <Link
              to="/help"
              className="inline-flex items-center justify-center h-11 rounded-xl px-7 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </InfoLayout>
  );
}
