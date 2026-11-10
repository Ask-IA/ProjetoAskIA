package com.aski.IA.dto;

import java.util.List;

/**
 * Resultado da correção devolvido ao frontend.
 * `notaTotal` é SEMPRE a soma calculada pelo backend (0 a 1000), nunca um número vindo da IA.
 * `correcoesRestantes`: quantas correções o aluno ainda pode pedir hoje.
 */
public record CorrecaoRedacaoDTO(int notaTotal, List<CompetenciaCorrigidaDTO> competencias,
                                 String comentarioGeral, String motivoNotaZero, int correcoesRestantes) {
}
