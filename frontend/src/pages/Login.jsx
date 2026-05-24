import { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { googleLogin, login, reset, resendVerification, sendPhoneOtp, verifyEmailOtp, verifyPhoneOtp } from '../store/authSlice';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  const { email, password } = formData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      alert(message);
    }
    if (isSuccess || user) {
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
    const userData = { email, password };
    dispatch(login(userData));
  };

  const handleGoogleCredential = useCallback((credential) => {
    dispatch(googleLogin({ credential, role: 'receiver' }));
  }, [dispatch]);

  const handleResendVerification = () => {
    if (!email) {
      alert('Enter your email address first.');
      return;
    }
    dispatch(resendVerification(email))
      .unwrap()
      .then((response) => alert(response.message || 'Verification email sent again.'))
      .catch((error) => alert(error));
  };

  const handleVerifyEmailOtp = () => {
    if (!email || !emailOtp) {
      alert('Enter your email and email OTP first.');
      return;
    }
    dispatch(verifyEmailOtp({ email, otp: emailOtp }))
      .unwrap()
      .then((response) => alert(response.message || 'Email verified successfully.'))
      .catch((error) => alert(error));
  };

  const handleSendPhoneOtp = () => {
    if (!email) {
      alert('Enter your email address first.');
      return;
    }
    dispatch(sendPhoneOtp({ email }))
      .unwrap()
      .then((response) => alert(response.phoneOtp ? `${response.message} OTP: ${response.phoneOtp}` : response.message || 'Phone OTP sent.'))
      .catch((error) => alert(error));
  };

  const handleVerifyPhoneOtp = () => {
    if (!email || !phoneOtp) {
      alert('Enter your email and phone OTP first.');
      return;
    }
    dispatch(verifyPhoneOtp({ email, otp: phoneOtp }))
      .unwrap()
      .then((response) => alert(response.message || 'Phone number verified successfully.'))
      .catch((error) => alert(error));
  };

  const verificationStatus = searchParams.get('verified');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            create a new account
          </Link>
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="glass py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200 bg-white">
          {verificationStatus === 'success' && (
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Email verified successfully. You can log in now.
            </div>
          )}
          {verificationStatus === 'failed' && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Verification link is invalid or expired. Enter your email and resend verification.
            </div>
          )}
          <div className="mb-6">
            <GoogleSignInButton onCredential={handleGoogleCredential} />
          </div>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">or email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={onChange}
                  required
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
              >
                Sign in
              </button>
            </div>
            <button type="button" onClick={handleResendVerification} className="w-full text-sm font-bold text-primary-600 hover:underline">
              Resend verification email
            </button>
          </form>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Verify with OTP</p>
            <div className="mt-3 grid gap-3">
              <input
                value={emailOtp}
                onChange={(event) => setEmailOtp(event.target.value)}
                placeholder="Email OTP"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-primary-500"
              />
              <button type="button" onClick={handleVerifyEmailOtp} className="w-full rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 hover:bg-primary-50">
                Verify email OTP
              </button>
              <button type="button" onClick={handleSendPhoneOtp} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                Send phone OTP
              </button>
              <input
                value={phoneOtp}
                onChange={(event) => setPhoneOtp(event.target.value)}
                placeholder="Phone OTP"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-primary-500"
              />
              <button type="button" onClick={handleVerifyPhoneOtp} className="w-full rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 hover:bg-primary-50">
                Verify phone OTP
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
