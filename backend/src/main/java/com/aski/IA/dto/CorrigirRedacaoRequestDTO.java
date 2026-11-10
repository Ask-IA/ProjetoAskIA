package com.aski.IA.dto;

/**
 * Pedido de correção de redação (POST /api/redacao/corrigir).
 * `tema`: a proposta de redação, como no ENEM — sem ela não dá para avaliar a Competência 2.
 * `texto`: a redação do aluno.
 */
public record CorrigirRedacaoRequestDTO(String tema, String texto) {
}
