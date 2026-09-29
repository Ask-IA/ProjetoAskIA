package com.aski.IA.dto;

import java.util.List;

/**
 * Resposta paginada com formato próprio e estável. Serializar o Page do Spring
 * direto expõe detalhes internos que mudam entre versões do framework.
 * `pagina` começa em 0.
 */
public record PaginaDTO<T>(List<T> conteudo, int pagina, int tamanho, long totalElementos,
                           int totalPaginas, boolean ultima) {
}
