package com.aski.IA.dto;

/** Resultado de salvar uma pergunta: a conversa atualizada + quantas perguntas ainda restam hoje. */
public record InteracaoResponseDTO(ConversaResumoDTO conversa, int cotaRestante) {
}
