import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "hr",
    client: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/register", form);
      alert(res.data.message || "User Created! An email has been sent to set their password. ✅");
      // Reset form
      setForm({ name: "", email: "", role: "hr", client: "" });
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error registering user. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Add New User</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              placeholder="e.g. John Doe"
              className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              placeholder="e.g. john@example.com"
              className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
              onChange={handleChange}
            >
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="client">Client</option>
            </select>
          </div>

          {form.role === "client" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name / Company</label>
              <input
                name="client"
                value={form.client}
                placeholder="e.g. Acme Corp"
                className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleRegister}
          className="w-full mt-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm shadow-teal-500/30"
        >
          Create User & Send Email
        </button>
      </div>
    </div>
  );
}