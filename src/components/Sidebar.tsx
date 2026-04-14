import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserRound, 
  Clock, 
  Settings, 
  LogOut,
  Stethoscope,
  ClipboardList,
  UserCircle,
  Plus,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
    .slice(0, 15);
};

const maskCRM = (value: string) => {
  const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  const numbers = cleaned.replace(/[A-Z]/g, '');
  const letters = cleaned.replace(/[0-9]/g, '').slice(0, 2);
  
  if (letters.length > 0) {
    return `${numbers}-${letters}`;
  }
  return numbers;
};

const Sidebar = () => {
  const { role, setRole, user, doctors, specialties, switchDoctor, addDoctor, activeDoctorId } = useAuth();
  const location = useLocation();
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  const doctorLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Minha Agenda', path: '/agenda', icon: Calendar },
    { name: 'Histórico', path: '/historico', icon: ClipboardList },
    { name: 'Disponibilidade', path: '/disponibilidade', icon: Clock },
  ];

  const attendantLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agendamentos', path: '/agendamentos', icon: Calendar },
    { name: 'Pacientes', path: '/pacientes', icon: Users },
    { name: 'Médicos', path: '/medicos', icon: Stethoscope },
    { name: 'Fila de Espera', path: '/fila', icon: ClipboardList },
  ];

  const links = role === 'doctor' ? doctorLinks : attendantLinks;

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoctor({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        crm: formData.get('crm') as string,
        phone: formData.get('phone') as string,
        specialty_id: formData.get('specialty_id') as string,
      });
      setIsAddDoctorOpen(false);
    } catch (error) {
      // Error is already handled in addDoctor
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Stethoscope size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">ClinicaMed</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gestão Médica</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-semibold" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon size={20} className={cn(
                "transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
            {role === 'doctor' ? 'Trocar Médico' : 'Visualizando Agenda de:'}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            {doctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => switchDoctor(doc.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                  activeDoctorId === doc.id 
                    ? "bg-blue-100 text-blue-700 font-bold" 
                    : "hover:bg-white text-slate-500"
                )}
              >
                <UserCircle size={14} />
                <span className="truncate flex-1 text-left">{doc.name}</span>
                {activeDoctorId === doc.id && <Check size={12} />}
              </button>
            ))}
          </div>
          
          <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
            <DialogTrigger render={<Button variant="ghost" className="w-full mt-2 h-7 text-[10px] gap-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg" />}>
              <Plus size={12} />
              Novo Médico
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Criar Novo Médico</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Médico</Label>
                  <Input id="name" name="name" placeholder="Ex: Dr. Alberto Santos" required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty_id">Especialidade</Label>
                  <select 
                    id="specialty_id" 
                    name="specialty_id" 
                    required 
                    className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione uma especialidade</option>
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="alberto@clinica.com" required className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input 
                      id="crm" 
                      name="crm" 
                      placeholder="00000-UF" 
                      required 
                      className="rounded-xl"
                      onChange={(e) => e.target.value = maskCRM(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      placeholder="(11) 99999-9999" 
                      required 
                      className="rounded-xl"
                      onChange={(e) => e.target.value = maskPhone(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Criar e Acessar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {role === 'doctor' ? 'Médico' : 'Atendente'}
              </p>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Alternar Perfil</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRole('attendant')}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                role === 'attendant' 
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Atendente
            </button>
            <button
              onClick={() => setRole('doctor')}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                role === 'doctor' 
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Médico
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
