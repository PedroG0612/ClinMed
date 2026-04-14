import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  label: string;
  active: boolean;
  slots: TimeSlot[];
}

const INITIAL_AVAILABILITY: DayAvailability[] = [
  { day: 'seg', label: 'Segunda-feira', active: true, slots: [{ id: '1', start: '08:00', end: '12:00' }, { id: '2', start: '13:30', end: '18:00' }] },
  { day: 'ter', label: 'Terça-feira', active: true, slots: [{ id: '3', start: '08:00', end: '12:00' }, { id: '4', start: '13:30', end: '18:00' }] },
  { day: 'qua', label: 'Quarta-feira', active: true, slots: [{ id: '5', start: '08:00', end: '12:00' }, { id: '6', start: '13:30', end: '18:00' }] },
  { day: 'qui', label: 'Quinta-feira', active: true, slots: [{ id: '7', start: '08:00', end: '12:00' }, { id: '8', start: '13:30', end: '18:00' }] },
  { day: 'sex', label: 'Sexta-feira', active: true, slots: [{ id: '9', start: '08:00', end: '12:00' }, { id: '10', start: '13:30', end: '18:00' }] },
  { day: 'sab', label: 'Sábado', active: false, slots: [] },
  { day: 'dom', label: 'Domingo', active: false, slots: [] },
];

const AvailabilityPage = () => {
  const { activeDoctorId, availabilities, updateAvailability } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Use availability from context or fallback to empty array
  const currentAvailability = availabilities[activeDoctorId] || [];

  const toggleDay = (dayIndex: number) => {
    // Deep clone to ensure no shared references
    const newAvail = JSON.parse(JSON.stringify(currentAvailability));
    newAvail[dayIndex].active = !newAvail[dayIndex].active;
    if (newAvail[dayIndex].active && newAvail[dayIndex].slots.length === 0) {
      newAvail[dayIndex].slots = [{ id: Math.random().toString(), start: '08:00', end: '12:00' }];
    }
    updateAvailability(activeDoctorId, newAvail);
  };

  const addSlot = (dayIndex: number) => {
    const newAvail = JSON.parse(JSON.stringify(currentAvailability));
    newAvail[dayIndex].slots.push({
      id: Math.random().toString(),
      start: '14:00',
      end: '18:00'
    });
    updateAvailability(activeDoctorId, newAvail);
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    const newAvail = JSON.parse(JSON.stringify(currentAvailability));
    newAvail[dayIndex].slots = newAvail[dayIndex].slots.filter((s: any) => s.id !== slotId);
    updateAvailability(activeDoctorId, newAvail);
  };

  const updateSlot = (dayIndex: number, slotId: string, field: 'start' | 'end', value: string) => {
    const newAvail = JSON.parse(JSON.stringify(currentAvailability));
    const slot = newAvail[dayIndex].slots.find((s: any) => s.id === slotId);
    if (slot) {
      slot[field] = value;
    }
    updateAvailability(activeDoctorId, newAvail);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Disponibilidade salva com sucesso!');
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurar Disponibilidade</h1>
          <p className="text-slate-500 text-sm">Defina os dias e horários que você atende na clínica.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 gap-2 shadow-lg shadow-blue-100"
        >
          {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="weekly" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Horário Semanal
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Bloqueios e Exceções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4">
            {currentAvailability.map((day, dayIdx) => (
              <Card key={day.day} className={cn(
                "border-none shadow-sm transition-all duration-200",
                day.active ? "bg-white ring-1 ring-slate-200" : "bg-slate-50 opacity-75"
              )}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <Switch 
                        checked={day.active} 
                        onCheckedChange={() => toggleDay(dayIdx)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <span className={cn(
                        "font-bold text-lg",
                        day.active ? "text-slate-900" : "text-slate-400"
                      )}>
                        {day.label}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {!day.active ? (
                        <p className="text-sm text-slate-400 italic">Indisponível para agendamentos</p>
                      ) : (
                        <div className="space-y-3">
                          {day.slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                <Input 
                                  type="time" 
                                  value={slot.start} 
                                  onChange={(e) => updateSlot(dayIdx, slot.id, 'start', e.target.value)}
                                  className="w-24 border-none bg-transparent h-8 focus-visible:ring-0"
                                />
                                <span className="text-slate-400">até</span>
                                <Input 
                                  type="time" 
                                  value={slot.end} 
                                  onChange={(e) => updateSlot(dayIdx, slot.id, 'end', e.target.value)}
                                  className="w-24 border-none bg-transparent h-8 focus-visible:ring-0"
                                />
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeSlot(dayIdx, slot.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => addSlot(dayIdx)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg gap-1.5 h-8"
                          >
                            <Plus size={14} />
                            Adicionar intervalo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exceptions">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Datas Específicas</CardTitle>
              <CardDescription>
                Bloqueie datas para férias, congressos ou outros compromissos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info className="text-blue-600 shrink-0" size={20} />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Bloqueios de data impedem que a recepção agende qualquer consulta no dia selecionado. 
                  Consultas já agendadas precisarão ser remarcadas manualmente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-slate-400" />
                    Adicionar Bloqueio
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input type="date" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (Opcional)</Label>
                      <Input placeholder="Ex: Congresso Médico" className="rounded-xl" />
                    </div>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                      Bloquear Data
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle size={18} className="text-slate-400" />
                    Bloqueios Ativos
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">25/04/2026</p>
                        <p className="text-xs text-slate-500">Feriado Local</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">10/05/2026 - 15/05/2026</p>
                        <p className="text-xs text-slate-500">Congresso de Cardiologia</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvailabilityPage;
