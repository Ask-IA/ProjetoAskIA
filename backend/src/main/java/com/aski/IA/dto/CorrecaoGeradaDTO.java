package com.aski.IA.dto;

import java.util.List;

/**
 * Envelope que o BeanOutputConverter pede para a IA devolver na correção de redação.
 * `motivoNotaZero`: preenchido só quando a redação inteira deve receber zero (fuga total ao
 * tema, não ser dissertativo-argumentativo, texto insuficiente...). Nulo nos demais casos.
 */
public record CorrecaoGeradaDTO(List<CompetenciaAvaliadaDTO> competencias, String comentarioGeral,
                                String motivoNotaZero) {
}
