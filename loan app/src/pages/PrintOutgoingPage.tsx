import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrintLayout from '../components/PrintLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction } from '../types';
import Button from '../components/Button';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { AppRoutes } from '../constants';

const PrintOutgoingPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { getTransactionById, isLoading } = useTransactions();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (transactionId) {
      const fetchedTx = getTransactionById(transactionId);
      setTransaction(fetchedTx || null);
    }
  }, [transactionId, getTransactionById]);

  if (isLoading && !transaction) return <LoadingSpinner message="Loading transaction..." />;
  if (!transaction) return <div className="text-center p-10">Transaction not found.</div>;

  const { borrowerSnapshot: borrower } = transaction;

  return (
    <>
      <div className="max-w-4xl mx-auto my-4 flex justify-between items-center print:hidden">
        <Button variant="secondary" onClick={() => navigate(AppRoutes.DASHBOARD)}><ArrowLeftIcon className="h-5 w-5 mr-2" />Dashboard</Button>
        <Button variant="primary" onClick={() => window.print()}><PrinterIcon className="h-5 w-5 mr-2" />Print Form</Button>
      </div>
      <PrintLayout formType="OUTGOING" formNumber={transaction.transactionNumber}>
        <table className="w-full border-collapse border border-black mb-2 text-xs">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-semibold w-1/4">NUMBER</td><td className="border border-black p-1 w-1/4">{transaction.transactionNumber}</td>
              <td className="border border-black p-1 font-semibold w-1/4">PROGRAM</td><td className="border border-black p-1 w-1/4">{transaction.programName}</td>
            </tr>
            {transaction.additionalNumber && (
                <tr>
                    <td className="border border-black p-1 font-semibold">ASSET NO.</td><td className="border border-black p-1 font-bold">{transaction.additionalNumber}</td>
                    <td className="border border-black p-1 font-semibold">TYPE</td><td className="border border-black p-1">{transaction.transactionType}</td>
                </tr>
            )}
            <tr>
              <td className="border border-black p-1 font-semibold">DATE</td><td className="border border-black p-1">{new Date(transaction.borrowDate).toLocaleDateString('id-ID')}</td>
              <td className="border border-black p-1 font-semibold">DEADLINE</td><td className="border border-black p-1">{new Date(transaction.deadlineDate).toLocaleDateString('id-ID')}</td>
            </tr>
             <tr><td className="border border-black p-1 font-semibold">QTY</td><td className="border border-black p-1" colSpan={3}>{transaction.item.quantity}</td></tr>
          </tbody>
        </table>
        <div className="border border-black mb-2">
          <div className="p-1 bg-gray-200 border-b border-black text-center font-semibold">ITEMS DESCRIPTION</div>
          <div className="p-2 min-h-[150px]">
            {transaction.item.photoUrl && <img src={transaction.item.photoUrl} alt={transaction.item.description} className="max-w-xs max-h-48 mx-auto my-2"/>}
            <p className="text-center">{transaction.item.description}</p>
          </div>
        </div>
        <table className="w-full border-collapse border border-black text-xs">
          <thead><tr className="bg-gray-200"><th className="border border-black p-1" colSpan={4}>APPROVALS</th></tr></thead>
          <tbody>
            <tr>
              <td className="border border-black p-1 h-20 align-top w-1/4">PENGINPUT: <br/>{transaction.adminUsername || 'N/A'}</td>
              <td className="border border-black p-1 h-20 align-top w-1/4">PEMINJAM: {borrower.name}</td>
              <td className="border border-black p-1 h-20 align-top w-1/4">ATASAN: {borrower.supervisorName}</td>
              <td className="border border-black p-1 h-20 align-top w-1/4">INVENTORY:</td>
            </tr>
          </tbody>
        </table>
      </PrintLayout>
    </>
  );
};

export default PrintOutgoingPage;
