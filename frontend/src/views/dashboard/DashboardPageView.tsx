'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { MetricsOverviewCards } from '@/widgets/dashboard-metrics/MetricsOverviewCards';
import { ChartsSection } from '@/widgets/analytics-charts/ChartsSection';
import { TransactionListWidget } from '@/widgets/transaction-list/TransactionListWidget';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import {
  analyticsApi,
  DashboardSummary,
  PieChartItem,
  BarChartItem,
  LineChartItem,
  TopCategoryItem,
} from '@/entities/analytics/analyticsApi';
import { transactionApi, Transaction } from '@/entities/transaction/transactionApi';

export const DashboardPageView: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pieData, setPieData] = useState<PieChartItem[]>([]);
  const [barData, setBarData] = useState<BarChartItem[]>([]);
  const [lineData, setLineData] = useState<LineChartItem[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, pieRes, barRes, lineRes, topRes, txRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getPieChart(),
        analyticsApi.getBarChart(),
        analyticsApi.getLineChart(),
        analyticsApi.getTopCategories(),
        transactionApi.getAll(),
      ]);

      setSummary(sumRes);
      setPieData(pieRes);
      setBarData(barRes);
      setLineData(lineRes);
      setTopCategories(topRes);
      setTransactions(txRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Dashboard Tổng Quan" onOpenQuickAdd={() => setIsModalOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <MetricsOverviewCards data={summary} isLoading={loading} />
        <ChartsSection
          pieData={pieData}
          barData={barData}
          lineData={lineData}
          topCategories={topCategories}
        />
        <TransactionListWidget transactions={transactions} onRefresh={fetchData} />
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
