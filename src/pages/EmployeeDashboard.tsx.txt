import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ServiceType, Transaction } from '../lib/supabase';
import { Scissors, Plus, Trash2, LogOut, TrendingUp } from 'lucide-react';

export default function EmployeeDashboard() {
  const { profile, signOut } = useAuth();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
    loadTransactions();
  }, []);

  async function loadServices() {
    const { data } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (data) {
      setServices(data);
      if (data.length > 0) {
        setSelectedService(data[0].id);
      }
    }
  }

  async function loadTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('employee_id', profile?.id)
      .order('performed_at', { ascending: false });

    if (data) setTransactions(data);
  }

  async function addTransaction() {
    if (!selectedService || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          employee_id: profile.id,
          service_type_id: selectedService,
          performed_at: new Date().toISOString(),
        });

      if (error) throw error;
      await loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('İşlem eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('İşlem silinirken hata oluştu');
    }
  }

  const serviceCounts = services.map(service => ({
    ...service,
    count: transactions.filter(t => t.service_type_id === service.id).length,
  }));

  const totalTransactions = transactions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-3 rounded-xl">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h1>
                <p className="text-slate-600 text-sm">Çalışan Paneli</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-slate-200 text-sm font-medium">Toplam İşlem</p>
            </div>
            <p className="text-4xl font-bold">{totalTransactions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Yeni İşlem Ekle</h2>

          <div className="flex gap-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <button
              onClick={addTransaction}
              disabled={loading || !selectedService}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ekle</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">İstatistikler</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {serviceCounts.map(service => (
              <div key={service.id} className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-600 text-sm mb-1">{service.name}</p>
                <p className="text-3xl font-bold text-slate-900">{service.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">İşlem Geçmişi</h2>

          {transactions.length === 0 ? (
            <p className="text-slate-600 text-center py-8">Henüz işlem kaydı bulunmuyor</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 20).map(transaction => {
                const service = services.find(s => s.id === transaction.service_type_id);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{service?.name}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(transaction.performed_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
