import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-2xl">
          <Heart className="w-8 h-8 fill-current" />
          <span>FoodBridge</span>
        </Link>
        <div className="flex items-center gap-6 font-medium">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          {user?.role === 'receiver' && <Link to="/browse" className="hover:text-primary-600 transition-colors">Browse Food</Link>}
          {user?.role === 'donor' && <Link to="/create-listing" className="hover:text-primary-600 transition-colors">Add Food</Link>}
          {user && <Link to="/dashboard" className="hover:text-primary-600 transition-colors">Dashboard</Link>}
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-slate-500">Hi, {user.name}</span>
              <button onClick={handleLogout} className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-primary-600 transition-colors">Login</Link>
              <Link to="/register/donor" className="hover:text-primary-600 transition-colors">Donate</Link>
              <Link to="/register/receiver" className="px-5 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30">
                Find Food
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
