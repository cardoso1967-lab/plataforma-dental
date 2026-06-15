/**
 * Obtém o nome de exibição do cliente com base na prioridade:
 * 1. trade_name (Nome Fantasia)
 * 2. company_name (Razão Social)
 * 3. contact_name (Nome do Contato)
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

  if (customer.contact_name && String(customer.contact_name).trim()) {
    return String(customer.contact_name).trim();
  }

  return 'Cliente não informado';
}
