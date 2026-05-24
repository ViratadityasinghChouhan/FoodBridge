import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Utensils, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const foodSavingQuotes = [
  'Save food today, feed hope tomorrow.',
  'Every plate saved is a promise kept.',
  'Good food belongs on plates, not in bins.',
  'Sharing surplus food turns waste into kindness.',
  'A small donation can become someone’s full meal.',
  'When food is shared, a community grows stronger.',
];

const Home = () => {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Date.now() / (10 * 60 * 1000)) % foodSavingQuotes.length
  );

  useEffect(() => {
    const updateQuote = () => {
      setQuoteIndex(Math.floor(Date.now() / (10 * 60 * 1000)) % foodSavingQuotes.length);
    };
    const interval = window.setInterval(updateQuote, 10 * 60 * 1000);
    updateQuote();
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-50 to-white pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
              Share Food, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
                Spread Hope.
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg">
              Connect your surplus food with NGOs and individuals in need. Join our mission to end food waste and hunger today.
            </p>
            <div className="rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Food Saving Quote</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">"{foodSavingQuotes[quoteIndex]}"</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Changes automatically every 10 minutes.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/register/donor" className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold text-lg hover:bg-emerald-700 transition shadow-xl shadow-emerald-500/30 flex items-center gap-2">
                Donate Food <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register/receiver" className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-500/30 flex items-center gap-2">
                Find Food
              </Link>
            </div>
            <div className="inline-flex flex-col rounded-2xl border border-emerald-100 bg-white px-6 py-4 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Proud Owner</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">viratadityasingh chouhan</p>
              <a href="mailto:viratadityasinghchouhan@gmail.com" className="mt-1 text-sm font-medium text-emerald-700 hover:underline">
                viratadityasinghchouhan@gmail.com
              </a>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 md:max-w-lg"
          >
            <div className="relative w-full overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
              <img
                src="/owner-food-donation-poster.png"
                alt="Food donation campaign by viratadityasingh chouhan"
                className="h-auto w-full object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl text-center border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-600">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-2">1.2M</h3>
              <p className="text-slate-500 font-medium">Meals Saved</p>
            </div>
            <div className="glass p-8 rounded-3xl text-center border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-2">850+</h3>
              <p className="text-slate-500 font-medium">NGO Partners</p>
            </div>
            <div className="glass p-8 rounded-3xl text-center border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-2">3.5k</h3>
              <p className="text-slate-500 font-medium">Active Donors</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
