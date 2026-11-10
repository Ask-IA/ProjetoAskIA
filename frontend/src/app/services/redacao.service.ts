// src/app/services/redacao.service.ts
//
// Corretor de redação no modelo do ENEM (5 competências, 0 a 1000).
//
// - POST /api/redacao/corrigir: o backend valida o texto, confere o limite do dia, chama a IA
//   e devolve a correção já conferida (cada nota em 0/40/80/120/160/200 e o total somado lá,
//   nunca um número "inventado" pela IA).
// - GET /api/redacao/cota: quantas correções ainda dá para pedir hoje.
// Nada fica guardado no banco nesta versão: sair da tela perde a correção (o texto não — ver
// o rascunho em redacao.ts).

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompetenciaCorrigida {
  numero: number;
  nome: string;
  nota: number; // 0, 40, 80, 120, 160 ou 200
  comentario: string | null;
  comoMelhorar: string | null;
}

export interface CorrecaoRedacao {
  notaTotal: number; // 0 a 1000
  competencias: CompetenciaCorrigida[];
  comentarioGeral: string | null;
  /** Preenchido só quando a redação inteira recebeu zero (fuga ao tema, texto insuficiente...). */
  motivoNotaZero: string | null;
  correcoesRestantes: number;
}

export interface CotaRedacao {
  limite: number;
  usadas: number;
  restantes: number;
}

@Injectable({ providedIn: 'root' })
export class RedacaoService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/redacao`;

  corrigir(tema: string, texto: string): Observable<CorrecaoRedacao> {
    return this.http.post<CorrecaoRedacao>(`${this.api}/corrigir`, { tema, texto });
  }

  cota(): Observable<CotaRedacao> {
    return this.http.get<CotaRedacao>(`${this.api}/cota`);
  }
}
