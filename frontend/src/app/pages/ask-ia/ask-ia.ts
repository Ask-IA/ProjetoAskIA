// src/app/pages/ask-ia/ask-ia.ts
//
// Tela principal do produto: chat com a IA (com DADOS FALSOS por enquanto).
//
// Requisitos atendidos (vindos do backlog + user stories):
// - campo de pergunta já em foco ao abrir
// - três exemplos clicáveis de dúvida
// - indicador de "carregando" enquanto a IA responde
// - resposta em passos numerados
// - contador de perguntas restantes do dia
// - estado de erro que PRESERVA o texto digitado
// - tela de limite diário atingido, com horário de reinício
//
// Para testar o estado de erro: digite "erro" e envie.

import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
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
  mensagens: Mensagem[] = [];
  carregando = false;
  erro = '';
  limiteAtingido = false;

  cotaTotal = COTA_DIARIA;
  cotaRestante: number | null = null;
  horarioReinicio = this.service.horarioReinicio();

  exemplos = [
    'Me explique função afim com um exemplo',
    'Como usar crase corretamente?',
    'O que foi a Era Vargas?',
  ];

  ngOnInit(): void {
    this.service.cotaRestante().subscribe(restante => {
      this.cotaRestante = restante;
      this.limiteAtingido = restante <= 0;
    });
  }

  usarExemplo(texto: string): void {
    this.pergunta = texto;
    this.campoPergunta?.nativeElement.focus();
  }

  enviar(): void {
    const texto = this.pergunta.trim();
    if (!texto || this.carregando || this.limiteAtingido) return;

    this.erro = '';
    this.carregando = true;
    this.mensagens.push({ autor: 'voce', texto });

    this.service.perguntar(texto).subscribe({
      next: resposta => {
        this.carregando = false;
        this.cotaRestante = resposta.cotaRestante;
        this.mensagens.push({ autor: 'ia', passos: resposta.passos });
        this.pergunta = ''; // só limpa quando deu certo
      },
      error: (err: { status?: number; message?: string }) => {
        this.carregando = false;
        // a última mensagem "sua" sai da conversa, porque não foi respondida
        this.mensagens.pop();

        if (err?.status === 429) {
          this.limiteAtingido = true;
          this.cotaRestante = 0;
          return;
        }

        // Estado de erro: o texto digitado CONTINUA no campo
        this.erro = 'Não foi possível obter a resposta agora. Sua pergunta foi mantida no campo — tente enviar de novo.';
      },
    });
  }
}
