// src/app/pages/flashcards/flashcards.ts
//
// Revisão por flashcards, gerados pela IA (OpenAI, via backend) a partir das
// matérias/tópicos que o aluno já cadastrou em Matérias — igual ao Quiz:
// escolhe a matéria, pede um lote novo pra IA, revisa cartão por cartão.
//
// `cartoes`, `materias` e `gerando` são signals porque chegam de forma
// assíncrona — no modo zoneless, só o signal avisa o Angular para redesenhar.
//
// "Acertei" e "Errei" com ícone e texto; no fim, os cartões errados viram
// atalho para tirar a dúvida no Ask IA.

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Flashcard, RevisaoService } from '../../services/revisao.service';
import { EstudosService, Materia } from '../../services/estudos.service';
import { NOME_AREA, areaDaMateria, classeArea } from '../../core/areas';
import { Icone } from '../../shared/icone';

@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [FormsModule, RouterLink, Icone],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.css',
  host: { class: 'pagina' },
})
export class Flashcards implements OnInit {
  private revisao = inject(RevisaoService);
  private estudos = inject(EstudosService);

  materias = signal<Materia[]>([]);
  materiaEscolhida = signal<Materia | null>(null);
  carregandoMaterias = signal(true);

  cartoes = signal<Flashcard[]>([]);
  gerando = signal(false);
  erro = signal('');

  /** true = este lote veio do banco curado (sem IA), não foi gerado agora. */
  doBanco = signal(false);

  indice = signal(0);
  virado = signal(false);
  acertos = signal(0);
  errados = signal<Flashcard[]>([]);
  terminou = signal(false);

  atual = computed<Flashcard | null>(() => this.cartoes()[this.indice()] ?? null);
  area = computed(() => areaDaMateria(this.atual()?.materia));
  classe = computed(() => classeArea(this.area()));
  nomeArea = computed(() => {
    const area = this.area();
    return area ? NOME_AREA[area] : '';
  });

  ngOnInit(): void {
    this.estudos.listarMaterias().subscribe({
      next: m => {
        this.materias.set(m);
        this.carregandoMaterias.set(false);
      },
      error: () => {
        this.carregandoMaterias.set(false);
        this.erro.set('Não foi possível carregar suas matérias.');
      },
    });
  }

  gerar(): void {
    const materia = this.materiaEscolhida();
    if (!materia) return;
    this.gerando.set(true);
    this.erro.set('');

    this.revisao.gerarFlashcards(materia.id).subscribe({
      next: resultado => {
        this.doBanco.set(resultado.doBanco);
        this.cartoes.set(resultado.itens);
        this.gerando.set(false);
        this.indice.set(0);
        this.virado.set(false);
        this.acertos.set(0);
        this.errados.set([]);
        this.terminou.set(false);
      },
      error: () => {
        this.gerando.set(false);
        this.erro.set('Não foi possível gerar flashcards agora — nem pela IA, nem pelo banco. Tente de novo em instantes.');
      },
    });
  }

  /** Puxa flashcards prontos do banco curado pela equipe — não usa IA, não gasta cota. */
  praticarComBanco(): void {
    const materia = this.materiaEscolhida();
    if (!materia) return;
    this.gerando.set(true);
    this.erro.set('');

    this.revisao.flashcardsDoBanco(materia.nome).subscribe({
      next: cartoes => {
        this.gerando.set(false);
        if (cartoes.length === 0) {
          this.erro.set(`Ainda não há banco de flashcards pronto para "${materia.nome}". Tente gerar com a IA.`);
          return;
        }
        this.doBanco.set(true);
        this.cartoes.set(cartoes);
        this.indice.set(0);
        this.virado.set(false);
        this.acertos.set(0);
        this.errados.set([]);
        this.terminou.set(false);
      },
      error: () => {
        this.gerando.set(false);
        this.erro.set('Não foi possível carregar o banco de flashcards agora.');
      },
    });
  }

  virar(): void {
    this.virado.update(v => !v);
  }

  responder(acertou: boolean): void {
    const cartao = this.atual();
    if (acertou) this.acertos.update(n => n + 1);
    else if (cartao) this.errados.update(lista => [...lista, cartao]);

    if (this.indice() + 1 >= this.cartoes().length) {
      this.terminou.set(true);
    } else {
      this.indice.update(i => i + 1);
      this.virado.set(false);
    }
  }

  reiniciar(): void {
    this.cartoes.set([]);
    this.terminou.set(false);
    this.materiaEscolhida.set(null);
  }

  perguntaSobre(cartao: Flashcard): string {
    return `${cartao.frente} Me explique com um exemplo.`;
  }
}
