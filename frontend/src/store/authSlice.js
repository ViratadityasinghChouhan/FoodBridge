import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

const normalizeRole = (role) => {
  if (['donor', 'Donor', 'Individual'].includes(role)) return 'donor';
  if (['receiver', 'NGO'].includes(role)) return 'receiver';
  if (['admin', 'Admin'].includes(role)) return 'admin';
  return role;
};

const storedUser = JSON.parse(localStorage.getItem('user'));
const user = storedUser ? { ...storedUser, role: normalizeRole(storedUser.role) } : null;

const initialState = {
  user: user ? user : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const register = createAsyncThunk('auth/register', async (user, thunkAPI) => {
  try {
    const response = await api.post('/auth/register', user);
    if (response.data?.token) {
      localStorage.setItem('user', JSON.stringify({ ...response.data, role: normalizeRole(response.data.role) }));
    }
    return response.data?.token ? { ...response.data, role: normalizeRole(response.data.role) } : response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
  try {
    const response = await api.post('/auth/login', user);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify({ ...response.data, role: normalizeRole(response.data.role) }));
    }
    return { ...response.data, role: normalizeRole(response.data.role) };
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async ({ credential, role }, thunkAPI) => {
  try {
    const response = await api.post('/auth/google', { credential, role });
    if (response.data) {
      localStorage.setItem('user', JSON.stringify({ ...response.data, role: normalizeRole(response.data.role) }));
    }
    return { ...response.data, role: normalizeRole(response.data.role) };
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const resendVerification = createAsyncThunk('auth/resendVerification', async (email, thunkAPI) => {
  try {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const verifyEmailOtp = createAsyncThunk('auth/verifyEmailOtp', async ({ email, otp }, thunkAPI) => {
  try {
    const response = await api.post('/auth/verify-email-otp', { email, otp });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const sendPhoneOtp = createAsyncThunk('auth/sendPhoneOtp', async ({ email, phoneNumber }, thunkAPI) => {
  try {
    const response = await api.post('/auth/send-phone-otp', { email, phoneNumber });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const verifyPhoneOtp = createAsyncThunk('auth/verifyPhoneOtp', async ({ email, phoneNumber, otp }, thunkAPI) => {
  try {
    const response = await api.post('/auth/verify-phone-otp', { email, phoneNumber, otp });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    logout: (state) => {
      localStorage.removeItem('user');
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload?.message || '';
        state.user = action.payload?.token ? action.payload : null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(resendVerification.fulfilled, (state, action) => {
        state.message = action.payload?.message || 'Verification email sent again.';
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.message = action.payload?.message || 'Email verified successfully.';
      })
      .addCase(sendPhoneOtp.fulfilled, (state, action) => {
        state.message = action.payload?.message || 'Phone verification OTP sent.';
      })
      .addCase(verifyPhoneOtp.fulfilled, (state, action) => {
        state.message = action.payload?.message || 'Phone number verified successfully.';
      });
  },
});

export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;
