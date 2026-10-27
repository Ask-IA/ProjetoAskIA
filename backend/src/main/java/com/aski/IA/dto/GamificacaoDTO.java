package com.aski.IA.dto;

/**
 * Resposta de GET /api/gamificacao (versão mínima).
 *
 * @param perguntasRespondidas quantas perguntas o aluno já fez ao Ask IA e recebeu resposta (no total)
 * @param diasSeguidos         dias seguidos de uso (pergunta ao Ask IA OU sessão de estudo)
 * @param usouHoje             true se já houve uso hoje (o front pode lembrar o aluno de manter a sequência)
 */
public record GamificacaoDTO(long perguntasRespondidas, int diasSeguidos, boolean usouHoje) {
}
