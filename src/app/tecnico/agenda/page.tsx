import React from 'react';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';

export default function TecnicoAgendaPage() {
  const mySchedule = [
    { id: '1', time: '09:00 - 11:30', client: 'Dra. Sandra Melo', address: 'Rua Augusta, 1500 - Consolação', phone: '(11) 98888-7777', task: 'Instalação de Sensor Intraoral' },
    { id: '2', time: '14:00 - 16:00', client: 'Dr. Roberto Santos', address: 'Av. Paulista, 500 - Bela Vista', phone: '(11) 97777-6666', task: 'Troca de Peça na Cadeira S500' },
    { id: '3', time: '16:30 - 18:00', client: 'Clínica Sorriso Lindo', address: 'Rua das Flores, 120 - Pinheiros', phone: '(11) 96666-5555', task: 'Preventiva Compressor' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Minha Agenda de Hoje
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Roteiro detalhado de visitas técnicas agendadas para o seu dia.
        </p>
      </div>

      <div className="space-y-4">
        {mySchedule.map((item) => (
          <div 
            key={item.id}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4 hover:shadow-md transition-shadow"
          >
            {/* Header time */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-xs font-extrabold text-brand-clinical flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {item.time}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Carlos Técnico</span>
            </div>

            {/* Info */}
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <h4 className="font-extrabold text-brand-dark text-sm leading-snug">
                {item.task}
              </h4>
              
              <div className="space-y-1 text-[11px] pt-1">
                <p className="text-slate-800">
                  Cliente: <strong className="text-brand-dark">{item.client}</strong>
                </p>
                <p className="flex items-start gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{item.address}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.phone}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
