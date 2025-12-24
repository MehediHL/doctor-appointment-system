import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Hospital, User, Role, Doctor } from '../../types';
import { Trash2, Shield, Plus, Building, Check, X } from 'lucide-react';

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'hospitals' | 'doctors' | 'pending'>('hospitals');

  // Simple Add Hospital State
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospital, setNewHospital] = useState({ name: '', address: '', contact: '', image: '' });
  const [hospitalPreview, setHospitalPreview] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [hospitalsData, usersData, doctorsData, pendingData] = await Promise.all([
        db.getHospitals(),
        db.getUsers(),
        db.getDoctors(),
        db.getPendingDoctors()
      ]);
      setHospitals(hospitalsData);
      setUsers(usersData);
      setDoctors(doctorsData);
      setPendingDoctors(pendingData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if(confirm('Delete this hospital?')) {
      try {
        await db.deleteHospital(id);
        await refreshData();
      } catch (error) {
        alert('Error deleting hospital');
      }
    }
  };

  const handleApproveDoctor = async (id: string) => {
    try {
      const approved = await db.approvePendingDoctor(id);
      if (approved) {
        await refreshData();
        alert(`Doctor ${approved.name} approved and activated.`);
      }
    } catch (error) {
      alert('Error approving doctor');
    }
  };

  const handleDeletePendingDoctor = async (id: string) => {
    if (confirm('Remove this pending doctor request?')) {
      try {
        await db.deletePendingDoctor(id);
        await refreshData();
      } catch (error) {
        alert('Error deleting pending doctor');
      }
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      try {
        await db.deleteDoctor(id);
        await refreshData();
        alert('Doctor deleted successfully');
      } catch (error) {
        alert('Error deleting doctor');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await db.deleteUser(id);
        await refreshData();
        alert('User deleted successfully');
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.addHospital({
      id: `h_${Date.now()}`,
      ...newHospital,
      image: newHospital.image || `https://picsum.photos/800/400?random=${Date.now() % 1000}`
    });
    setShowAddHospital(false);
    setNewHospital({ name: '', address: '', contact: '', image: '' });
    setHospitalPreview(null);
      await refreshData();
    } catch (error) {
      alert('Error adding hospital');
    }
  };

  const handleHospitalImageChange = (file?: File) => {
    if (!file) {
      setNewHospital(prev => ({ ...prev, image: '' }));
      setHospitalPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() || '';
      setNewHospital(prev => ({ ...prev, image: base64 }));
      setHospitalPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <Shield className="mr-3 text-teal-600" /> Admin Portal
        </h1>
        <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          {(['hospitals', 'doctors', 'pending', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'pending' ? 'pending doctors' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'hospitals' && (
        <div>
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-bold">Manage Hospitals</h2>
            <button 
              onClick={() => setShowAddHospital(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700"
            >
              <Plus size={16} className="mr-2" /> Add Hospital
            </button>
          </div>

          {showAddHospital && (
            <div className="bg-slate-100 p-6 rounded-lg mb-8">
              <form onSubmit={handleAddHospital} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input required placeholder="Name" className="p-2 rounded border flex-1" value={newHospital.name} onChange={e => setNewHospital({...newHospital, name: e.target.value})} />
                  <input required placeholder="Address" className="p-2 rounded border flex-1" value={newHospital.address} onChange={e => setNewHospital({...newHospital, address: e.target.value})} />
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <input required placeholder="Contact" className="p-2 rounded border w-full md:w-40" value={newHospital.contact} onChange={e => setNewHospital({...newHospital, contact: e.target.value})} />
                  <label className="flex flex-col text-sm text-slate-600">
                    Hospital Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleHospitalImageChange(e.target.files?.[0])}
                      className="mt-1"
                    />
                  </label>
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded self-stretch md:self-auto">Save</button>
                </div>
                {hospitalPreview && (
                  <div className="flex items-center gap-4 bg-white p-4 rounded border border-dashed border-slate-200">
                    <img src={hospitalPreview} alt="Hospital preview" className="w-24 h-16 object-cover rounded" />
                    <p className="text-sm text-slate-500">Preview of the hospital cover image</p>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="grid gap-4">
            {hospitals.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border border-slate-100">
                <div className="flex items-center">
                   <div className="bg-teal-50 p-3 rounded-lg mr-4">
                      <Building className="text-teal-600" />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800">{h.name}</h3>
                     <p className="text-sm text-slate-500">{h.address}</p>
                   </div>
                </div>
                <button onClick={() => handleDeleteHospital(h.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Hospital</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">BM&DC</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => {
                const hosp = hospitals.find(h => h.id === d.hospitalId);
                return (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium">{d.name}</td>
                    <td className="p-4 text-slate-600">{hosp?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-600">{d.specialization}</td>
                    <td className="p-4 text-slate-600">{d.bmdcNumber || 'N/A'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteDoctor(d.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                        title="Delete Doctor"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">No doctors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Pending Doctor Approvals</h2>
            <span className="text-sm text-slate-500">{pendingDoctors.length} pending</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Hospital</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">Experience</th>
                <th className="p-4">BM&DC</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDoctors.map(d => {
                const hosp = hospitals.find(h => h.id === d.hospitalId);
                return (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium">{d.name}</td>
                    <td className="p-4 text-slate-600">{d.email}</td>
                    <td className="p-4 text-slate-600">{hosp?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-600">{d.specialization}</td>
                    <td className="p-4 text-slate-600">{d.experience} yrs</td>
                    <td className="p-4 text-slate-600">{d.bmdcNumber || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveDoctor(d.id)}
                          className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                        >
                          <Check size={16} className="mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleDeletePendingDoctor(d.id)}
                          className="flex items-center bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200"
                        >
                          <X size={16} className="mr-1" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pendingDoctors.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">No pending doctor registrations.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
           <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : u.role === Role.DOCTOR ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role !== Role.ADMIN && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}