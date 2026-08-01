import React, { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Inbox,
  CheckCircle
} from "lucide-react";

import {
  getTenders,
  getSuppliers,
  getAllSubmissions,
  getEvaluations
} from "../api";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const StatCard = ({ title, value, icon: Icon, color, isLoading }) => (
  <div className="relative overflow-hidden p-5 rounded-2xl bg-white/70 backdrop-blur border shadow-sm hover:shadow-lg transition-all">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>

        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
        ) : (
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
        )}
      </div>

      <div className={`p-3 rounded-xl ${color} shadow-md`}>
        <Icon className="text-white" size={20} />
      </div>
    </div>

    {/* subtle glow */}
    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-40"></div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    tenders: 0,
    submissions: 0,
    suppliers: 0,
    evaluations: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTenders(),
      getSuppliers(),
      getAllSubmissions(),
      getEvaluations()
    ])
      .then(([tendersRes, suppliersRes, submissionsRes, evaluationsRes]) => {
        setStats({
          tenders: tendersRes.data.tenders.length,
          suppliers: suppliersRes.data.suppliers.length,
          submissions: submissionsRes.data.submissions.length,
          evaluations: evaluationsRes.data.evaluations.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fake chart data (replace later with real backend analytics)
  const barData = [
    { name: "Jan", submissions: 4 },
    { name: "Feb", submissions: 7 },
    { name: "Mar", submissions: 5 },
    { name: "Apr", submissions: 9 },
    { name: "May", submissions: 6 },
  ];

  const lineData = [
    { name: "Week 1", suppliers: 2 },
    { name: "Week 2", suppliers: 5 },
    { name: "Week 3", suppliers: 3 },
    { name: "Week 4", suppliers: 8 },
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">
          Procurement Dashboard
        </h1>

        <div className="text-sm text-gray-500">
          Welcome back 👋
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tenders" value={stats.tenders} icon={FileText} color="bg-indigo-500" isLoading={loading} />
        <StatCard title="Suppliers" value={stats.suppliers} icon={Users} color="bg-green-500" isLoading={loading} />
        <StatCard title="Submissions" value={stats.submissions} icon={Inbox} color="bg-yellow-500" isLoading={loading} />
        <StatCard title="Evaluations" value={stats.evaluations} icon={CheckCircle} color="bg-blue-500" isLoading={loading} />
      </div>

      {/* CHARTS */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* BAR CHART */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold text-gray-700 mb-4">
            Submissions Overview
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>


        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-center items-center">
          <h3 className="text-lg mb-2">Evaluation Progress</h3>

          <div className="text-5xl font-bold">
            {loading ? "..." : `${Math.min(100, stats.evaluations * 20)}%`}
          </div>

          <p className="text-sm mt-2 opacity-80">
            Auto-calculated progress
          </p>
        </div>
      </div>


      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
        <h3 className="font-semibold text-gray-700 mb-4">
          Supplier Growth Trend
        </h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="suppliers"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Dashboard;