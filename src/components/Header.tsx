import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Bell, Search, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { user, role } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar pacientes, consultas ou médicos..."
          className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <Badge variant={role === 'doctor' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                {role === 'doctor' ? 'Médico' : 'Recepção'}
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
            <UserCircle size={40} strokeWidth={1} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
