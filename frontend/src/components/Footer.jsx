const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-primary-500">♥</span> FoodBridge
          </h3>
          <p className="text-sm">Connecting surplus food with those in need. Let's make zero hunger a reality.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-primary-400">Home</a></li>
            <li><a href="/about" className="hover:text-primary-400">About Us</a></li>
            <li><a href="/browse" className="hover:text-primary-400">Browse Food</a></li>
            <li><a href="/ngos" className="hover:text-primary-400">NGO Partners</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy" className="hover:text-primary-400">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-primary-400">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>support@foodbridge.com</li>
            <li>+1 (555) 123-4567</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
        &copy; {new Date().getFullYear()} FoodBridge. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
