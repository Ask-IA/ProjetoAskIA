// src/app/pages/ask-ia/resposta-ia/resposta-ia.ts
//
// Uma resposta da IA: etiqueta da área, passos numerados na cor da área,
// marca-texto nos termos-chave e o "Tente você" no fim.
//
// No modo Resolver os passos aparecem um por vez. Motivo: alunos que
// praticaram com IA sem freio foram 48% melhor nos exercícios e 17% pior na
// prova (Bastani et al., 2025, PNAS). O freio é tentar antes de ver.

import { Component, Injector, afterNextRender, computed, inject, input } from '@angular/core';
import { AskIaService, MensagemIa, NOME_MODO } from '../../../services/ask-ia.service';
import { NOME_AREA, classeArea } from '../../../core/areas';
import { TrechosPipe } from '../../../shared/trechos.pipe';

@Component({
  selector: 'app-resposta-ia',
  imports: [TrechosPipe],
  templateUrl: './resposta-ia.html',
  styleUrl: './resposta-ia.css',
})
export class RespostaIa {
  private service = inject(AskIaService);
  private injector = inject(Injector);

  readonly mensagem = input.required<MensagemIa>();
  /** Posição da mensagem na conversa (para achar o passo e guardar o estado). */
  readonly indice = input.required<number>();

  readonly nomeArea = NOME_AREA;
  readonly nomeModo = NOME_MODO;

  readonly resposta = computed(() => this.mensagem().resposta);
  readonly classe = computed(() => classeArea(this.resposta().area));
  readonly faltamPassos = computed(() => this.mensagem().passosVisiveis < this.resposta().passos.length);

  revelar(): void {
    const proximo = this.mensagem().passosVisiveis;
    this.service.revelarProximoPasso(this.indice());
    // Leva o foco para o passo que acabou de aparecer (teclado e leitor de tela)
    afterNextRender(() => {
      document.getElementById(this.idDoPasso(proximo))?.focus();
    }, { injector: this.injector });
  }

  verResposta(): void {
    this.service.abrirTenteVoce(this.indice());
  }

  idDoPasso(passo: number): string {
    return `passo-${this.indice()}-${passo}`;
  }
}
