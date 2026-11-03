package com.aski.IA.dto;

/** Uma conquista de gamificação — calculada na hora, sem tabela própria (ver REGRAS_GAMIFICACAO.md). */
public record ConquistaDTO(String id, String nome, String descricao, boolean desbloqueada) {
}
