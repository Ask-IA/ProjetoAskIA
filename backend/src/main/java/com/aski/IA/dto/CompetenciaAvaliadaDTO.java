package com.aski.IA.dto;

/**
 * Avaliação de UMA competência, do jeito que a IA devolve (antes de o backend conferir).
 * `numero`: 1 a 5. `nota`: 0, 40, 80, 120, 160 ou 200.
 */
public record CompetenciaAvaliadaDTO(int numero, int nota, String comentario, String comoMelhorar) {
}
