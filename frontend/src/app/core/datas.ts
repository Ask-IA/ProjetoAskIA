// src/app/core/datas.ts
//
// Datas e durações escritas do jeito que a gente fala.
// Usa o Intl do próprio navegador em pt-BR (não precisa registrar locale
// no Angular para isso).

const DIA_DA_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const DATA_POR_EXTENSO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

function inicioDoDia(data: Date): number {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia.getTime();
}

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Quinta-feira, 24 de setembro" */
export function hojePorExtenso(agora = new Date()): string {
  return maiuscula(DATA_POR_EXTENSO.format(agora));
}

/** "agora", "hoje", "ontem", "segunda" (até 6 dias) ou "12/09". */
export function descreverQuando(data: Date, agora = new Date()): string {
  const minutos = (agora.getTime() - data.getTime()) / 60000;
  if (minutos < 5) return 'agora';

  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / 86400000);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return DIA_DA_SEMANA.format(data).replace('-feira', '');

  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
}

/** 200 → "3 h 20"; 45 → "45 min"; 120 → "2 h". */
export function duracaoPorExtenso(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')}`;
}
