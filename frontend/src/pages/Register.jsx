import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, register, resendVerification, reset, sendPhoneOtp, verifyEmailOtp, verifyPhoneOtp } from '../store/authSlice';
import { Building2, HandHeart, MapPin, Upload, Users } from 'lucide-react';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Register = () => {
  const location = useLocation();
  const accountType = useMemo(
    () => (location.pathname.includes('donor') ? 'donor' : 'receiver'),
    [location.pathname]
  );
  const isDonor = accountType === 'donor';

  const [formData, setFormData] = useState({
    name: '',
    organizationName: '',
    organizationType: isDonor ? 'Restaurant' : 'NGO',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    mapLocation: '',
    profilePicture: '',
    foodTypePreference: 'Veg',
    verificationDocument: '',
    ngoCertificate: '',
    volunteerCount: '',
  });
  const [verification, setVerification] = useState(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      alert(message);
    }
    if (user) {
      navigate('/dashboard');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Password and confirm password do not match.');
      return;
    }
    dispatch(register({ ...formData, role: accountType }))
      .unwrap()
      .then((response) => {
        setVerification(response);
        setEmailVerified(false);
        setPhoneVerified(!response.needsPhoneVerification);
        setEmailOtp(response.emailOtp || '');
        setPhoneOtp(response.phoneOtp || '');
        alert(response.message || 'Account created. OTP sent to your email and phone number.');
      })
      .catch((error) => alert(error));
  };

  const handleGoogleCredential = useCallback((credential) => {
    dispatch(googleLogin({ credential, role: accountType }));
  }, [accountType, dispatch]);

  const handleResendEmailOtp = () => {
    dispatch(resendVerification(formData.email))
      .unwrap()
      .then((response) => {
        setVerification((current) => ({ ...current, ...response }));
        if (response.emailOtp) {
          setEmailOtp(response.emailOtp);
        }
        alert(response.emailOtp ? `${response.message} OTP: ${response.emailOtp}` : response.message || 'Email OTP sent.');
      })
      .catch((error) => alert(error));
  };

  const handleVerifyEmailOtp = () => {
    dispatch(verifyEmailOtp({ email: formData.email, otp: emailOtp }))
      .unwrap()
      .then((response) => {
        setEmailVerified(true);
        alert(response.message || 'Email verified successfully.');
      })
      .catch((error) => alert(error));
  };

  const handleResendPhoneOtp = () => {
    dispatch(sendPhoneOtp({ email: formData.email, phoneNumber: formData.phoneNumber }))
      .unwrap()
      .then((response) => {
        setVerification((current) => ({ ...current, ...response }));
        if (response.phoneOtp) {
          setPhoneOtp(response.phoneOtp);
        }
        alert(response.phoneOtp ? `${response.message} OTP: ${response.phoneOtp}` : response.message || 'Phone OTP sent.');
      })
      .catch((error) => alert(error));
  };

  const handleVerifyPhoneOtp = () => {
    dispatch(verifyPhoneOtp({ email: formData.email, phoneNumber: formData.phoneNumber, otp: phoneOtp }))
      .unwrap()
      .then((response) => {
        setPhoneVerified(true);
        alert(response.message || 'Phone number verified successfully.');
      })
      .catch((error) => alert(error));
  };

  const mapAddress = formData.mapLocation || formData.address;

  return (
    <div className={`min-h-screen py-12 px-6 ${isDonor ? 'bg-emerald-50' : 'bg-blue-50'}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${isDonor ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {isDonor ? <HandHeart className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {isDonor ? 'Donor Registration' : 'Receiver / NGO Registration'}
            </h1>
            <p className="mt-2 text-slate-600">
              {isDonor ? 'For hostels, restaurants, PGs, halls, cafeterias, mess owners, and individuals.' : 'For NGOs, volunteers, charities, food rescue teams, and people seeking food support.'}
            </p>
          </div>
          <Link to="/login" className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50">
            Login
          </Link>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-slate-700">Quick verified sign up</p>
              <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
            </div>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or use email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{isDonor ? 'Name' : 'NGO / User Name'}</label>
                <input name="name" value={formData.name} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">{isDonor ? 'Hostel / Restaurant / Organization' : 'Organization Type'}</label>
                {isDonor ? (
                  <input name="organizationName" value={formData.organizationName} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
                ) : (
                  <select name="organizationType" value={formData.organizationType} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500">
                    <option value="NGO">NGO</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Charity">Charity</option>
                    <option value="Individual">Poor / Needy Individual</option>
                    <option value="Food Rescue Team">Food Rescue Team</option>
                  </select>
                )}
              </div>
              {isDonor && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Donor Type</label>
                  <select name="organizationType" value={formData.organizationType} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500">
                    <option value="Hostel">Hostel</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="PG Owner">PG Owner</option>
                    <option value="Marriage Hall">Marriage Hall</option>
                    <option value="Individual">Individual</option>
                    <option value="Cafeteria">Cafeteria</option>
                    <option value="Mess Owner">Mess Owner</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
                <input name="email" type="email" value={formData.email} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                <input name="password" type="password" minLength="8" value={formData.password} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Confirm Password</label>
                <input name="confirmPassword" type="password" minLength="8" value={formData.confirmPassword} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><MapPin className="h-4 w-4" /> Address</label>
                <textarea name="address" value={formData.address} onChange={onChange} required rows="2" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Google Maps Location</label>
                <input name="mapLocation" value={formData.mapLocation} onChange={onChange} placeholder="Paste map address or coordinates" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
              {isDonor ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Food Type Preference</label>
                    <select name="foodTypePreference" value={formData.foodTypePreference} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500">
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Upload className="h-4 w-4" /> Verification Documents</label>
                    <input name="verificationDocument" value={formData.verificationDocument} onChange={onChange} placeholder="Optional document URL" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Upload className="h-4 w-4" /> NGO Certificate</label>
                    <input name="ngoCertificate" value={formData.ngoCertificate} onChange={onChange} placeholder="Optional certificate URL" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Volunteer Count</label>
                    <input name="volunteerCount" type="number" value={formData.volunteerCount} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Building2 className="h-4 w-4" /> Profile Photo</label>
                <input name="profilePicture" value={formData.profilePicture} onChange={onChange} placeholder="Optional image URL" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500" />
              </div>
            </div>
            <button type="submit" className={`mt-6 w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg ${isDonor ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700'}`}>
              Create {isDonor ? 'Donor' : 'Receiver'} Account
            </button>
            {verification && (
              <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-sm font-bold text-slate-800">Verify your account</p>
                <p className="mt-1 text-sm text-slate-600">
                  OTPs were sent to {formData.email} and {formData.phoneNumber}.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white p-3">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email OTP {emailVerified ? '(verified)' : ''}
                    </label>
                    <input
                      value={emailOtp}
                      onChange={(event) => setEmailOtp(event.target.value)}
                      disabled={emailVerified}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500 disabled:text-slate-400"
                    />
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={handleVerifyEmailOtp} disabled={emailVerified} className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                        Verify
                      </button>
                      <button type="button" onClick={handleResendEmailOtp} disabled={emailVerified} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:text-slate-400">
                        Resend
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white bg-white p-3">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Phone OTP {phoneVerified ? '(verified)' : ''}
                    </label>
                    <input
                      value={phoneOtp}
                      onChange={(event) => setPhoneOtp(event.target.value)}
                      disabled={phoneVerified}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-primary-500 disabled:text-slate-400"
                    />
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={handleVerifyPhoneOtp} disabled={phoneVerified} className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300">
                        Verify
                      </button>
                      <button type="button" onClick={handleResendPhoneOtp} disabled={phoneVerified} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:text-slate-400">
                        Resend
                      </button>
                    </div>
                  </div>
                </div>
                {emailVerified && phoneVerified && (
                  <button type="button" onClick={() => navigate('/login')} className="mt-4 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800">
                    Continue to login
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <GoogleMapEmbed address={mapAddress} title={`${isDonor ? 'Donor' : 'Receiver'} location`} heightClass="h-full min-h-96" />
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
