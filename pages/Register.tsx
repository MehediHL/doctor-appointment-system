import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { db } from '../services/db';
import { Role } from '../types';
import { Hospital } from '../types';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role.PATIENT | Role.DOCTOR>(Role.PATIENT);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    hospitalId: '', // For doctors
    specialization: '', // For doctors
    experience: 0, // For doctors
    photo: '', // For doctors
    bmdcNumber: '' // For doctors
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Load hospitals asynchronously
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const hospitalsData = await db.getHospitals();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };
    loadHospitals();
  }, []);

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleEmailVerification = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    // Check if email exists
    try {
      const existingUser = await db.findUserByEmail(formData.email);
      if (existingUser) {
      setErrorMessage("Email already registered");
      return;
      }
    } catch (error) {
      // Continue if check fails
    }

    setSendingCode(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowVerification(true);
        setErrorMessage('');
        alert(`Verification code sent to ${formData.email}. Please check your email.`);
      } else {
        setErrorMessage(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Network error. Please make sure the backend server is running on port 5000.');
      console.error('Error sending verification code:', error);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit code");
      return;
    }

    setVerifyingCode(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailVerified(true);
        setShowVerification(false);
        setErrorMessage('');
        alert("Email verified successfully!");
      } else {
        setErrorMessage(data.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      console.error('Error verifying code:', error);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Check if email is verified
    if (!emailVerified) {
      alert("Please verify your email address first");
      return;
    }
    
    try {
    // Check if email exists
      const existingUser = await db.findUserByEmail(formData.email);
      if (existingUser) {
      alert("Email already registered");
      return;
    }

    if (role === Role.DOCTOR) {
      if(!formData.hospitalId) {
        alert("Please select a hospital");
        return;
      }
        if(!formData.bmdcNumber.trim()) {
          alert("Please enter your BM&DC number");
          return;
        }
        await db.addPendingDoctor({
        id: `d_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: Role.DOCTOR,
        hospitalId: formData.hospitalId,
        specialization: formData.specialization,
        experience: Number(formData.experience),
          photo: formData.photo,
          bmdcNumber: formData.bmdcNumber,
          status: 'pending'
      });
        alert("Registration submitted. An admin will review and approve your doctor account.");
    } else {
        await db.addUser({
        id: `u_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: Role.PATIENT
      });
    }

    navigate('/login');
    } catch (error: any) {
      alert(error.message || "Registration failed. Please try again.");
    }
  };

  const handlePhotoUpload = (file?: File) => {
    if (!file) {
      setFormData(prev => ({ ...prev, photo: '' }));
      setPhotoPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() || '';
      setFormData(prev => ({ ...prev, photo: base64 }));
      setPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Create Account</h2>
        
        {/* Role Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${role === Role.PATIENT ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole(Role.PATIENT)}
          >
            Patient
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${role === Role.DOCTOR ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setRole(Role.DOCTOR)}
          >
            Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input required type="tel" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="flex gap-2">
              <input 
                required 
                type="email" 
                className="flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500 disabled:bg-slate-100" 
                value={formData.email} 
                onChange={e => {
                  setFormData({...formData, email: e.target.value});
                  setEmailVerified(false);
                  setShowVerification(false);
                  setErrorMessage('');
                }}
                disabled={emailVerified}
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={handleEmailVerification}
                  disabled={sendingCode}
                  className={`px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {sendingCode ? 'Sending...' : 'Verify Email'}
                </button>
              )}
              {emailVerified && (
                <div className="px-4 py-3 bg-green-100 text-green-700 rounded-lg flex items-center font-medium text-sm whitespace-nowrap">
                  ✓ Verified
                </div>
              )}
            </div>
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
            {showVerification && !emailVerified && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-1">Enter Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="6-digit code"
                    maxLength={6}
                    className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:border-teal-500"
                    value={verificationCode}
                    onChange={e => {
                      setVerificationCode(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    disabled={verifyingCode}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode || verificationCode.length !== 6}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyingCode ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Check your email for the verification code (expires in 10 minutes)</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                className="w-full p-3 pr-10 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                required 
                type={showConfirmPassword ? "text" : "password"} 
                className="w-full p-3 pr-10 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          {role === Role.DOCTOR && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Doctor Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Hospital</label>
                <select 
                  required 
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500 bg-white"
                  value={formData.hospitalId}
                  onChange={e => setFormData({...formData, hospitalId: e.target.value})}
                >
                  <option value="">-- Choose Hospital --</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                   <input required type="text" placeholder="e.g. Cardiology" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                    value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Years Experience</label>
                   <input required type="number" min="0" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                    value={formData.experience} onChange={e => setFormData({...formData, experience: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">BM&DC Number</label>
                <input 
                  required
                  type="text"
                  placeholder="Enter your BM&DC number"
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500" 
                  value={formData.bmdcNumber} 
                  onChange={e => setFormData({...formData, bmdcNumber: e.target.value})} 
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2">
                <label className="block text-sm font-medium text-slate-700">
                  Profile Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="mt-1"
                    onChange={e => handlePhotoUpload(e.target.files?.[0])}
                  />
                </label>
                {photoPreview && (
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2">
                    <img src={photoPreview} alt="Doctor preview" className="w-16 h-16 rounded-full object-cover" />
                    <p className="text-xs text-slate-500">Preview</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!emailVerified}
            className={`w-full py-4 rounded-lg font-bold text-lg transition shadow-lg mt-6 ${
              emailVerified 
                ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Register as {role === Role.DOCTOR ? 'Doctor' : 'Patient'}
          </button>
        </form>
      </div>
    </div>
  );
}