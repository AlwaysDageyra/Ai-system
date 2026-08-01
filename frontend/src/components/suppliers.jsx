import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../api'; // 👈 Import our new API function

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSuppliers()
      .then(response => {
        // IMPORTANT: Check your backend's JSON response!
        // If your API returns { "suppliers": [...] }, use response.data.suppliers
        // If your API returns just [...], use response.data
        setSuppliers(response.data.suppliers || response.data);
      })
      .catch(error => {
        console.error("Error fetching suppliers:", error);
        setError("Could not load suppliers. Please check the backend connection.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); 

  if (loading) {
    return <p className="text-center text-gray-500">Loading suppliers...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Suppliers</h2>
      
      {/* We can add a "Create New" button here later */}

      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience (Years)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Past Projects</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.years_experience}</td>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.past_projects}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">Details</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-10 text-gray-500">
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;
