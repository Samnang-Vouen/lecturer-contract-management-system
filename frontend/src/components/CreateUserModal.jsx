import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Loader2, CheckCircle2, Copy } from "lucide-react";
import toast from "react-hot-toast";
import Select, { SelectItem } from "./ui/Select.jsx";
import { createUser } from "../services/userService";

export default function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    department: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); // holds response incl. tempPassword

  // Role and department options
  const roleOptions = ["admin", "management"];
  const departmentOptions = ["Computer Science", "Digital Business", "Foundation","Telecommunications and Network"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@cadt\.edu\.kh$/i.test(formData.email)) {
      newErrors.email = "Must use CADT email (example@cadt.edu.kh)";
    }
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.department) newErrors.department = "Department is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ fullName: "", email: "", role: "", department: "" });
    setErrors({});
    setIsSubmitting(false);
    setSuccessData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = await createUser(formData);
      // Keep modal open; switch to success view
      setSuccessData(data); // contains tempPassword
      onUserCreated(data);
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
      
      // Handle specific validation errors from server
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopy = () => {
    if (!successData?.tempPassword) return;

    navigator.clipboard.writeText(successData.tempPassword).then(() => {
      toast.dismiss(); // remove any existing "Copied" toasts
      toast.success('Copied');
    });
  };



  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative shadow-xl pointer-events-auto">
          <button onClick={handleClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>

          {successData ? (
            <div>
              <div className="flex items-start space-x-3 mb-4">
                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
                <div>
                  <h2 className="text-xl font-semibold">User Created Successfully</h2>
                  <p className="text-gray-600 text-sm mt-1">A temporary password has been generated for the new user. Please share this securely.</p>
                </div>
              </div>

              <div className="border rounded-md p-4 mb-4">
                <p className="text-sm font-medium mb-2">Temporary Password</p>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-2 bg-gray-100 rounded font-mono text-sm select-all" aria-label="Temporary password value">
                    {successData.tempPassword}
                  </div>
                  <button type="button" onClick={handleCopy} className="p-2 rounded bg-white border hover:bg-gray-50" aria-label="Copy temporary password">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <ul className="text-xs text-gray-600 mt-4 list-disc pl-5 space-y-1">
                  <li>The user should change this password on first login</li>
                  <li>This password will not be shown again</li>
                  <li>Share it through a secure channel</li>
                </ul>
              </div>

              <button onClick={handleClose} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">Close</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-1">Create New User</h2>
              <p className="text-gray-600 text-sm mb-4">Add a new user to the system. A temporary password will be generated.</p>
              {/* existing form unchanged except submit handling */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    maxLength={80}
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400 ${
                      errors.fullName ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                  )}
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
                
                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <Select
                    id="role"
                    value={formData.role}
                    onValueChange={(val) => {
                      setFormData((prev) => ({ ...prev, role: val }));
                      if (errors.role) setErrors((prev) => ({ ...prev, role: null }));
                    }}
                    placeholder="Select role"
                    className="w-full"
                    buttonClassName={`h-10 px-3 pr-8 text-sm border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                      errors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </Select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-red-600">{errors.role}</p>
                  )}
                </div>
                
                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <Select
                    id="department"
                    value={formData.department}
                    onValueChange={(val) => {
                      setFormData((prev) => ({ ...prev, department: val }));
                      if (errors.department) setErrors((prev) => ({ ...prev, department: null }));
                    }}
                    placeholder="Select department"
                    className="w-full"
                    buttonClassName={`h-10 px-3 pr-8 text-sm border rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                      errors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </Select>
                  {errors.department && (
                    <p className="mt-1 text-xs text-red-600">{errors.department}</p>
                  )}
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      "Create User"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
