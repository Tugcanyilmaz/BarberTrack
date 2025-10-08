import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, ServiceType, TransactionWithDetails } from '../lib/supabase';
import { Scissors, LogOut, Users, TrendingUp, Trash2, UserPlus } from 'lucide-react';

type EmployeeStats = {
  profile: Profile;
  transactions: TransactionWithDetails[];
  totalCount: number;
  serviceCounts: { [key: string]: number };
};

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

 async function loadData() {
  await loadEmployees();
  await loadServices();
  await loadTransactions();
}


  async function loadEmployees() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .eq('is_active', true)
      .order('full_name');

    if (data) setEmployees(data);
  }

  async function loadServices() {
    const { data } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (data) setServices(data);
  }

async function loadTransactions() {
  if (!profile) return; // ✅ Güvenlik ve bekleme kontrolü

  let query = supabase
    .from('transactions')
    .select(`
      *,
      service_types(*),
      profiles(*)
    `)
    .order('performed_at', { ascending: false });

  // Eğer kullanıcı admin değilse, sadece kendi işlemlerini görsün
  if (profile.role !== 'admin') {
    query = query.eq('employee_id', profile.id);
  }

  const { data } = await query;

  if (data) {
    const stats: EmployeeStats[] = employees.map(employee => {
      const empTransactions = data.filter(t => t.employee_id === employee.id) as TransactionWithDetails[];
      const serviceCounts: { [key: string]: number } = {};

      services.forEach(service => {
        serviceCounts[service.id] = empTransactions.filter(t => t.service_type_id === service.id).length;
      });

      return {
        profile: employee,
        transactions: empTransactions,
        totalCount: empTransactions.length,
        serviceCounts,
      };
    });

    setEmployeeStats(stats);
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

  async function deactivateEmployee(employeeId: string) {
    if (!confirm('Bu çalışanı devre dışı bırakmak istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', employeeId);

      if (error) throw error;
      await loadEmployees();
      await loadTransactions();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      alert('İşlem sırasında hata oluştu');
    }
  }

  const totalTransactions = employeeStats.reduce((sum, emp) => sum + emp.totalCount, 0);
  const selectedStats = selectedEmployee
    ? employeeStats.find(s => s.profile.id === selectedEmployee)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-3 rounded-xl">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{profile?.shop_name || 'BarberTrack'}</h1>
                <p className="text-slate-600 text-sm">Yönetici Paneli</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <p className="text-slate-200 text-sm font-medium">Toplam İşlem</p>
              </div>
              <p className="text-4xl font-bold">{totalTransactions}</p>
            </div>

            <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <p className="text-slate-200 text-sm font-medium">Aktif Çalışan</p>
              </div>
              <p className="text-4xl font-bold">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
         <div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-bold text-slate-900">Çalışan Performansı</h2>
  {/* Çalışan ekleme butonu devre dışı bırakıldı */}
</div>


          {showAddEmployee && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                Yeni çalışan eklemek için login sayfasından "Kayıt Ol" seçeneğini kullanın ve "Çalışan" rolünü seçin.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Çalışan</th>
                  {services.map(service => (
                    <th key={service.id} className="text-center py-3 px-4 text-slate-700 font-semibold">
                      {service.name}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 text-slate-700 font-semibold">Toplam</th>
                  <th className="text-center py-3 px-4 text-slate-700 font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map(stat => (
                  <tr key={stat.profile.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{stat.profile.full_name}</p>
                        <p className="text-sm text-slate-600">{stat.profile.email}</p>
                      </div>
                    </td>
                    {services.map(service => (
                      <td key={service.id} className="text-center py-3 px-4 text-slate-900 font-medium">
                        {stat.serviceCounts[service.id] || 0}
                      </td>
                    ))}
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-lg font-bold">
                        {stat.totalCount}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedEmployee(
                            selectedEmployee === stat.profile.id ? null : stat.profile.id
                          )}
                          className="px-3 py-1 text-sm bg-slate-100 text-slate-900 rounded hover:bg-slate-200 transition-colors"
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => deactivateEmployee(stat.profile.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedStats && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedStats.profile.full_name} - İşlem Geçmişi
              </h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-slate-600 hover:text-slate-900"
              >
                Kapat
              </button>
            </div>

            {selectedStats.transactions.length === 0 ? (
              <p className="text-slate-600 text-center py-8">İşlem kaydı bulunmuyor</p>
            ) : (
              <div className="space-y-2">
                {selectedStats.transactions.slice(0, 30).map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.service_types.name}</p>
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
