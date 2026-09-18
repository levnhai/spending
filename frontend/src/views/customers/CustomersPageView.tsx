'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Customer,
  CustomerStats,
  CreateCustomerPayload,
  customerApi,
} from '@/entities/customer';
import { AddEditCustomerModal, CustomerFilterBar } from '@/features/customer-management';
import { CustomerStatsCards } from '@/widgets/customer-stats';
import { CustomerTable } from '@/widgets/customer-table';
import { CustomerDetailDrawer } from '@/widgets/customer-detail-drawer';
import { Header } from '@/widgets/header/Header';

export const CustomersPageView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [hasDebtOnly, setHasDebtOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt_desc');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerApi.getAll({
        search: search.trim() || undefined,
        group: selectedGroup || undefined,
        hasDebt: hasDebtOnly ? 'true' : undefined,
        sortBy,
      });
      setCustomers(res);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup, hasDebtOnly, sortBy]);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await customerApi.getStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load customer stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      await customerApi.syncAll();
      await Promise.all([loadData(), loadStats()]);
    } catch (err) {
      console.error('Failed to sync all customers', err);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSaveCustomer = async (payload: CreateCustomerPayload) => {
    if (editingCustomer) {
      await customerApi.update(editingCustomer._id, payload);
    } else {
      await customerApi.create(payload);
    }
    await Promise.all([loadData(), loadStats()]);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xóa khách hàng "${customer.name}"?`
    );
    if (!confirm) return;

    try {
      await customerApi.delete(customer._id);
      if (detailCustomerId === customer._id) {
        setDetailCustomerId(null);
      }
      await Promise.all([loadData(), loadStats()]);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa khách hàng');
    }
  };

  const handleSyncCustomer = async (customer: Customer) => {
    try {
      await customerApi.syncStats(customer._id);
      await Promise.all([loadData(), loadStats()]);
    } catch (err) {
      console.error('Failed to sync customer stats', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-4 sm:space-y-6 w-full">
      {/* App Header Bar */}
      <Header
        title="Quản Lý Khách Hàng"
        onOpenQuickAddOrder={handleOpenAddModal}
      />

      <main className="px-3 sm:px-4 md:px-8 space-y-3.5 sm:space-y-5 w-full">
        {/* Stats Cards */}
        <CustomerStatsCards stats={stats} loading={statsLoading} />

        {/* Filter & Search Bar */}
        <CustomerFilterBar
          search={search}
          onSearchChange={setSearch}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
          hasDebtOnly={hasDebtOnly}
          onHasDebtToggle={() => setHasDebtOnly((prev) => !prev)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onAddNew={handleOpenAddModal}
          onRefresh={() => {
            loadData();
            loadStats();
          }}
          onSyncAll={handleSyncAll}
          syncing={syncingAll}
          loading={loading}
        />

        {/* Main Table */}
        <CustomerTable
          customers={customers}
          loading={loading}
          onViewDetails={(c) => setDetailCustomerId(c._id)}
          onEdit={(c) => {
            setEditingCustomer(c);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteCustomer}
          onSync={handleSyncCustomer}
          onAddNew={handleOpenAddModal}
        />

        {/* Add / Edit Modal */}
        <AddEditCustomerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          customer={editingCustomer}
          onSave={handleSaveCustomer}
        />

        {/* 360° Customer Detail Drawer */}
        <CustomerDetailDrawer
          isOpen={!!detailCustomerId}
          onClose={() => setDetailCustomerId(null)}
          customerId={detailCustomerId}
          onEdit={(c) => {
            setEditingCustomer(c);
            setIsModalOpen(true);
          }}
          onRefreshList={() => {
            loadData();
            loadStats();
          }}
        />
      </main>
    </div>
  );
};
