import Navbar from '../common/Navbar';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
      <Navbar />
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_left,rgba(59,130,246,0.16),transparent_60%)]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 lg:min-h-[calc(100vh-80px)]">
          <div className="hidden lg:flex flex-col items-center justify-center relative px-10 py-6">
            <img
              src="/images/security-hero.svg"
              alt="Hybrid RSA and AES encryption diagram"
              className="relative z-10 w-full max-w-[640px] object-contain"
            />
          </div>
          <div className="relative flex items-center justify-center p-6 sm:p-8 lg:p-10 overflow-y-auto">
            <div className="w-full max-w-[560px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
