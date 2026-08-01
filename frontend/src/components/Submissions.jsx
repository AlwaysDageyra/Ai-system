import React, { useState, useEffect } from 'react';
const Submissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSubmissions()
      .then(response => {
        // IMPORTANT: Check your backend's JSON response!
        // If it returns { "submissions": [...] }, use response.data.submissions
        // If it returns just [...], use response.data
        setSubmissions(response.data.submissions || response.data);
      })
      .catch(error => {
        console.error("Error fetching submissions:", error);
        setError("Could not load submissions. Please check the backend connection.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty array ensures this runs only once

  if (loading) {
    return <p className="text-center text-gray-500">Loading submissions...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Submissions</h2>

      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tender ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Days</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">{submission.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{submission.tender_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{submission.supplier_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">${submission.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">{submission.delivery_days}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">Evaluate</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-10 text-gray-500">
                No submissions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Submissions;
