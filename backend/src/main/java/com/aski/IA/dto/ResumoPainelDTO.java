package com.aski.IA.dto;

import java.util.List;

/** Resposta de GET /api/painel — tudo que o dashboard mostra, numa chamada só. */
public record ResumoPainelDTO(
        int minutosTotais,
        int minutosSemana,
        int topicosConcluidos,
        int totalMaterias,
        List<MinutosDiaDTO> minutosPorDia,
        DesempenhoResumoDTO maiorDesempenho,
        DesempenhoResumoDTO menorDesempenho
) {
    public record MinutosDiaDTO(String rotulo, int minutos) {
    }

    public record DesempenhoResumoDTO(String materia, int percentual) {
    }
}
