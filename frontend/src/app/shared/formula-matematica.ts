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
    const bruto = this.formula();
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
