import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Stethoscope,
  Mail,
  Phone,
  Award
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Specialty } from '@/src/types';

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

const DoctorsPage = () => {
  const { doctors, addDoctor, refreshData } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpecialties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('specialties').select('*').order('name');
      if (error) throw error;
      setSpecialties(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Erro ao carregar especialidades.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialties.find(s => s.id === d.specialty_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDoctor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoctor({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        crm: formData.get('crm') as string,
        specialty_id: formData.get('specialty_id') as string,
      });

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding doctor:', error);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este médico?')) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      refreshData();
      toast.error('Médico removido.');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Erro ao excluir médico.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Médicos</h1>
          <p className="text-slate-500 text-sm">Gerencie o corpo clínico e suas especialidades.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 gap-2" />}>
            <Plus size={18} />
            Novo Médico
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Médico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" placeholder="Ex: Dr. João Silva" required className="rounded-xl" />
                </div>
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
                  <Label htmlFor="specialty_id">Especialidade</Label>
                  <Select name="specialty_id" required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(spec => (
                        <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail Profissional</Label>
                <Input id="email" name="email" type="email" placeholder="medico@clinica.com" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="(11) 99999-9999" 
                  required 
                  className="rounded-xl"
                  onChange={(e) => e.target.value = maskPhone(e.target.value)}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Salvar Cadastro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por nome ou especialidade..." 
              className="pl-10 bg-white border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-700">Médico</TableHead>
                <TableHead className="font-bold text-slate-700">Especialidade</TableHead>
                <TableHead className="font-bold text-slate-700">CRM</TableHead>
                <TableHead className="font-bold text-slate-700">Contato</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                        <Stethoscope size={20} />
                      </div>
                      <span className="font-bold text-slate-900">{doctor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      {specialties.find(s => s.id === doctor.specialty_id)?.name || 'Geral'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                      <Award size={14} className="text-slate-400" />
                      {doctor.crm}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} />
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} />
                        {doctor.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteDoctor(doctor.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorsPage;
