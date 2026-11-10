// src/app/shared/formula-matematica.ts
//
// Renderiza uma fórmula em LaTeX (campo `formula` de PassoDTO, vindo do Ask
// IA) com KaTeX, em vez de mostrar o código LaTeX cru como texto.
//
// Por que [innerHTML] + bypassSecurityTrustHtml é seguro aqui: o HTML não
// vem direto da IA — katex.renderToString() que o gera, a partir do texto em
// LaTeX. O KaTeX nunca produz <script> ou atributos de evento; na pior
// hipótese (LaTeX malformado), com throwOnError: false ele devolve o próprio
// texto escapado dentro de um span de erro, nunca HTML arbitrário.

import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import katex from 'katex';

/**
 * Conserta comandos LaTeX que o JSON "comeu" no caminho (bug visto em 10/11/2026: a IA mandou
 * "\rightarrow" e a tela mostrou "ightarrow").
 *
 * A IA escreve LaTeX dentro de um JSON. Em JSON, "\r", "\t", "\f", "\b" e "\n" são escapes de
 * caracteres de controle — então "\rightarrow" vira [retorno de carro] + "ightarrow", "\frac"
 * vira [form feed] + "rac", "\times" vira [tab] + "imes", "\neq" vira [quebra de linha] + "eq".
 * O JSON é válido, ninguém reclama, e a fórmula sai quebrada.
 *
 * Aqui o caractere de controle volta a ser "\" + letra — mas só quando vem colado numa letra,
 * que é o formato de um comando LaTeX. Fórmula não tem tab nem form feed de verdade, então o
 * risco de "consertar" algo que estava certo é praticamente nulo.
 */
export function restaurarBarrasDoJson(formula: string): string {
  return formula
    .replace(/\r(?=[a-zA-Z])/g, '\\r')
    .replace(/\t(?=[a-zA-Z])/g, '\\t')
    .replace(/\f(?=[a-zA-Z])/g, '\\f')
    .replace(/\x08(?=[a-zA-Z])/g, '\\b')
    .replace(/\n(?=[a-zA-Z])/g, '\\n');
}

@Component({
  selector: 'app-formula-matematica',
  standalone: true,
  template: `<div class="formula-katex" [innerHTML]="html()"></div>`,
  styleUrl: './formula-matematica.css',
})
export class FormulaMatematica {
  private sanitizer = inject(DomSanitizer);

  readonly formula = input.required<string>();

  readonly html = computed(() => {
    const bruto = restaurarBarrasDoJson(this.formula());
    try {
      const renderizado = katex.renderToString(bruto, { throwOnError: false, displayMode: true });
      // Confiamos nesse HTML porque veio do KaTeX (ver comentário no topo do
      // arquivo) — é o ÚNICO caminho que passa por bypassSecurityTrustHtml.
      return this.sanitizer.bypassSecurityTrustHtml(renderizado);
    } catch {
      // Em tese throwOnError: false já cobre isso, mas por segurança: se o
      // KaTeX falhar de outro jeito, mostra o texto puro (nunca a string bruta
      // como HTML "confiável" — senão um "formula" que não fosse LaTeX de
      // verdade poderia injetar HTML aqui).
      return bruto;
    }
  });
}
