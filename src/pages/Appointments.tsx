import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Search,
  Plus,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Check,
  ChevronsUpDown,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { Appointment, Patient } from '@/src/types';

const MOCK_APPOINTMENTS = [
  { id: '1', doctorId: 'doc-1', patientId: '123.456.789-01', patient: 'Ana Costa', doctor: 'Dr. Ricardo Silva', date: '2026-04-13', time: '09:00', status: 'confirmed' },
  { id: '2', doctorId: 'doc-1', patientId: '234.567.890-12', patient: 'João Pereira', doctor: 'Dra. Helena Costa', date: '2026-04-13', time: '10:30', status: 'scheduled' },
  { id: '3', doctorId: 'doc-2', patientId: '345.678.901-23', patient: 'Carla Souza', doctor: 'Dr. Ricardo Silva', date: '2026-04-13', time: '14:00', status: 'scheduled' },
];

const AppointmentsPage = () => {
  const { doctors, availabilities } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Appointments with joined data
      const { data: apps, error: appsError } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors!appointments_doctor_id_fkey(*),
          patient:patients!appointments_patient_id_fkey(*)
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: true });

      if (appsError) {
        console.error('Appointments fetch error:', appsError);
        toast.error(`Erro nos agendamentos: ${appsError.message}`);
      } else {
        setAppointments(apps || []);
      }

      // Fetch Patients for the dropdown
      const { data: pats, error: patsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (patsError) {
        console.error('Patients fetch error:', patsError);
        toast.error(`Erro nos pacientes: ${patsError.message}`);
      } else {
        setPatients(pats || []);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      const message = error.message || 'Erro desconhecido';
      const details = error.details || '';
      toast.error(`Erro ao carregar dados: ${message} ${details}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to generate 30-min slots
  const generateTimeSlots = (start: string, end: string) => {
    const slots = [];
    let current = new Date(`2000-01-01T${start}:00`);
    const endTime = new Date(`2000-01-01T${end}:00`);
    
    while (current < endTime) {
      slots.push(current.toTimeString().substring(0, 5));
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots;
  };

  const getAvailableSlots = () => {
    if (!selectedDoctorId || !selectedDate) return [];
    
    const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date(selectedDate).getDay()];
    const doctorAvail = availabilities[selectedDoctorId]?.find(a => a.day === dayOfWeek);
    
    if (!doctorAvail || !doctorAvail.active) return [];

    // Generate all possible slots from doctor's availability
    let allPossibleSlots: string[] = [];
    doctorAvail.slots.forEach((slot: any) => {
      allPossibleSlots = [...allPossibleSlots, ...generateTimeSlots(slot.start, slot.end)];
    });

    // Filter out already booked slots for this doctor on this date
    const bookedSlots = appointments
      .filter((app: any) => app.doctor_id === selectedDoctorId && app.date === selectedDate && app.status !== 'cancelled')
      .map((app: any) => app.time);

    return allPossibleSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const handleAddAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const doctorId = formData.get('doctor') as string;
    const patientId = selectedPatientId;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;

    if (!patientId) {
      toast.error('Por favor, selecione um paciente.');
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{
          doctor_id: doctorId,
          patient_id: patientId,
          date,
          time,
          status: 'scheduled',
        }]);

      if (error) throw error;

      toast.success('Consulta agendada no Supabase!');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('Erro ao agendar consulta.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.filter(app => app.id !== id));
      toast.error('Agendamento removido.');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Erro ao excluir agendamento.');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: newStatus as any } : app
      ));
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
          <p className="text-slate-500 text-sm">Gerencie todas as consultas da clínica.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 gap-2" />}>
            <Plus size={18} />
            Novo Agendamento
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAppointment} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente</Label>
                <Select name="patient" required onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} ({patient.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patients.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 italic">
                    * Cadastre o paciente na aba "Pacientes" antes de agendar.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doctor">Médico / Especialista</Label>
                <Select name="doctor" required onValueChange={setSelectedDoctorId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    required 
                    className="rounded-xl" 
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Select name="time" required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSlots().length > 0 ? (
                        getAvailableSlots().map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Nenhum horário disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDoctorId && selectedDate && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2">Resumo da Disponibilidade:</p>
                  <div className="flex flex-wrap gap-2">
                    {availabilities[selectedDoctorId]?.find(a => a.day === ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date(selectedDate).getDay()])?.active ? (
                      availabilities[selectedDoctorId]?.find(a => a.day === ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date(selectedDate).getDay()])?.slots.map((slot: any) => (
                        <Badge key={slot.id} variant="secondary" className="bg-white text-blue-600 border-blue-100">
                          {slot.start} - {slot.end}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-red-500">Médico não atende nesta data.</p>
                    )}
                  </div>
                  <p className="text-[10px] text-blue-600 mt-2 italic">* Apenas horários livres de 30 em 30 min são listados acima.</p>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Confirmar Agendamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Buscar por paciente..." className="pl-10 bg-white border-slate-200 rounded-xl" />
        </div>
        <Button variant="outline" className="rounded-xl gap-2 border-slate-200">
          <Filter size={18} />
          Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.map((app) => (
          <Card key={app.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-center min-w-[80px]">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date(app.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{new Date(app.date).getDate()}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{app.time}</p>
                  </div>
                  
                  <div className="h-12 w-px bg-slate-100"></div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{app.patient?.name || 'Paciente'}</h3>
                      {app.patient_id && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          {app.patient_id}
                        </span>
                      )}
                      <Badge variant={app.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 uppercase font-bold">
                        {app.status === 'confirmed' ? 'Confirmado' : app.status === 'scheduled' ? 'Agendado' : app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Stethoscope size={14} className="text-blue-500" />
                        {app.doctor?.name || 'Médico'}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <CalendarIcon size={14} />
                        {new Date(app.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    title="Confirmar"
                    onClick={() => handleStatusUpdate(app.id, 'confirmed')}
                  >
                    <CheckCircle2 size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Cancelar"
                    onClick={() => handleStatusUpdate(app.id, 'cancelled')}
                  >
                    <XCircle size={20} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    title="Excluir"
                    onClick={() => handleDeleteAppointment(app.id)}
                  >
                    <Trash2 size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 rounded-xl">
                    <MoreVertical size={20} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsPage;
