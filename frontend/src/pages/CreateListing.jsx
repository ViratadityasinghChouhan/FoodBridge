import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createFood } from '../store/foodSlice';
import { motion } from 'framer-motion';
import { AlertCircle, MapPin, Image as ImageIcon, Navigation } from 'lucide-react';
import GoogleMapEmbed from '../components/GoogleMapEmbed';

const minimumExpiryTime = () => {
  const now = new Date(Date.now() + 60 * 1000);
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const CreateListing = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cooked',
    type: 'Veg',
    quantity: '',
    pickupAddress: '',
    latitude: '',
    longitude: '',
    expiryTime: '',
    specialInstructions: '',
    image: '',
  });
  const [formError, setFormError] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  const { title, category, type, quantity, pickupAddress, expiryTime, image } = formData;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(state => state.food);
  const { user } = useSelector(state => state.auth);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'donor' && user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Donor access required</h1>
        <p className="mt-3 text-slate-500">Only donor accounts can create food listings.</p>
      </div>
    );
  }

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (new Date(expiryTime) <= new Date()) {
      setFormError('Expiry time must be in the future so receivers can see this listing.');
      return;
    }

    dispatch(createFood(formData)).unwrap()
      .then(() => {
        navigate('/dashboard');
      })
      .catch((message) => {
        setFormError(message || 'Unable to publish listing.');
      });
  };

  const useCurrentLocation = () => {
    setLocationMessage('');

    if (!navigator.geolocation) {
      setFormError('Your browser does not support location access.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = coords.latitude.toFixed(6);
        const longitude = coords.longitude.toFixed(6);
        setFormData((previous) => ({
          ...previous,
          latitude,
          longitude,
          pickupAddress: previous.pickupAddress || `${latitude}, ${longitude}`,
        }));
        setLocationMessage('Pickup location captured. Nearby receivers can now filter by distance.');
      },
      () => setFormError('Location permission was denied. Enter latitude and longitude manually.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Create Food Listing</h1>
        <p className="text-slate-500 mb-8">Share your extra food with those who need it most.</p>

        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Food Title</label>
              <input type="text" name="title" value={title} onChange={onChange} required placeholder="e.g., Leftover Buffet Rice and Curry" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select name="category" value={category} onChange={onChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                <option value="Cooked">Cooked Food</option>
                <option value="Raw">Raw / Groceries</option>
                <option value="Packaged">Packaged Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
              <select name="type" value={type} onChange={onChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
                <option value="Both">Mixed / Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Quantity (Persons)</label>
              <input type="number" name="quantity" value={quantity} onChange={onChange} required placeholder="e.g., 10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Time</label>
              <input type="datetime-local" name="expiryTime" value={expiryTime} min={minimumExpiryTime()} onChange={onChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> Pickup Address</label>
              <textarea name="pickupAddress" value={pickupAddress} onChange={onChange} required rows="2" placeholder="Full address and landmarks..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"></textarea>
            </div>

            <div className="col-span-1 md:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-bold text-emerald-900">Pickup location for distance search</p>
                  <p className="text-sm text-emerald-700">Use your device location, or enter coordinates below.</p>
                </div>
                <button type="button" onClick={useCurrentLocation} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                  <Navigation className="h-4 w-4" /> Use Current Location
                </button>
              </div>
              {locationMessage && <p className="mt-3 text-sm font-medium text-emerald-800">{locationMessage}</p>}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={onChange} placeholder="Latitude (e.g. 19.157413)" className="rounded-lg border border-emerald-100 bg-white px-4 py-2 outline-none focus:border-emerald-500" />
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={onChange} placeholder="Longitude (e.g. 73.238842)" className="rounded-lg border border-emerald-100 bg-white px-4 py-2 outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 overflow-hidden rounded-2xl border border-slate-200">
              <GoogleMapEmbed
                address={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : pickupAddress}
                title="Pickup address preview"
                heightClass="h-72"
                showActions={Boolean(pickupAddress.trim())}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Food Image URL</label>
              <input type="url" name="image" value={image} onChange={onChange} placeholder="Paste an image URL" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition">
            {isLoading ? 'Creating...' : 'Publish Listing'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateListing;
