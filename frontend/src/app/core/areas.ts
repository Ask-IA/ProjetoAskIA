// src/app/core/areas.ts
//
// As 4 áreas do ENEM e a cor de cada uma.
//
// POR QUE A COR SAIU DA MATÉRIA: antes cada matéria tinha uma cor própria
// (Português vermelho, Geografia verde, História âmbar, Matemática azul) —
// exatamente as cores de erro, acerto, alerta e ação do app. Agora a cor vem
// da ÁREA da prova, e as cores de estado ficam só para estado.
//
// PALIATIVO: o backend ainda devolve `cor` e não devolve `area` em Matéria.
// Enquanto isso, a área é deduzida pelo NOME da matéria. Quando o campo `area`
// existir no backend (MateriaModel + DER), troque as chamadas de
// areaDaMateria(nome) pelo campo vindo da API e apague o mapa abaixo.

export type AreaEnem = 'linguagens' | 'humanas' | 'natureza' | 'matematica';

/** Na ordem oficial da prova. A paleta foi validada para daltonismo NESTA ordem. */
export const AREAS: readonly AreaEnem[] = ['linguagens', 'humanas', 'natureza', 'matematica'];

export const NOME_AREA: Record<AreaEnem, string> = {
  linguagens: 'Linguagens',
  humanas: 'Ciências Humanas',
  natureza: 'Ciências da Natureza',
  matematica: 'Matemática',
};

export const NOME_CURTO_AREA: Record<AreaEnem, string> = {
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
  matematica: 'Matemática',
};

// Chaves sem acento e em minúsculas (ver normalizar()).
const AREA_POR_MATERIA: Record<string, AreaEnem> = {
  'portugues': 'linguagens',
  'lingua portuguesa': 'linguagens',
  'gramatica': 'linguagens',
  'interpretacao de texto': 'linguagens',
  'literatura': 'linguagens',
  'redacao': 'linguagens',
  'ingles': 'linguagens',
  'espanhol': 'linguagens',
  'artes': 'linguagens',
  'arte': 'linguagens',
  'educacao fisica': 'linguagens',
  'historia': 'humanas',
  'geografia': 'humanas',
  'filosofia': 'humanas',
  'sociologia': 'humanas',
  'atualidades': 'humanas',
  'fisica': 'natureza',
  'quimica': 'natureza',
  'biologia': 'natureza',
  'ciencias': 'natureza',
  'matematica': 'matematica',
  'algebra': 'matematica',
  'geometria': 'matematica',
  'estatistica': 'matematica',
};

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Área de uma matéria pelo nome. Aceita variações como "Matemática Básica"
 * ou "História do Brasil". Devolve null quando não reconhece: a tela mostra
 * a matéria em cor neutra, nunca numa cor de estado.
 */
export function areaDaMateria(nome: string | null | undefined): AreaEnem | null {
  if (!nome) return null;
  const chave = normalizar(nome);
  if (AREA_POR_MATERIA[chave]) return AREA_POR_MATERIA[chave];

  for (const [materia, area] of Object.entries(AREA_POR_MATERIA)) {
    if (chave.startsWith(materia + ' ')) return area;
  }
  return null;
}

/** Classe CSS que define --area, --area-suave e --area-forte (styles.css). */
export function classeArea(area: AreaEnem | null | undefined): string {
  return area ? `area-${area}` : 'area-nenhuma';
}
