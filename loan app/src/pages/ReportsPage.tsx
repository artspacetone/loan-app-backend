import React, { useState, useMemo, useEffect } from 'react';
import PageTitle from '../components/PageTitle';
import { useTransactions } from '../contexts/TransactionContext';
import { Transaction, TransactionStatus, ReturnStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input'; // Import Input component
import Button from '../components/Button'; // Import Button component
import { MagnifyingGlassIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid'; // WhatsApp like icon

enum ReportTab {
  COMPLETE = 'Complete',
  INCOMPLETE = 'Incomplete',
  OVERDUE = 'Overdue', 
  ALL_BORROWED = 'All Borrowed (NVL)'
}

const ReportsPage: React.FC = () => {
  const { transactions, isLoading, fetchTransactions } = useTransactions();
  const [activeTab, setActiveTab] = useState<ReportTab>(ReportTab.ALL_BORROWED);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search term

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOverdue = (deadline: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date only, ignore time
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0,0,0,0);
    return deadlineDate < today;
  }

  const filteredTransactions = useMemo(() => {
    let tabFiltered = transactions;
    switch (activeTab) {
      case ReportTab.COMPLETE:
        tabFiltered = transactions.filter(t => t.status === TransactionStatus.AVL && 
            (t.returnDetails?.reduce((sum, r) => sum + r.returnedQuantity, 0) || 0) >= t.item.quantity);
        break;
      case ReportTab.INCOMPLETE:
        tabFiltered = transactions.filter(t => {
            const totalReturned = t.returnDetails?.filter(rd => rd.status === ReturnStatus.COMPLETE || rd.status === ReturnStatus.INCOMPLETE).reduce((sum, r) => sum + r.returnedQuantity, 0) || 0;
            if (t.status === TransactionStatus.AVL && totalReturned < t.item.quantity) return true;
            if (t.status === TransactionStatus.NVL && totalReturned > 0 && totalReturned < t.item.quantity) return true; 
            return false;
        });
        break;
      case ReportTab.OVERDUE:
        tabFiltered = transactions.filter(t => t.status === TransactionStatus.NVL && isOverdue(t.deadlineDate));
        break;
      case ReportTab.ALL_BORROWED:
        tabFiltered = transactions.filter(t => t.status === TransactionStatus.NVL);
        break;
      default:
        tabFiltered = transactions;
    }

    if (!searchTerm.trim()) {
      return tabFiltered;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return tabFiltered.filter(t => 
        t.transactionNumber.toLowerCase().includes(lowerSearchTerm) ||
        t.item.description.toLowerCase().includes(lowerSearchTerm) ||
        t.borrowerSnapshot.name.toLowerCase().includes(lowerSearchTerm) ||
        t.programName.toLowerCase().includes(lowerSearchTerm) ||
        (t.borrowerSnapshot.nik && t.borrowerSnapshot.nik.toLowerCase().includes(lowerSearchTerm))
    );

  }, [transactions, activeTab, searchTerm]);

  const TabButton: React.FC<{tab: ReportTab}> = ({tab}) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 font-medium text-sm rounded-md transition-colors
            ${activeTab === tab 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-600 hover:bg-primary-light hover:text-white'}`}
    >
        {tab} ({tab === ReportTab.COMPLETE ? transactions.filter(t=>t.status === TransactionStatus.AVL && (t.returnDetails?.reduce((sum, r) => sum + r.returnedQuantity, 0) || 0) >= t.item.quantity).length : 
                  tab === ReportTab.INCOMPLETE ? transactions.filter(t => { const totalReturned = t.returnDetails?.filter(rd => rd.status === ReturnStatus.COMPLETE || rd.status === ReturnStatus.INCOMPLETE).reduce((sum, r) => sum + r.returnedQuantity, 0) || 0; if (t.status === TransactionStatus.AVL && totalReturned < t.item.quantity) return true; if (t.status === TransactionStatus.NVL && totalReturned > 0 && totalReturned < t.item.quantity) return true; return false; }).length :
                  tab === ReportTab.OVERDUE ? transactions.filter(t => t.status === TransactionStatus.NVL && isOverdue(t.deadlineDate)).length :
                  tab === ReportTab.ALL_BORROWED ? transactions.filter(t => t.status === TransactionStatus.NVL).length : 0})
    </button>
  );
  
  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = (transaction: Transaction) => {
    const borrower = transaction.borrowerSnapshot;
    let phoneNumber = borrower.phone;

    // Basic phone number formatting (example for Indonesian numbers)
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    }
    // Remove non-numeric characters, except '+' if it's already international
    phoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('62')) { // If still not international, assume 62
        phoneNumber = '62' + phoneNumber.replace(/^62/, ''); // ensure only one '62'
    }


    const message = `Halo ${borrower.name},

Kami mengingatkan bahwa item berikut yang Anda pinjam dari Inventory Management System sudah melewati batas waktu pengembalian:

No. Transaksi: ${transaction.transactionNumber}
Item: ${transaction.item.description} (Qty: ${transaction.item.quantity})
Tanggal Pinjam: ${new Date(transaction.borrowDate).toLocaleDateString()}
Deadline Pengembalian: ${new Date(transaction.deadlineDate).toLocaleDateString()}

Mohon untuk segera mengembalikan item tersebut. 
Terima kasih atas perhatiannya.

Inventory Management System
`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  if (isLoading && transactions.length === 0) {
    return (
      <>
        <PageTitle title="Transaction Reports" />
        <LoadingSpinner message="Loading reports..." />
      </>
    );
  }

  return (
    <div>
      <PageTitle title="Transaction Reports" subtitle="View details of completed, incomplete, and overdue transactions." />

      <div className="mb-4 flex flex-col sm:flex-row gap-4 print:hidden">
        <Input 
            Icon={MagnifyingGlassIcon}
            type="search"
            placeholder="Search reports by Nomor Transaksi, Item, Borrower, Program, NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-grow"
        />
        <Button onClick={handlePrint} variant="secondary" className="w-full sm:w-auto">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Report
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2 print:hidden">
        <TabButton tab={ReportTab.ALL_BORROWED} />
        <TabButton tab={ReportTab.OVERDUE} />
        <TabButton tab={ReportTab.COMPLETE} />
        <TabButton tab={ReportTab.INCOMPLETE} />
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-lg text-gray-500">
            {searchTerm ? `No transactions found for "${searchTerm}" in "${activeTab}" status.` : `No transactions found for "${activeTab}" status.`}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Transaksi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Pinjam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pinjam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Peminjaman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Kembali Terakhir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty Kembali</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Notify</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map(tx => {
                const approvedReturns = tx.returnDetails?.filter(r => r.status === ReturnStatus.COMPLETE || r.status === ReturnStatus.INCOMPLETE) || [];
                const lastReturn = approvedReturns.length > 0 ? 
                                    [...approvedReturns].sort((a,b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime())[0]
                                    : null;
                const totalReturnedQty = approvedReturns.reduce((sum, r) => sum + r.returnedQuantity, 0);
                const itemOverdue = tx.status === TransactionStatus.NVL && isOverdue(tx.deadlineDate);
                
                return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tx.item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{tx.item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {tx.borrowerSnapshot.name}
                        <span className="block text-xxs text-gray-500">NIK: {tx.borrowerSnapshot.nik}</span>
                        <span className="block text-xxs text-gray-500">HP: {tx.borrowerSnapshot.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tx.borrowDate).toLocaleDateString()}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${itemOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {new Date(tx.deadlineDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === TransactionStatus.AVL ? 'bg-green-100 text-green-800' :
                            itemOverdue ? 'bg-red-100 text-red-800' :
                            tx.status === TransactionStatus.NVL ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                         }`}>
                           {itemOverdue ? 'OVERDUE' : tx.status.replace('_', ' ')}
                         </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {lastReturn ? new Date(lastReturn.returnDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">{totalReturnedQty > 0 ? totalReturnedQty : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm print:hidden">
                        {itemOverdue ? (
                            <Button 
                                size="sm" 
                                variant="success" // Using success color like WhatsApp
                                onClick={() => handleSendWhatsApp(tx)}
                                className="bg-green-500 hover:bg-green-600 text-white"
                                title={`Send WhatsApp to ${tx.borrowerSnapshot.name} (${tx.borrowerSnapshot.phone})`}
                            >
                                <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                                Notify
                            </Button>
                        ) : (
                           <span className="text-gray-400 text-xs">-</span>
                        )}
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
