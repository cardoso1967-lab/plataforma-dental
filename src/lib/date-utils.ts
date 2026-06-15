export function formatFriendlyDateTime(dateInput: any): string {
  if (!dateInput) return 'Data não definida';
  try {
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return 'Data não definida';
    }

    if (isNaN(date.getTime())) return 'Data não definida';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (targetDate.getTime() === today.getTime()) {
      return `Hoje, ${timeStr}`;
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return `Amanhã, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${dateStr}, ${timeStr}`;
    }
  } catch (err) {
    return 'Data não definida';
  }
}

export function formatFriendlyDate(dateInput: any): string {
  if (!dateInput) return 'Data não definida';
  try {
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      return 'Data não definida';
    }

    if (isNaN(date.getTime())) return 'Data não definida';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (err) {
    return 'Data não definida';
  }
}

