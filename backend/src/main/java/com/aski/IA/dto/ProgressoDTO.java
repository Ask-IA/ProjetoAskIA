package com.aski.IA.dto;

import java.util.List;

/** Resposta de GET /api/progresso. */
public record ProgressoDTO(int ofensiva, List<DesempenhoMateriaDTO> desempenhos) {
}
