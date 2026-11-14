import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateUserProfile,
  clearAuthMessages,
} from '../redux/slices/authSlice';
import api from '../services/api';
import {
  User,
  MapPin,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error, successMessage } = useSelector(
    (state) => state.auth
  );

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addresses, setAddresses] = useState(user?.addresses || []);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleProfileSave = (e) => {
    e.preventDefault();
    dispatch(clearAuthMessages());
    dispatch(updateUserProfile({ name, phone, addresses }));
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const updated = [
      ...addresses,
      { ...newAddress, isDefault: addresses.length === 0 },
    ];
    setAddresses(updated);
    dispatch(updateUserProfile({ name, phone, addresses: updated }));
    setNewAddress({
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
    });
  };

  const handleRemoveAddress = (index) => {
    const updated = addresses.filter((_, idx) => idx !== index);
    setAddresses(updated);
    dispatch(updateUserProfile({ name, phone, addresses: updated }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMessage('');
    setPwdError('');
    try {
      const { data } = await api.put('/auth/password', passwordData);
      setPwdMessage(data.message);
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="py-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="text-sm text-slate-500">
          Manage your profile details, saved delivery addresses, and security settings
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Personal Details */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Personal Information
          </h2>
        </div>

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address (Read-only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Saved Addresses */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Saved Shipping Addresses
          </h2>
        </div>

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr, idx) => (
              <div
                key={addr._id || idx}
                className="p-4 rounded-xl border border-slate-200 flex justify-between items-start gap-3"
              >
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-slate-900">{addr.fullName}</p>
                  <p className="text-slate-600">{addr.street}</p>
                  <p className="text-slate-600">
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p className="text-slate-500 text-xs">Phone: {addr.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(idx)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Remove address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No shipping addresses saved yet.</p>
        )}

        <form onSubmit={handleAddAddress} className="border-t border-slate-200 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add New Address</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Recipient Full Name"
              value={newAddress.fullName}
              onChange={(e) =>
                setNewAddress({ ...newAddress, fullName: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={newAddress.phone}
              onChange={(e) =>
                setNewAddress({ ...newAddress, phone: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              required
              placeholder="House No, Street, Landmark"
              value={newAddress.street}
              onChange={(e) =>
                setNewAddress({ ...newAddress, street: e.target.value })
              }
              className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              required
              placeholder="City"
              value={newAddress.city}
              onChange={(e) =>
                setNewAddress({ ...newAddress, city: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="State"
                value={newAddress.state}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, state: e.target.value })
                }
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="text"
                required
                placeholder="PIN Code"
                value={newAddress.postalCode}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, postalCode: e.target.value })
                }
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Add Address
          </button>
        </form>
      </section>

      {/* 3. Change Password */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Change Password
          </h2>
        </div>

        {pwdError && (
          <p className="mb-3 text-sm text-red-600 font-medium">{pwdError}</p>
        )}
        {pwdMessage && (
          <p className="mb-3 text-sm text-emerald-600 font-medium">
            {pwdMessage}
          </p>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="password"
            required
            placeholder="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value,
              })
            }
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="New Password (min 6 chars)"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
};

export default Profile;
