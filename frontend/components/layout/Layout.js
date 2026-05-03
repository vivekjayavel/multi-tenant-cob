import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from '../ui/WhatsAppButton';
export default function Layout({ children, tenant, settings, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar tenant={tenant} />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer tenant={tenant} settings={settings} />}
      <WhatsAppButton number={tenant?.whatsapp_number} />
    </div>
  );
}
