import React from 'react';
import { Link } from 'react-router-dom';
import { Award, FileDown, Eye } from 'lucide-react';

const RankingTable = ({ rankings = [] }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  const RankBadge = ({ rank }) => {
    if (rank === 1) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1a3a3a] text-white font-bold text-xs shadow-sm">1</span>;
    if (rank === 2) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f4f4] text-[#2a7d7b] font-bold text-xs">2</span>;
    if (rank === 3) return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs">3</span>;
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f7f7] text-[#5a8a8b] font-bold text-xs border border-[#d8eaea]">{rank}</span>;
  };

  const scoreStyle = (s) => {
    if (s >= 90) return 'text-[#2a7d7b] bg-[#e8f4f4]';
    if (s >= 70) return 'text-[#2a7d7b] bg-[#e8f4f4]';
    if (s >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#f0f5f5] bg-white shadow-sm">
      <table className="min-w-full divide-y divide-[#f0f5f5] text-left text-sm">
        <thead className="bg-[#f0f7f7]">
          <tr>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8aacac] w-16">Rank</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8aacac]">Supplier</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8aacac] hidden sm:table-cell">Submitted</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8aacac]">Score</th>
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8aacac] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f5f5]">
          {rankings.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-12 text-center text-[#8aacac] text-sm">
                No supplier submissions found for this tender.
              </td>
            </tr>
          ) : rankings.map((row) => (
            <tr key={row.proposal_id} className="hover:bg-[#f8fcfc] transition-colors">
              <td className="whitespace-nowrap px-4 py-3.5">
                <div className="flex items-center justify-center">
                  <RankBadge rank={row.rank} />
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#1a3a3a]">
                <div className="flex items-center gap-2">
                  {row.rank === 1 && <Award className="h-4 w-4 text-amber-500" />}
                  {row.supplier_name}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-[#8aacac] text-sm hidden sm:table-cell">
                {new Date(row.submitted_at).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5">
                <span className={`font-bold text-sm px-2.5 py-1 rounded-lg ${scoreStyle(row.score)}`}>
                  {row.score.toFixed(0)}%
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/proposal/${row.proposal_id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#d8eaea] bg-white px-3 py-1.5 text-xs font-semibold text-[#5a8a8b] hover:bg-[#f0f7f7] hover:text-[#2a7d7b] transition-all"
                  >
                    <Eye size={13} /> View Audit
                  </Link>
                  {row.pdf_path && (
                    <a
                      href={`${API_URL}/${row.pdf_path}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#e8f4f4] px-3 py-1.5 text-xs font-semibold text-[#5a8a8b] hover:bg-[#d8eaea] transition-all"
                    >
                      <FileDown size={13} /> PDF
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingTable;
