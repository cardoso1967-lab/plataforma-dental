import React from 'react';
import { Calendar, User, Clock, MapPin } from 'lucide-react';

export default function AdminAgendaPage() {
  const appointments = [
    { id: '1', tech: 'Carlos Técnico', client: 'Dra. Sandra Melo', date: '08/06/2026', time: '09:00 - 12:00', task: 'Instalação de Raio-X', status: 'confirmado' },
    { id: '2', tech: 'Marcos Silva', client: 'Clínica Sorriso Lindo', date: '08/06/2026', time: '14:00 - 17:00', task: 'Manutenção Compressor', status: 'em_andamento' },
    { id: '3', tech: 'Ana Luiza Costa', client: 'OdontoClinic Paulista', date: '09/06/2026', time: '10:00 - 12:00', task: 'Calibração Autoclave', status: 'agendado' },
  ];

  const statusColors = {
    agendado: 'bg-blue-50 text-blue-700',
    confirmado: 'bg-indigo-50 text-indigo-700',
    em_andamento: 'bg-sky-50 text-sky-700 animate-pulse',
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Agenda de Visitas
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Monitore as visitas de campo agendadas e o andamento dos atendimentos.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Calendar className="w-5 h-5 text-brand-clinical" />
            Compromissos Agendados ({appointments.length})
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((app) => (
            <div key={app.id} className="border border-slate-100 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow bg-white">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {app.time}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[app.status as keyof typeof statusColors]}`}>
                  {app.status}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-brand-dark text-sm">{app.task}</h4>
                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {app.client}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <User className="w-3.5 h-3.5 text-brand-clinical" />
                <span>Técnico: {app.tech}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
