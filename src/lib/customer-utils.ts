/**
 * Obtém o nome de exibição do cliente com base na prioridade:
 * 1. trade_name (Nome Fantasia)
 * 2. company_name (Razão Social)
 * 3. profiles.name (Nome do Perfil)
 * 4. 'Cliente não informado'
 */
export function getCustomerDisplayName(customer: any): string {
  if (!customer) return 'Cliente não informado';

  if (customer.trade_name && String(customer.trade_name).trim()) {
    return String(customer.trade_name).trim();
  }

  if (customer.company_name && String(customer.company_name).trim()) {
    return String(customer.company_name).trim();
  }

  const rawProfile = customer.profiles;
  if (rawProfile) {
    if (Array.isArray(rawProfile)) {
      const name = rawProfile[0]?.name;
      if (name && String(name).trim()) return String(name).trim();
    } else if (typeof rawProfile === 'object') {
      const name = rawProfile.name;
      if (name && String(name).trim()) return String(name).trim();
    }
  }

  return 'Cliente não informado';
}
