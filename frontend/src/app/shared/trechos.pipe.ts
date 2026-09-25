// src/app/shared/trechos.pipe.ts
//
// Marca-texto nos termos-chave da resposta da IA.
//
// Combinado com o prompt (João): o termo-chave vem entre sinais de igual
// duplos, como no Markdown estendido — "O a é a ==taxa de variação==".
// Este pipe quebra o texto em trechos e a tela desenha cada termo marcado
// dentro de um <mark>.
//
// Por que não usar [innerHTML]: o texto vem da IA. Montar HTML a partir dele
// abriria espaço para injeção de código; trechos + interpolação são seguros.

import { Pipe, PipeTransform } from '@angular/core';

export interface Trecho {
  texto: string;
  destaque: boolean;
}

@Pipe({ name: 'trechos' })
export class TrechosPipe implements PipeTransform {
  transform(texto: string | null | undefined): Trecho[] {
    if (!texto) return [];

    // split com grupo de captura: os índices ímpares são o que estava entre ==
    return texto
      .split(/==(.+?)==/g)
      .map((parte, indice) => ({ texto: parte, destaque: indice % 2 === 1 }))
      .filter(trecho => trecho.texto.length > 0);
  }
}
