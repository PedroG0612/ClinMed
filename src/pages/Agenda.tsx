import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/src/lib/supabase';
import { Appointment } from '@/src/types';

const MOCK_APPOINTMENTS = [
  { id: '1', doctorId: 'doc-1', patientId: '123.456.789-01', patient: 'Ana Costa', time: '09:00', type: 'Consulta', status: 'confirmed', notes: '' },
  { id: '2', doctorId: 'doc-1', patientId: '234.567.890-12', patient: 'João Pereira', time: '10:30', type: 'Retorno', status: 'confirmed', notes: '' },
  { id: '3', doctorId: 'doc-2', patientId: '345.678.901-23', patient: 'Carla Souza', time: '14:00', type: 'Consulta', status: 'scheduled', notes: '' },
  { id: '4', doctorId: 'doc-2', patientId: '456.789.012-34', patient: 'Marcos Lima', time: '15:30', type: 'Retorno', status: 'scheduled', notes: '' },
];

const AgendaPage = () => {
  const { user, activeDoctorId } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!activeDoctorId) return;
    
    try {
      setIsLoading(true);
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients!appointments_patient_id_fkey(*)
        `)
        .eq('doctor_id', activeDoctorId)
        .eq('date', formattedDate)
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching agenda:', error);
      toast.error('Erro ao carregar agenda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeDoctorId, date]);

  const handleStatusChange = async (id: string, newStatus: string) => {
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

  const handleSaveNotes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          notes, 
          status: 'completed' 
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setAppointments(prev => prev.map(app => 
        app.id === selectedAppointment.id ? { ...app, notes, status: 'completed' } : app
      ));
      setIsNotesDialogOpen(false);
      toast.success('Atendimento finalizado com sucesso!');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Erro ao finalizar atendimento.');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total de Consultas</span>
              <span className="font-bold text-slate-900">{appointments.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Confirmadas</span>
              <span className="font-bold text-emerald-600">{appointments.filter(a => a.status === 'confirmed').length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Pendentes</span>
              <span className="font-bold text-amber-600">{appointments.filter(a => a.status === 'scheduled').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Agenda de {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Hoje'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {appointments.map((app) => (
            <Card key={app.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:ring-1 hover:ring-blue-100 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-blue-600 leading-none">{app.time}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Início</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{app.patient?.name || 'Paciente'}</h3>
                        {app.patient_id && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                            {app.patient_id}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold">
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={12} />
                          45 min
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User size={12} />
                          Convênio: Bradesco
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === 'scheduled' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg gap-1.5"
                          onClick={() => handleStatusChange(app.id, 'confirmed')}
                        >
                          <CheckCircle2 size={16} />
                          Confirmar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg gap-1.5"
                          onClick={() => handleStatusChange(app.id, 'cancelled')}
                        >
                          <XCircle size={16} />
                          Cancelar
                        </Button>
                      </>
                    )}
                    
                    {app.status === 'confirmed' && (
                      <Dialog open={isNotesDialogOpen && selectedAppointment?.id === app.id} onOpenChange={(open) => {
                        setIsNotesDialogOpen(open);
                        if (open) setSelectedAppointment(app);
                      }}>
                        <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2" />}>
                          Atender
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Atendimento: {app.patient?.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSaveNotes} className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="notes">Observações Clínicas</Label>
                              <Textarea 
                                id="notes" 
                                name="notes" 
                                placeholder="Descreva os sintomas, diagnóstico e conduta..." 
                                className="min-h-[200px] rounded-xl resize-none"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                Finalizar Atendimento
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {app.status === 'completed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 rounded-lg">
                        Concluído
                      </Badge>
                    )}

                    {app.status === 'cancelled' && (
                      <Badge variant="destructive" className="px-3 py-1 rounded-lg">
                        Cancelado
                      </Badge>
                    )}

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      title="Excluir"
                      onClick={() => handleDeleteAppointment(app.id)}
                    >
                      <Trash2 size={18} />
                    </Button>

                    <Button variant="ghost" size="icon" className="text-slate-400 rounded-xl">
                      <MoreVertical size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
