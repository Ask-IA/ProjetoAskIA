package com.aski.IA.dto;

/** Resultado de uma pergunta real à IA: a conversa, a resposta dela e quantas perguntas restam hoje. */
public record PerguntarResponseDTO(ConversaResumoDTO conversa, RespostaIaDTO resposta, int cotaRestante) {
}
