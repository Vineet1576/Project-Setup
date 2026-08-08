export default function Brand({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex items-center justify-center w-9 h-9 rounded-xl text-white bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4.2" y="2.5" width="4" height="19" rx="2" fill="currentColor" />
          <path d="M8.2 2.5 L15.8 2.5 C18.8 2.5 20 5.6 20 8 C20 10.4 18.8 13.5 15.8 13.5 L8.2 13.5 Z" fill="currentColor" />
          <path d="M12.6 13.5 L18.6 21.5" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="12" cy="8.4" r="2.3" fill="#0b0b10" />
          <rect x="11.1" y="10.2" width="1.8" height="3.2" rx="0.9" fill="#0b0b10" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-white">
        {import.meta.env.VITE_APP_NAME || 'Raksha'}
      </span>
    </span>
  );
}
