// src/app/pages/ask-ia/ask-ia.ts
//
// Tela principal do produto: chat com a IA (ainda com DADOS FALSOS).
//
// Estado em signals: o app é zoneless, e só o signal avisa o Angular para
// redesenhar quando algo muda fora de um clique (resposta da IA, cota, erro).
// `pergunta` continua propriedade comum porque está ligada ao [(ngModel)] —
// digitar já é um evento e o Angular redesenha sozinho nesse caso.
//
// Para testar o estado de erro: digite "erro" e envie.

import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AskIaService, COTA_DIARIA, PassoResposta } from '../../services/ask-ia.service';

interface Mensagem {
  autor: 'voce' | 'ia';
  texto?: string;
  passos?: PassoResposta[];
}

@Component({
  selector: 'app-ask-ia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ask-ia.html',
  styleUrl: './ask-ia.css',
})
export class AskIa implements OnInit {
  private service = inject(AskIaService);

  @ViewChild('campoPergunta') campoPergunta?: ElementRef<HTMLTextAreaElement>;

  pergunta = '';

  mensagens = signal<Mensagem[]>([]);
  carregando = signal(false);
  erro = signal('');
  limiteAtingido = signal(false);
  cotaRestante = signal<number | null>(null);

  cotaTotal = COTA_DIARIA;
  horarioReinicio = this.service.horarioReinicio();

  exemplos = [
    'Me explique função afim com um exemplo',
    'Como usar crase corretamente?',
    'O que foi a Era Vargas?',
  ];

  ngOnInit(): void {
    this.service.cotaRestante().subscribe({
      next: restante => {
        this.cotaRestante.set(restante);
        this.limiteAtingido.set(restante <= 0);
      },
      error: () => this.erro.set('Não foi possível verificar sua cota de hoje.'),
    });
  }

  usarExemplo(texto: string): void {
    this.pergunta = texto;
    this.campoPergunta?.nativeElement.focus();
  }

  enviar(): void {
    const texto = this.pergunta.trim();
    if (!texto || this.carregando() || this.limiteAtingido()) return;

    this.erro.set('');
    this.carregando.set(true);
    this.mensagens.update(lista => [...lista, { autor: 'voce', texto }]);

    this.service.perguntar(texto).subscribe({
      next: resposta => {
        this.carregando.set(false);
        this.cotaRestante.set(resposta.cotaRestante);
        this.mensagens.update(lista => [...lista, { autor: 'ia', passos: resposta.passos }]);
        this.pergunta = ''; // só limpa quando deu certo
      },
      error: (err: { status?: number; message?: string }) => {
        this.carregando.set(false);
        // a última mensagem "sua" sai da conversa, porque não foi respondida
        this.mensagens.update(lista => lista.slice(0, -1));

        if (err?.status === 429) {
          this.limiteAtingido.set(true);
          this.cotaRestante.set(0);
          return;
        }

        // Estado de erro: o texto digitado CONTINUA no campo
        this.erro.set('Não foi possível obter a resposta agora. Sua pergunta foi mantida no campo — tente enviar de novo.');
      },
    });
  }
}
