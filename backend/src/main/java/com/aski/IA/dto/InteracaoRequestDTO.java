package com.aski.IA.dto;

/**
 * Uma pergunta do aluno + a resposta que a IA deu.
 * `conversaId` nulo = começa uma conversa nova. `modo`: explicar | resolver | plano.
 */
public record InteracaoRequestDTO(Long conversaId, String modo, String pergunta, RespostaIaDTO resposta) {
}
