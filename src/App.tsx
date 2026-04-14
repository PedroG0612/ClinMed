import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Agenda from './pages/Agenda';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Availability from './pages/Availability';
import { Toaster } from '@/components/ui/sonner';

// Placeholder pages for demonstration
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-2">Este módulo está sendo preparado para a próxima expansão.</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/historico" element={<PlaceholderPage title="Histórico de Atendimentos" />} />
                <Route path="/disponibilidade" element={<Availability />} />
                <Route path="/agendamentos" element={<Appointments />} />
                <Route path="/pacientes" element={<Patients />} />
                <Route path="/medicos" element={<Doctors />} />
                <Route path="/fila" element={<PlaceholderPage title="Fila de Espera" />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
