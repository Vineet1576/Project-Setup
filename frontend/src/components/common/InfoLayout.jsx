import Navbar from './Navbar';
import SiteFooter from './SiteFooter';

export default function InfoLayout({ children }) {
  return (
    <div className="min-h-screen text-white bg-[linear-gradient(180deg,#0a0e22_0%,#0b0b10_30%,#0b0b10_70%,#0a0e22_100%)]">
      <Navbar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
