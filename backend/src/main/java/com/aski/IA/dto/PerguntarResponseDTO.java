package com.aski.IA.dto;

/**
 * Resultado de uma pergunta real à IA: a conversa, a resposta dela e quantas perguntas
 * restam hoje. `doFallback` = true quando a IA falhou de verdade e a resposta é a de
 * segurança do IaService (não uma resposta real gerada a partir da pergunta) — o
 * frontend usa isso pra avisar o aluno, em vez de deixar parecer uma resposta normal.
 */
public record PerguntarResponseDTO(ConversaResumoDTO conversa, RespostaIaDTO resposta, int cotaRestante,
                                    boolean doFallback) {
}
