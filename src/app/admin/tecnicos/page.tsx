import React from 'react';
import { UserCog, Plus, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function AdminTecnicosPage() {
  const techs = [
    { id: '1', name: 'Carlos Técnico', email: 'carlos@tecnicodental.com', phone: '(11) 98888-9999', specialties: ['Cadeiras', 'Imagem', 'Autoclaves'], active: true },
    { id: '2', name: 'Marcos Silva', email: 'marcos@tecnicodental.com', phone: '(11) 97777-8888', specialties: ['Compressores', 'Bombas de Vácuo'], active: true },
    { id: '3', name: 'Ana Luiza Costa', email: 'ana.luiza@tecnicodental.com', phone: '(21) 96666-7777', specialties: ['Autoclaves', 'Biossegurança'], active: true },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Gestão de Técnicos
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Cadastre e gerencie a rede credenciada de técnicos para atendimentos em consultórios.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <UserCog className="w-5 h-5 text-brand-clinical" />
            Técnicos Credenciados ({techs.length})
          </h3>
          <button className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> Novo Técnico
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Técnico</th>
                <th className="pb-3">Contatos</th>
                <th className="pb-3">Especialidades</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {techs.map((tech) => (
                <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-brand-dark">{tech.name}</td>
                  <td className="py-3.5">
                    <div className="space-y-0.5 font-semibold text-slate-600">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {tech.email}</p>
                      <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {tech.phone}</p>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {tech.specialties.map((spec) => (
                        <span key={spec} className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success-text">
                      Ativo
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
