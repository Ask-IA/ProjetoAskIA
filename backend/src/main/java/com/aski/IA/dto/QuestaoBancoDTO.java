package com.aski.IA.dto;

import java.util.List;

/**
 * Mesmo formato que o frontend já espera de QuestaoQuiz (revisao.service.ts):
 * `correta` é o ÍNDICE (0-based) da alternativa certa em `alternativas`, não
 * a letra — a conversão A/B/C/D → 0/1/2/3 acontece em BancoConteudoService.
 */
public record QuestaoBancoDTO(String enunciado, List<String> alternativas, int correta, String explicacao) {
}
