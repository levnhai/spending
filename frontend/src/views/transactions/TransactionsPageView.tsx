'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { TransactionListWidget } from '@/widgets/transaction-list/TransactionListWidget';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { transactionApi, Transaction } from '@/entities/transaction/transactionApi';

export const TransactionsPageView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      const data = await transactionApi.getAll();
      setTransactions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Lịch Sử & Quản Lý Giao Dịch" onOpenQuickAdd={() => setIsModalOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <TransactionListWidget transactions={transactions} onRefresh={fetchTransactions} />
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
};
