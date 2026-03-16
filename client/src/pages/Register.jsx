import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "hr",
    client_id: "" // store client id as string from select
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase.from("clients").select("id, name");
      if (error) {
        console.error("Error loading clients:", error);
      } else {
        setClients(data || []);
      }
    };
    loadClients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Insert user with required fields
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name: form.name,
            email: form.email,
            password: "temp123", // temporary password; should be hashed or use auth later
            role: form.role,
            client_id: form.role === "client" && form.client_id ? parseInt(form.client_id) : null
          }
        ]);

      if (error) throw error;

      alert("User created successfully ✅");

      setForm({
        name: "",
        email: "",
        role: "hr",
        client_id: ""
      });
    } catch (err) {
      console.error(err);
      alert("Error creating user: " + err.message);
    } finally {
      setLoading(false);
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              placeholder="e.g. john@example.com"
              className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              onChange={handleChange}
              required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all bg-white"
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create User & Send Email"}
        </button>
      </div>
    </div>
  );
}