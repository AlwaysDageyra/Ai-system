import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionsByTenderId } from '../api'; // 👈 Import our new function

const TenderDetail = () => {
  // Get the tenderId from the URL (e.g., /tenders/5)
  const { tenderId } = useParams(); 
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the submissions for this specific tenderId
    getSubmissionsByTenderId(tenderId)
      .then(response => {
        // Your backend returns { ..., "submissions": [...] }
        setSubmissions(response.data.submissions);
      })
      .catch(error => {
        console.error(`Error fetching submissions for tender ${tenderId}:`, error);
        setError("Could not load submissions for this tender.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tenderId]); // This effect re-runs if the tenderId in the URL changes

  if (loading) {
    return <p className="text-center text-gray-500">Loading submissions...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Submissions for Tender #{tenderId}
      </h2>

      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission ID</th>
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
                <td className="px-6 py-4 whitespace-nowrap">{submission.supplier_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">${submission.price.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{submission.delivery_days}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Later, this link could go to the evaluation page */}
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">Evaluate</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-10 text-gray-500">
                No submissions found for this tender.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TenderDetail;
