import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaGithub, FaPaperPlane } from 'react-icons/fa';
import Brand from './Brand';

const footerLinks = {
  account: [
    { label: 'Login', to: '/login' },
    { label: 'Create Account', to: '/register' },
    { label: 'Forgot Password', to: '/forgot-password' },
    { label: 'Reset Password', to: '/reset-password' },
  ],
  resources: [
    { label: 'Help Center', to: '/help' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Feedback', to: '/feedback' },
  ],
};

const socials = [
  { label: 'X', icon: <FaTwitter /> },
  { label: 'Instagram', icon: <FaInstagram /> },
  { label: 'LinkedIn', icon: <FaLinkedinIn /> },
  { label: 'GitHub', icon: <FaGithub /> },
];

export default function SiteFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="relative border-t border-white/10 bg-[linear-gradient(180deg,#0b0b10,#0a0e22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6">
            <Brand />
            <p className="mt-5 max-w-[380px] text-[14px] leading-relaxed text-white/50">
              A security-first full-stack starter kit. JWT auth, hybrid
              RSA+AES-GCM encryption, and repository-pattern architecture —
              ready to extend.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="text-[13px] text-white/50">रक्षा</span>
              <span className="w-px h-3 bg-white/15" />
              <span className="text-[12px] uppercase tracking-widest text-blue-300">protection</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-[#3b82f6] hover:border-blue-400/40 hover:bg-white/10 hover:shadow-[0_8px_24px_-8px_rgba(59,130,246,0.5)] transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-white/40">Account</h4>
            <div className="mt-4 h-px w-10 bg-gradient-to-r from-[#3b82f6] to-transparent" />
            <ul className="mt-5 space-y-3.5">
              {footerLinks.account.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-2 text-[14px] text-white/50 hover:text-white transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-400/60 group-hover:bg-[#3b82f6] transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-white/40">Resources</h4>
            <div className="mt-4 h-px w-10 bg-gradient-to-r from-[#3b82f6] to-transparent" />
            <ul className="mt-5 space-y-3.5">
              {footerLinks.resources.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="group inline-flex items-center gap-2 text-[14px] text-white/50 hover:text-white transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-400/60 group-hover:bg-[#3b82f6] transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-b from-[#131a33]/80 to-[#0e1122]/80 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <h4 className="text-[15px] font-semibold text-white/90">Stay in the loop</h4>
              <p className="mt-1 text-[13px] text-white/45">
                Product updates, security tips, and news. No spam.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-[14px] font-medium text-[#7ee2a8]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                You're in! Watch your inbox for the next update.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full lg:max-w-[480px]">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-14 rounded-xl bg-[#131318] border border-white/10 px-5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="inline-flex items-center justify-center w-14 h-14 shrink-0 rounded-xl bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)] hover:opacity-90 transition-opacity"
                >
                  <FaPaperPlane />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
