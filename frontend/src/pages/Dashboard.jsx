import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { confirmPickup, deleteFood, deletePickupRequest, fetchDonorRequests, fetchMyFoods, fetchMyRequests, updateFood, updatePickupRequest, updateRequestStatus } from '../store/foodSlice';
import { BarChart3, CheckCircle, Clock, Edit3, History, KeyRound, MapPin, MessageCircle, Navigation, PlusCircle, Route, Star, Trash2, Truck, Users, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import api from '../utils/api';

const getDirectionsUrl = (address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`;

const toLocalDateTimeInput = (dateValue) => {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const Metric = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    <p className="text-sm font-medium text-slate-500">{label}</p>
  </div>
);

const IncomingRequests = ({ requests, isLoading, onStatusChange }) => (
  <section>
    <h2 className="mb-6 text-2xl font-bold text-slate-800">Requests From Receivers</h2>
    {requests.length > 0 ? (
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{request.food?.title || 'Food listing'}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{request.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Requested by {request.ngo?.name || 'Receiver'}{request.ngo?.phoneNumber ? ` - ${request.ngo.phoneNumber}` : ''}
                </p>
                {request.status === 'Accepted' && request.pickupOtp && (
                  <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <KeyRound className="h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Pickup OTP</p>
                      <p className="text-2xl font-extrabold tracking-[0.22em] text-slate-900">{request.pickupOtp}</p>
                      <p className="text-xs text-slate-500">Share this code after handing over food.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-3">
                <button type="button" onClick={() => onStatusChange(request._id, 'Accepted')} disabled={isLoading || request.status !== 'Pending'} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  <CheckCircle className="h-4 w-4" /> Accept
                </button>
                <button type="button" onClick={() => onStatusChange(request._id, 'Rejected')} disabled={isLoading || request.status !== 'Pending'} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-100 bg-white py-14 text-center text-slate-500">No pickup requests yet.</div>
    )}
  </section>
);

const OutgoingRequests = ({ myRequests, isLoading, onConfirmPickup, onEditRequest, onDeleteRequest }) => {
  const [otps, setOtps] = useState({});
  const [confirmationErrors, setConfirmationErrors] = useState({});

  const submitOtp = (requestId) => {
    setConfirmationErrors((errors) => ({ ...errors, [requestId]: '' }));
    onConfirmPickup(requestId, otps[requestId] || '')
      .then(() => setOtps((values) => ({ ...values, [requestId]: '' })))
      .catch((message) => setConfirmationErrors((errors) => ({ ...errors, [requestId]: message })));
  };

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-slate-800">Your Pickup Requests</h2>
      {myRequests.length > 0 ? (
        <div className="space-y-5">
          {myRequests.map((request) => {
            const food = request.food;
            const isAccepted = request.status === 'Accepted';
            const isCompleted = request.status === 'Completed';
            return (
              <div key={request._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{food?.title || 'Food listing'}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${isCompleted ? 'bg-emerald-50 text-emerald-700' : isAccepted ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{request.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{food?.quantity ? `Feeds ~${food.quantity} people` : 'Pickup request submitted'}</p>
                    {request.message && <p className="mt-2 text-sm text-slate-600">Message: {request.message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'Pending' && (
                      <button type="button" onClick={() => onEditRequest(request)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                    )}
                    {!isCompleted && (
                      <button type="button" onClick={() => onDeleteRequest(request._id)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    )}
                    {isAccepted && food?.pickupAddress && (
                      <a href={getDirectionsUrl(food.pickupAddress)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
                        <Navigation className="h-4 w-4" /> Directions
                      </a>
                    )}
                  </div>
                </div>
                {isAccepted && food?.pickupAddress ? (
                  <div className="mt-5">
                    <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{food.pickupAddress}</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <GoogleMapEmbed address={food.pickupAddress} title={`${food.title} pickup location`} heightClass="h-72" />
                    </div>
                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="mb-3 text-sm font-bold text-blue-900">Confirm food pickup</p>
                      <p className="mb-3 text-sm text-blue-800">Enter the 6-digit OTP provided by the donor after receiving the food.</p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength="6"
                          value={otps[request._id] || ''}
                          onChange={(event) => setOtps((values) => ({
                            ...values,
                            [request._id]: event.target.value.replace(/\D/g, '').slice(0, 6),
                          }))}
                          placeholder="Enter OTP"
                          className="rounded-lg border border-blue-200 bg-white px-4 py-2 font-bold tracking-widest outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => submitOtp(request._id)}
                          disabled={isLoading || (otps[request._id] || '').length !== 6}
                          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Confirm Pickup
                        </button>
                      </div>
                      {confirmationErrors[request._id] && (
                        <p className="mt-3 text-sm font-medium text-red-700">{confirmationErrors[request._id]}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    {isCompleted ? 'Food pickup has been confirmed successfully.' : 'Pickup location will appear here after the donor accepts your request.'}
                  </p>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white py-14 text-center">
          <p className="mb-4 text-slate-500">You don't have any pickup requests.</p>
          <Link to="/browse" className="font-bold text-blue-600 hover:underline">Browse available food</Link>
        </div>
      )}
    </section>
  );
};

const AccountDirectory = ({ accounts, isLoading, error }) => (
  <section>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-800">Donor And Receiver Accounts</h2>
      <p className="mt-1 text-sm text-slate-500">All existing and newly registered user accounts appear here.</p>
    </div>

    {error && (
      <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {error}
      </div>
    )}

    {isLoading ? (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
        Loading accounts...
      </div>
    ) : accounts.length > 0 ? (
      <div className="space-y-5">
        {accounts.map((account) => (
          <div key={account._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{account.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${account.role === 'donor' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                    {account.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Registered {new Date(account.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-500">{account.email}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
              <p><span className="font-bold text-slate-700">Phone:</span> {account.phoneNumber || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Organization:</span> {account.organizationName || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Type:</span> {account.organizationType || 'Not provided'}</p>
              <p className="md:col-span-2"><span className="font-bold text-slate-700">Address:</span> {account.address || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Map location:</span> {account.mapLocation || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Food preference:</span> {account.foodTypePreference || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Volunteers:</span> {account.volunteerCount ?? 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">Verification document:</span> {account.verificationDocument || 'Not provided'}</p>
              <p><span className="font-bold text-slate-700">NGO certificate:</span> {account.ngoCertificate || 'Not provided'}</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
        No donor or receiver accounts registered yet.
      </div>
    )}
  </section>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { myFoods, requests, myRequests, isLoading } = useSelector((state) => state.food);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'donor' || user.role === 'admin') {
      dispatch(fetchMyFoods());
      dispatch(fetchDonorRequests());
    }

    if (user.role === 'receiver' || user.role === 'admin') {
      dispatch(fetchMyRequests());
    }

    if (user.role === 'admin') {
      api.get('/auth/users')
        .then((response) => {
          setAccounts(response.data);
          setAccountsError('');
        })
        .catch((error) => setAccountsError(error.response?.data?.message || 'Unable to load account details.'))
        .finally(() => setAccountsLoading(false));
    }
  }, [user, navigate, dispatch]);

  if (!user) return null;

  const handleRequestStatus = (requestId, status) => {
    dispatch(updateRequestStatus({ requestId, status }));
  };

  const handleConfirmPickup = (requestId, otp) =>
    dispatch(confirmPickup({ requestId, otp })).unwrap();

  const editPickupRequest = (request) => {
    const message = window.prompt('Update pickup request message', request.message || '');
    if (message !== null) {
      dispatch(updatePickupRequest({ requestId: request._id, message: message.trim() }));
    }
  };

  const removePickupRequest = (requestId) => {
    if (window.confirm('Delete this pickup request?')) {
      dispatch(deletePickupRequest(requestId));
    }
  };

  const markFoodExpired = (foodId) => {
    dispatch(updateFood({ foodId, foodData: { status: 'Expired' } }));
  };

  const editFoodDetails = (food) => {
    const title = window.prompt('Food title', food.title);
    if (title === null) return;

    const category = window.prompt('Category: Cooked, Raw, or Packaged', food.category);
    if (category === null) return;

    const type = window.prompt('Type: Veg, Non-Veg, or Both', food.type);
    if (type === null) return;

    const quantity = window.prompt('Quantity - number of persons', food.quantity);
    if (quantity === null) return;

    const expiryTime = window.prompt('Expiry date and time', toLocalDateTimeInput(food.expiryTime));
    if (expiryTime === null) return;

    const pickupAddress = window.prompt('Pickup address', food.pickupAddress || '');
    if (pickupAddress === null) return;

    dispatch(updateFood({
      foodId: food._id,
      foodData: {
        title: title.trim(),
        category: category.trim(),
        type: type.trim(),
        quantity,
        expiryTime,
        pickupAddress: pickupAddress.trim(),
      },
    }));
  };

  const removeFood = (foodId) => {
    if (window.confirm('Delete this food listing?')) {
      dispatch(deleteFood(foodId));
    }
  };

  if (user.role === 'receiver') {
    return (
      <div className="min-h-screen bg-blue-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-blue-700">Receiver Dashboard</p>
              <h1 className="text-4xl font-extrabold text-slate-900">Find and collect food</h1>
            </div>
            <Link to="/browse" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">
              <Route className="h-5 w-5" /> Browse Nearby Food
            </Link>
          </div>
          <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric icon={Truck} label="Pickup Requests" value={myRequests.length} color="bg-blue-100 text-blue-700" />
            <Metric icon={CheckCircle} label="Accepted" value={myRequests.filter((r) => r.status === 'Accepted').length} color="bg-emerald-100 text-emerald-700" />
            <Metric icon={Star} label="Favorite Donors" value="0" color="bg-amber-100 text-amber-700" />
            <Metric icon={MessageCircle} label="Chats" value="0" color="bg-indigo-100 text-indigo-700" />
          </div>
          <OutgoingRequests myRequests={myRequests} isLoading={isLoading} onConfirmPickup={handleConfirmPickup} onEditRequest={editPickupRequest} onDeleteRequest={removePickupRequest} />
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-12">
          <div>
            <p className="font-bold text-slate-600">Admin Dashboard</p>
            <h1 className="text-4xl font-extrabold text-slate-900">Platform control center</h1>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Metric icon={Users} label="Registered Accounts" value={accounts.length} color="bg-slate-200 text-slate-700" />
            <Metric icon={BarChart3} label="Donors" value={accounts.filter((account) => account.role === 'donor').length} color="bg-emerald-100 text-emerald-700" />
            <Metric icon={History} label="Receivers" value={accounts.filter((account) => account.role === 'receiver').length} color="bg-blue-100 text-blue-700" />
            <Metric icon={Truck} label="Pickup Requests" value={requests.length} color="bg-slate-200 text-slate-700" />
          </div>
          <AccountDirectory accounts={accounts} isLoading={accountsLoading} error={accountsError} />
          <IncomingRequests requests={requests} isLoading={isLoading} onStatusChange={handleRequestStatus} />
          <OutgoingRequests myRequests={myRequests} isLoading={isLoading} onConfirmPickup={handleConfirmPickup} onEditRequest={editPickupRequest} onDeleteRequest={removePickupRequest} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold text-emerald-700">Donor Dashboard</p>
            <h1 className="text-4xl font-extrabold text-slate-900">Manage donations</h1>
          </div>
          <Link to="/create-listing" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
            <PlusCircle className="h-5 w-5" /> Add Food Listing
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric icon={BarChart3} label="Active Listings" value={myFoods.length} color="bg-emerald-100 text-emerald-700" />
          <Metric icon={Truck} label="Requests" value={requests.length} color="bg-amber-100 text-amber-700" />
          <Metric icon={History} label="Donation History" value="0" color="bg-violet-100 text-violet-700" />
          <Metric icon={MessageCircle} label="Chats" value="0" color="bg-sky-100 text-sky-700" />
        </div>

        <section>
          <h2 className="mb-6 text-2xl font-bold text-slate-800">Your Listings</h2>
          {myFoods.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myFoods.map((food) => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={food._id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="relative h-48 w-full">
                    <img src={food.image} alt={food.title} className="h-full w-full object-cover" />
                    <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">{food.status}</div>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-slate-900">{food.title}</h3>
                    <p className="mb-2 text-sm text-slate-500">Feeds ~{food.quantity} people</p>
                    <p className="mb-2 text-sm font-medium text-slate-600">{food.category} - {food.type}</p>
                    <span className="flex items-center gap-1 text-sm font-medium text-orange-500"><Clock className="h-4 w-4" /> Exp: {new Date(food.expiryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => editFoodDetails(food)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button type="button" onClick={() => markFoodExpired(food._id)} className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
                        Expire
                      </button>
                      <button type="button" onClick={() => removeFood(food._id)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
              <p className="mb-4 text-slate-500">You haven't listed any food yet.</p>
              <Link to="/create-listing" className="font-bold text-emerald-600 hover:underline">Create your first listing</Link>
            </div>
          )}
        </section>

        <IncomingRequests requests={requests} isLoading={isLoading} onStatusChange={handleRequestStatus} />
      </div>
    </div>
  );
};

export default Dashboard;
