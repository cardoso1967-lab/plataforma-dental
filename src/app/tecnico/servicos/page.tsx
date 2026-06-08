import React from 'react';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { Wrench } from 'lucide-react';

export default function TecnicoServicosPage() {
  const assignedServices = [
    {
      id: '1',
      osNumber: '0892',
      customerName: 'Dra. Sandra Melo',
      equipmentName: 'Autoclave Digital 12L',
      status: 'em_atendimento' as const,
      priority: 'urgente' as const,
      scheduledDate: 'Hoje às 14:00',
    },
    {
      id: '2',
      osNumber: '0890',
      customerName: 'Dr. Roberto Santos',
      equipmentName: 'Cadeira Premium S500',
      status: 'em_analise' as const,
      priority: 'alta' as const,
      scheduledDate: 'Hoje às 16:30',
    },
    {
      id: '3',
      osNumber: '0887',
      customerName: 'Odonto VIP',
      equipmentName: 'Bomba de Vácuo 1/2 HP',
      status: 'aberta' as const,
      priority: 'media' as const,
      scheduledDate: 'Amanhã às 09:00',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Minhas Ordens de Serviço
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Lista completa de chamados técnicos e manutenções designados a você.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {assignedServices.map((service) => (
          <ServiceOrderCard key={service.id} {...service} />
        ))}
      </div>
    </div>
  );
}
