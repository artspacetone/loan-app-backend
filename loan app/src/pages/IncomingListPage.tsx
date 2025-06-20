// pages/IncomingListPage.tsx (Versi Perbaikan dengan Tombol Kondisional)

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import PageTitle from '../components/PageTitle';
import Input from '../components/Input';
import Button from '../components/Button';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction, TransactionStatus } from '../types';
import { AppRoutes } from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const IncomingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { transactions, isLoading, fetchTransactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBorrowings = useMemo(() => {
    // Filter transaksi yang statusnya PENDING_APPROVAL atau NVL (sudah disetujui)
    return transactions
      .filter(t => t.status === TransactionStatus.PENDING_APPROVAL || t.status === TransactionStatus.NVL)
      .filter(t => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          t.transactionNumber.toLowerCase().includes(lowerSearchTerm) ||
          (t.additionalNumber && t.additionalNumber.toLowerCase().includes(lowerSearchTerm)) ||
          t.borrowerSnapshot.name.toLowerCase().includes(lowerSearchTerm) ||
          t.programName.toLowerCase().includes(lowerSearchTerm) ||
          t.item.description.toLowerCase().includes(lowerSearchTerm)
        );
      })
      .sort((a,b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  }, [transactions, searchTerm]);

  if (isLoading && transactions.length === 0) {
    return (
      <>
        <PageTitle title="Active Transactions" subtitle="Approve new requests or process returns." />
        <LoadingSpinner message="Loading active borrowings..." />
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageTitle title="Active Transactions" subtitle="Approve new requests or process returns." />
      
      <div className="mb-6">
        <Input 
          placeholder="Search by Transaction No, Asset No, Borrower, Program, Item..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeBorrowings.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
            <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No transactions match your search." : "There are currently no items pending approval or return."}
            </p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeBorrowings.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>{tx.transactionNumber}</div>
                    {tx.additionalNumber && <div className="text-xs text-gray-500 font-normal">Asset: {tx.additionalNumber}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {tx.item.description} (Qty: {tx.item.quantity})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.borrowerSnapshot.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tx.deadlineDate).toLocaleDateString()}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <StatusBadge transaction={tx} />
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* --- BLOK KONDISIONAL BARU UNTUK TOMBOL --- */}
                    {tx.status === TransactionStatus.PENDING_APPROVAL ? (
                        <Link to={`${AppRoutes.APPROVAL}/${tx.id}?type=outgoing`}>
                            <Button variant="success" size="sm">
                                Go to Approval
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => navigate(`${AppRoutes.INCOMING_FORM}/${tx.id}`)}
                        >
                          Process Return
                        </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncomingListPage;
