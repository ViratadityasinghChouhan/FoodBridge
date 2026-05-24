import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFoods, requestPickup } from '../store/foodSlice';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, MapPin, Navigation, PlusCircle, Users } from 'lucide-react';
import GoogleMapEmbed from '../components/GoogleMapEmbed';

const parseCoordinates = (value) => {
  const match = String(value || '').match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
};

const BrowseFood = () => {
  const { user } = useSelector((state) => state.auth);
  const { foods, isLoading, isError, message } = useSelector((state) => state.food);
  const dispatch = useDispatch();
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [requestingFoodId, setRequestingFoodId] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [distance, setDistance] = useState('');
  const [foodType, setFoodType] = useState('');
  const [receiverLocation, setReceiverLocation] = useState(() => parseCoordinates(user?.mapLocation));
  const [locationMessage, setLocationMessage] = useState(
    parseCoordinates(user?.mapLocation) ? 'Using your saved receiver location.' : ''
  );

  useEffect(() => {
    const params = receiverLocation
      ? {
          latitude: receiverLocation.latitude,
          longitude: receiverLocation.longitude,
          ...(distance ? { maxDistance: distance } : {}),
          ...(foodType ? { type: foodType } : {}),
        }
      : foodType ? { type: foodType } : {};
    dispatch(fetchFoods(params));
  }, [dispatch, distance, foodType, receiverLocation]);

  const selectedFood = useMemo(
    () => foods.find((food) => food._id === selectedFoodId) || foods[0],
    [foods, selectedFoodId]
  );

  const handleRequestPickup = (foodId) => {
    if (!user) {
      setRequestMessage('Please sign in to request pickup.');
      return;
    }

    if (user.role !== 'receiver' && user.role !== 'admin') {
      setRequestMessage('Only receiver accounts can request pickup.');
      return;
    }

    setRequestingFoodId(foodId);
    setRequestMessage('');
    dispatch(requestPickup(foodId)).then((res) => {
      setRequestingFoodId(null);
      if (res.error) {
        setRequestMessage(res.payload || 'Unable to request pickup.');
        return;
      }
      setRequestMessage('Pickup request sent. Waiting for the donor to accept it.');
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Your browser does not support location access.');
      return;
    }

    setLocationMessage('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setReceiverLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage('Using your current location for distance search.');
      },
      () => setLocationMessage('Location permission denied. Add coordinates to your receiver profile to use distance filtering.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const changeDistance = (event) => {
    const selectedDistance = event.target.value;
    if (selectedDistance && !receiverLocation) {
      setLocationMessage('Choose Use Current Location first, or save coordinates in your receiver profile.');
      return;
    }
    setDistance(selectedDistance);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="w-full h-96 bg-slate-200 relative border-b border-slate-300">
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={5}
          >
            {foods.map(food => {
              if (food.coordinates?.lat) {
                return (
                  <Marker 
                    key={food._id} 
                    position={{ lat: food.coordinates.lat, lng: food.coordinates.lng }}
                    onClick={() => setSelectedFoodId(food._id)}
                  />
                );
              }
              return null;
            })}
            
            {selectedFood && selectedFood.coordinates?.lat && (
              <InfoWindow
                position={{ lat: selectedFood.coordinates.lat, lng: selectedFood.coordinates.lng }}
                onCloseClick={() => setSelectedFoodId(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-bold text-sm text-slate-900">{selectedFood.title}</h3>
                  <p className="text-xs text-slate-600 mb-2">Feeds ~{selectedFood.quantity} pax</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Available Donations</h1>
            <p className="text-slate-500 mt-2">Fresh food waiting to be rescued, showing maximum quantity first.</p>
            {locationMessage && <p className="mt-2 text-sm font-medium text-blue-700">{locationMessage}</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-4">
            <button type="button" onClick={useCurrentLocation} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 font-bold text-blue-700 hover:bg-blue-100">
              <Navigation className="h-4 w-4" /> Use Current Location
            </button>
            <select value={distance} onChange={changeDistance} className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 outline-none focus:border-primary-500">
              <option value="">Any Distance</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="30">Within 30 km</option>
            </select>
            <select value={foodType} onChange={(event) => setFoodType(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-700 outline-none focus:border-primary-500">
              <option value="">All Types</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Both">Mixed / Both</option>
            </select>
          </div>
        </div>

        {requestMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{requestMessage}</span>
          </div>
        )}

        {isError && message && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {isLoading && foods.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <MapPin className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">
              {distance ? `No donations within ${distance} km` : 'No available donations right now'}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              {distance
                ? 'Try a larger distance range or select Any Distance to view more available food.'
                : 'Listings appear here only when their status is Available and their expiry time is still in the future.'}
            </p>
            {(user?.role === 'donor' || user?.role === 'admin') && (
              <Link
                to="/create-listing"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
              >
                <PlusCircle className="h-4 w-4" />
                Add a donation
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {foods.map((food, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={food._id} 
                onMouseEnter={() => setSelectedFoodId(food._id)}
                onFocus={() => setSelectedFoodId(food._id)}
                tabIndex={0}
                className={`bg-white rounded-3xl overflow-hidden border shadow-sm transition group outline-none hover:shadow-xl focus:ring-2 focus:ring-primary-500 ${selectedFood?._id === food._id ? 'border-primary-300' : 'border-slate-100'}`}
              >
                <div className="h-56 w-full relative overflow-hidden">
                  <img src={food.image} alt={food.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1">
                    {food.type === 'Veg' ? <span className="w-2 h-2 rounded-full bg-green-500"></span> : food.type === 'Non-Veg' ? <span className="w-2 h-2 rounded-full bg-red-500"></span> : <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                    {food.type}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{food.title}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedFoodId(food._id)}
                    className="mb-4 flex w-full items-start gap-2 text-left text-sm text-slate-500 transition hover:text-primary-700"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <span className="line-clamp-1">{food.pickupAddress}</span>
                  </button>
                  {food.distanceKm !== null && (
                    <p className="mb-4 text-sm font-bold text-blue-700">{food.distanceKm} km away</p>
                  )}
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <Users className="w-4 h-4 text-primary-500"/> ~{food.quantity} pax
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <Clock className="w-4 h-4 text-orange-500"/> {new Date(food.expiryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRequestPickup(food._id)}
                    disabled={requestingFoodId === food._id}
                    className="w-full bg-primary-50 text-primary-700 font-bold py-3 rounded-xl hover:bg-primary-600 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {requestingFoodId === food._id ? 'Requesting...' : 'Request Pickup'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseFood;
