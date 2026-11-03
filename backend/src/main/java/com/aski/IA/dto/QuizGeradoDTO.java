package com.aski.IA.dto;

import java.util.List;

/** Envelope que o BeanOutputConverter pede pra IA devolver — uma lista de questões. */
public record QuizGeradoDTO(List<QuestaoGeradaDTO> questoes) {
}
