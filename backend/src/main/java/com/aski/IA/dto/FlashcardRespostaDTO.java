package com.aski.IA.dto;

/** Resposta de POST /api/materias/{id}/revisao/flashcards — já com o nome da matéria, pro frontend exibir. */
public record FlashcardRespostaDTO(String materia, String frente, String verso) {
}
