package com.aski.IA.dto;

import java.util.List;

/**
 * `autor`: "aluno" | "ia". Mensagem do aluno preenche só `texto`; a da IA preenche
 * topico, passos e tenteVoce. Datas em texto ISO, como em SessaoResponseDTO.
 */
public record MensagemResponseDTO(Long id, String autor, String modo, String texto, String topico,
                                  List<PassoDTO> passos, TenteVoceDTO tenteVoce, String criadaEm) {
}
