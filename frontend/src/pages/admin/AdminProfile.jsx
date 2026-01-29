import React, { useEffect, useState } from "react";
import {
  UserCircle,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Mail,
  Building,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import toast from "react-hot-toast";
import { getMyProfile, getMyActivity, changeMyPassword } from "../../services/profile.service.js";

function formatDateTime(dt) {
  if (!dt) return "—";
  const date = new Date(dt);
  return date.toLocaleString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function durationFrom(start) {
  if (!start) return "";
  const s = new Date(start).getTime();
  const now = Date.now();
  let diff = Math.floor((now - s) / 1000);
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const years = Math.floor(days / 365);
  const remDays = days - years * 365;
  const parts = [];
  if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (remDays) parts.push(`${remDays} day${remDays > 1 ? "s" : ""}`);
  return `(${parts.join(" ") || "now"})`;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwLoading, setPwLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [p, a] = await Promise.all([
          getMyProfile(),
          getMyActivity(),
        ]);
        setProfile(p.data);
        setActivity(a.data);
      } catch (e) {
        console.error("Profile load failed", e);
        toast.error(e.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword)
      return toast.error("Fill all fields");
    if (form.newPassword !== form.confirmPassword)
      return toast.error("Passwords do not match");
    try {
      setPwLoading(true);
      await changeMyPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="text-slate-600 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-600 px-4 sm:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
                <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="text-white text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{profile?.fullName || "Administrator"}</h1>
                <p className="text-white/80 text-base sm:text-lg">{profile?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                    <Shield className="w-4 h-4 mr-2" />
                    {profile?.role}
                  </span>
                  {profile?.department && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                      <Building className="w-4 h-4 mr-2" />
                      {profile.department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Profile Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <UserCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Profile Information
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mt-1">
                    <UserCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 mb-1">Full Name</p>
                    <p className="text-slate-900 font-semibold truncate">{profile?.fullName || "—"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mt-1">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 mb-1">Email Address</p>
                    <p className="text-slate-900 font-semibold truncate">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mt-1">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 mb-1">Role</p>
                    <p className="text-slate-900 font-semibold capitalize">{profile?.role}</p>
                  </div>
                </div>
                
                {profile?.department && (
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mt-1">
                      <Building className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-500 mb-1">Department</p>
                      <p className="text-slate-900 font-semibold">{profile.department}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                  Account Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">First Access</p>
                      <p className="text-sm text-slate-600">
                        {formatDateTime(activity?.firstAccess)}{" "}
                        <span className="text-slate-400">{durationFrom(activity?.firstAccess)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Last Access</p>
                      <p className="text-sm text-slate-600">
                        {formatDateTime(activity?.lastAccess)}{" "}
                        <span className="text-slate-400">{activity?.lastAccess ? "(current session)" : ""}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <KeyRound className="w-5 h-5 mr-2 text-red-600" />
                Security Settings
              </h2>
              <p className="text-sm text-slate-600 mt-1">Update your password to keep your account secure</p>
            </div>
            <div className="p-6">
              <form onSubmit={submitPassword} className="space-y-5">
                {[
                  { field: "currentPassword", label: "Current Password", key: "current" },
                  { field: "newPassword", label: "New Password", key: "new", placeholder: "At least 6 characters" },
                  { field: "confirmPassword", label: "Confirm New Password", key: "confirm" }
                ].map(({ field, label, key, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {label}
                    </label>
                    <div className="relative">
                      <Input
                        name={field}
                        type={showPw[key] ? "text" : "password"}
                        value={form[field]}
                        onChange={onChange}
                        placeholder={placeholder || "••••••••"}
                        className="pr-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPw((s) => ({ ...s, [key]: !s[key] }))
                        }
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPw[key] ? "Hide password" : "Show password"}
                      >
                        {showPw[key] ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button
                    disabled={pwLoading}
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
                  >
                    {pwLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}