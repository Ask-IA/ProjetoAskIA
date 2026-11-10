package com.aski.IA.dto;

/**
 * Uma competência já conferida pelo backend, pronta para o frontend.
 * O `nome` vem do backend (texto oficial resumido), não da IA — assim o rótulo nunca sai trocado.
 */
public record CompetenciaCorrigidaDTO(int numero, String nome, int nota, String comentario, String comoMelhorar) {
}
