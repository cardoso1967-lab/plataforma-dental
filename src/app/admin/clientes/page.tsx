import React from 'react';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminClientesPage() {
  const clients = [
    { id: '1', name: 'Clínica Sorriso Lindo', contact: 'Dra. Sandra Melo', email: 'contato@sorrisolindo.com', phone: '(11) 98888-7777', city: 'São Paulo - SP', cnpj: '12.345.678/0001-90' },
    { id: '2', name: 'OdontoClinic Paulista', contact: 'Dr. Roberto Santos', email: 'paulista@odontoclinic.com', phone: '(11) 97777-6666', city: 'São Paulo - SP', cnpj: '98.765.432/0001-21' },
    { id: '3', name: 'Consultório Odonto VIP', contact: 'Dra. Cláudia Lins', email: 'vip@odontovip.com.br', phone: '(21) 96666-5555', city: 'Rio de Janeiro - RJ', cnpj: '55.444.333/0001-12' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Gestão de Clientes
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Visualize e gerencie os consultórios e dentistas cadastrados na plataforma.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Users className="w-5 h-5 text-brand-clinical" />
            Clientes Cadastrados ({clients.length})
          </h3>
          <button className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            + Novo Cliente
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Razão Social / Nome</th>
                <th className="pb-3">CNPJ / CPF</th>
                <th className="pb-3">Responsável</th>
                <th className="pb-3">Contato</th>
                <th className="pb-3">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-brand-dark">{client.name}</td>
                  <td className="py-3.5 font-semibold text-slate-500">{client.cnpj}</td>
                  <td className="py-3.5 font-semibold text-slate-700">{client.contact}</td>
                  <td className="py-3.5">
                    <div className="space-y-0.5 font-semibold text-slate-600">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {client.email}</p>
                      <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {client.phone}</p>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="flex items-center gap-1 text-slate-500 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {client.city}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
