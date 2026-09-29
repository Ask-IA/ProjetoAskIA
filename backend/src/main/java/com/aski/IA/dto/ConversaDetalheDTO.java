package com.aski.IA.dto;

import java.util.List;

/** Conversa completa, com todas as mensagens em ordem. */
public record ConversaDetalheDTO(Long id, String titulo, String area, String criadaEm, String atualizadaEm,
                                 List<MensagemResponseDTO> mensagens) {
}
