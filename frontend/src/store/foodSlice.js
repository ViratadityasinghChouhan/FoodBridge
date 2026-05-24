import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  foods: [],
  myFoods: [],
  requests: [],
  myRequests: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const fetchFoods = createAsyncThunk('food/fetchFoods', async (params = {}, thunkAPI) => {
  try {
    const response = await api.get('/food', { params });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchMyFoods = createAsyncThunk('food/fetchMyFoods', async (_, thunkAPI) => {
  try {
    const response = await api.get('/food/me');
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const createFood = createAsyncThunk('food/createFood', async (foodData, thunkAPI) => {
  try {
    const response = await api.post('/food', foodData);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateFood = createAsyncThunk('food/updateFood', async ({ foodId, foodData }, thunkAPI) => {
  try {
    const response = await api.put(`/food/${foodId}`, foodData);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const deleteFood = createAsyncThunk('food/deleteFood', async (foodId, thunkAPI) => {
  try {
    const response = await api.delete(`/food/${foodId}`);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const requestPickup = createAsyncThunk('food/requestPickup', async (foodId, thunkAPI) => {
  try {
    const response = await api.post(`/requests/${foodId}`, {});
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchDonorRequests = createAsyncThunk('food/fetchDonorRequests', async (_, thunkAPI) => {
  try {
    const response = await api.get('/requests/donor');
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchMyRequests = createAsyncThunk('food/fetchMyRequests', async (_, thunkAPI) => {
  try {
    const response = await api.get('/requests/me');
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateRequestStatus = createAsyncThunk('food/updateRequestStatus', async ({ requestId, status }, thunkAPI) => {
  try {
    const response = await api.put(`/requests/${requestId}`, { status });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const confirmPickup = createAsyncThunk('food/confirmPickup', async ({ requestId, otp }, thunkAPI) => {
  try {
    const response = await api.put(`/requests/${requestId}/confirm-pickup`, { otp });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const updatePickupRequest = createAsyncThunk('food/updatePickupRequest', async ({ requestId, message }, thunkAPI) => {
  try {
    const response = await api.patch(`/requests/${requestId}`, { message });
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const deletePickupRequest = createAsyncThunk('food/deletePickupRequest', async (requestId, thunkAPI) => {
  try {
    const response = await api.delete(`/requests/${requestId}`);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoods.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchFoods.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.foods = action.payload;
      })
      .addCase(fetchFoods.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchMyFoods.fulfilled, (state, action) => {
        state.myFoods = action.payload;
      })
      .addCase(createFood.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(createFood.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myFoods.push(action.payload);
      })
      .addCase(createFood.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateFood.fulfilled, (state, action) => {
        state.myFoods = state.myFoods.map((food) =>
          food._id === action.payload._id ? action.payload : food
        );
      })
      .addCase(deleteFood.fulfilled, (state, action) => {
        state.myFoods = state.myFoods.filter((food) => food._id !== action.payload.id);
      })
      .addCase(requestPickup.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(requestPickup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = '';
        state.myRequests = [action.payload, ...state.myRequests.filter((request) => request._id !== action.payload._id)];
      })
      .addCase(requestPickup.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchDonorRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.myRequests = action.payload;
      })
      .addCase(updateRequestStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.requests = state.requests.map((request) =>
          request._id === action.payload._id ? { ...request, ...action.payload } : request
        );
        state.myRequests = state.myRequests.map((request) =>
          request._id === action.payload._id ? { ...request, ...action.payload } : request
        );
        const updatedFood = action.payload.food;
        if (updatedFood?._id) {
          state.myFoods = state.myFoods.map((food) =>
            food._id === updatedFood._id ? { ...food, status: updatedFood.status } : food
          );
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(confirmPickup.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(confirmPickup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myRequests = state.myRequests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        );
      })
      .addCase(confirmPickup.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updatePickupRequest.fulfilled, (state, action) => {
        state.myRequests = state.myRequests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        );
      })
      .addCase(deletePickupRequest.fulfilled, (state, action) => {
        state.myRequests = state.myRequests.filter((request) => request._id !== action.payload.id);
        state.requests = state.requests.filter((request) => request._id !== action.payload.id);
      });
  },
});

export const { reset } = foodSlice.actions;
export default foodSlice.reducer;
