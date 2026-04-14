import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, Specialty } from '@/src/types';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
  doctors: Profile[];
  specialties: Specialty[];
  activeDoctorId: string;
  switchDoctor: (id: string) => void;
  addDoctor: (newDoc: Omit<Profile, 'id' | 'role' | 'created_at'>) => Promise<void>;
  availabilities: Record<string, any[]>;
  updateAvailability: (doctorId: string, availability: any[]) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for simulation
const INITIAL_DOCTORS: Profile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ricardo Silva',
    email: 'ricardo@clinica.com',
    role: 'doctor',
    specialty_id: 'spec-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    name: 'Dra. Helena Costa',
    email: 'helena@clinica.com',
    role: 'doctor',
    specialty_id: 'spec-2',
    created_at: new Date().toISOString(),
  }
];

const MOCK_ATTENDANT: Profile = {
  id: 'att-1',
  name: 'Maria Oliveira',
  email: 'maria@clinica.com',
  role: 'attendant',
  created_at: new Date().toISOString(),
};

const getDefaultAvailability = () => [
  { day: 'seg', label: 'Segunda-feira', active: true, slots: [{ id: '1', start: '08:00', end: '12:00' }, { id: '2', start: '13:30', end: '18:00' }] },
  { day: 'ter', label: 'Terça-feira', active: true, slots: [{ id: '3', start: '08:00', end: '12:00' }, { id: '4', start: '13:30', end: '18:00' }] },
  { day: 'qua', label: 'Quarta-feira', active: true, slots: [{ id: '5', start: '08:00', end: '12:00' }, { id: '6', start: '13:30', end: '18:00' }] },
  { day: 'qui', label: 'Quinta-feira', active: true, slots: [{ id: '7', start: '08:00', end: '12:00' }, { id: '8', start: '13:30', end: '18:00' }] },
  { day: 'sex', label: 'Sexta-feira', active: true, slots: [{ id: '9', start: '08:00', end: '12:00' }, { id: '10', start: '13:30', end: '18:00' }] },
  { day: 'sab', label: 'Sábado', active: false, slots: [] },
  { day: 'dom', label: 'Domingo', active: false, slots: [] },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('clinic_role');
    return (saved as UserRole) || 'attendant';
  });
  
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, any[]>>({});
  const [activeDoctorId, setActiveDoctorId] = useState<string>(() => {
    return localStorage.getItem('clinic_active_doctor_id') || '';
  });
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Doctors and Specialties
      const [docsRes, specsRes] = await Promise.all([
        supabase.from('doctors').select('*').order('name'),
        supabase.from('specialties').select('*').order('name')
      ]);

      if (docsRes.error) throw docsRes.error;
      if (specsRes.error) throw specsRes.error;

      setDoctors(docsRes.data || []);
      setSpecialties(specsRes.data || []);

      if (docsRes.data && docsRes.data.length > 0 && !activeDoctorId) {
        const firstId = docsRes.data[0].id;
        setActiveDoctorId(firstId);
        localStorage.setItem('clinic_active_doctor_id', firstId);
      }

      // Fetch Availabilities
      const initialAvails: Record<string, any[]> = {};
      docsRes.data?.forEach(doc => {
        initialAvails[doc.id] = getDefaultAvailability();
      });
      setAvailabilities(initialAvails);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Erro ao conectar com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      if (role === 'doctor') {
        const doc = doctors.find(d => d.id === activeDoctorId) || doctors[0];
        setUser(doc);
      } else {
        setUser(MOCK_ATTENDANT);
      }
    }
  }, [role, activeDoctorId, doctors]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('clinic_role', newRole);
  };

  const switchDoctor = (id: string) => {
    setActiveDoctorId(id);
    localStorage.setItem('clinic_active_doctor_id', id);
  };

  const addDoctor = async (newDoc: Omit<Profile, 'id' | 'role' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert([{
          ...newDoc
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      setDoctors(prev => [...prev, data]);
      setAvailabilities(prev => ({ ...prev, [data.id]: getDefaultAvailability() }));
      toast.success('Médico cadastrado com sucesso!');
      switchDoctor(data.id);
    } catch (error: any) {
      console.error('Error adding doctor:', error);
      toast.error(`Erro ao salvar médico: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const updateAvailability = async (doctorId: string, availability: any[]) => {
    // In a real app, you'd save this to a 'doctor_availability' table
    const newAvails = { ...availabilities, [doctorId]: availability };
    setAvailabilities(newAvails);
    toast.info('Disponibilidade atualizada localmente (Módulo DB em breve)');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      setRole, 
      isLoading,
      doctors,
      specialties,
      activeDoctorId,
      switchDoctor,
      addDoctor,
      availabilities,
      updateAvailability,
      refreshData: fetchInitialData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
