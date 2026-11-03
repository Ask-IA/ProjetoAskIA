package com.aski.IA.dto;

import java.util.List;

/** Envelope que o BeanOutputConverter pede pra IA devolver — uma lista de cartões. */
public record FlashcardsGeradosDTO(List<CartaoGeradoDTO> cartoes) {
}
