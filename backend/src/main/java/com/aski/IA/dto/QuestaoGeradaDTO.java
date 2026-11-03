package com.aski.IA.dto;

import java.util.List;

/**
 * Uma questão de múltipla escolha gerada pela IA.
 * `correta` é o ÍNDICE (0-based) da alternativa certa dentro de `alternativas`.
 */
public record QuestaoGeradaDTO(String enunciado, List<String> alternativas, int correta, String explicacao) {
}
