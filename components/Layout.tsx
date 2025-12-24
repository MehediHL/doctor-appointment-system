import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, User, Menu, X, Heart, Building2, UserPlus, Shield } from 'lucide-react';
import { Role } from '../types';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case Role.ADMIN: return '/admin-dashboard';
      case Role.DOCTOR: return '/doctor-dashboard';
      case Role.PATIENT: return '/patient-dashboard';
      default: return '/';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="bg-teal-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Stethoscope className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl tracking-tight">MediConnect</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:text-teal-200 transition">Home</Link>
              <Link to="/hospitals" className="hover:text-teal-200 transition">Hospitals</Link>
              {user && (
                 <Link to={getDashboardLink()} className="hover:text-teal-200 transition font-medium">
                   Dashboard
                 </Link>
              )}
              
              {user ? (
                <div className="flex items-center space-x-4 ml-4">
                  <div className="flex items-center space-x-2 bg-teal-700 px-3 py-1 rounded-full text-sm">
                    <User size={16} />
                    <span>{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-teal-700 rounded-full transition"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-4">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium hover:bg-teal-700 rounded-md transition"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 bg-white text-teal-600 rounded-md text-sm font-bold shadow hover:bg-teal-50 transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-teal-700 px-4 pt-2 pb-4 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-teal-600">Home</Link>
            <Link to="/hospitals" className="block px-3 py-2 rounded-md hover:bg-teal-600">Hospitals</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="block px-3 py-2 rounded-md hover:bg-teal-600">Dashboard</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md hover:bg-teal-600 flex items-center">
                  <LogOut size={16} className="mr-2" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-teal-600">Login</Link>
                <Link to="/register" className="block px-3 py-2 rounded-md bg-white text-teal-700 font-bold">Register</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center text-white mb-4">
              <Stethoscope className="h-6 w-6 mr-2" />
              <span className="font-bold text-lg">MediConnect</span>
            </div>
            <p className="text-sm text-slate-400">
              Connecting you with the best healthcare professionals for a healthier tomorrow.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/hospitals" className="hover:text-white">Hospitals</Link></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>123 Medical Drive, Health City</li>
              <li>support@mediconnect.com</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white"><Building2 size={20} /></a>
              <a href="#" className="hover:text-white"><Heart size={20} /></a>
              <a href="#" className="hover:text-white"><Shield size={20} /></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-sm">
          &copy; {new Date().getFullYear()} MediConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}