import React, { useState, useEffect } from 'react';
import { getTenders } from '../api'; 
import { Link } from 'react-router-dom'; // 👈 1. IMPORT THE LINK COMPONENT

const Tenders = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTenders()
      .then(response => {
        setTenders(response.data.tenders); 
      })
      .catch(error => {
        console.error("Error fetching tenders:", error);
        setError("Could not load tenders. Make sure the backend is running and reachable.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading tenders...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (!tenders || tenders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Tenders</h2>
        <p className="text-center text-gray-500">No tenders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Tenders</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tenders.map((tender) => (
            <tr key={tender.id}>
              <td className="px-6 py-4 whitespace-nowrap">{tender.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">{tender.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tender.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tender.status || 'N/A'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {/* 👇 2. THIS IS THE LINE THAT WAS CHANGED */}
                <Link to={`/tenders/${tender.id}`} className="text-indigo-600 hover:text-indigo-900">
                  View Submissions
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tenders;
