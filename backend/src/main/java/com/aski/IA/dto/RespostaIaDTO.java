package com.aski.IA.dto;

import java.util.List;

/** Resposta estruturada da IA. `area` em minúsculas: linguagens | humanas | natureza | matematica (ou nulo). */
public record RespostaIaDTO(String area, String topico, List<PassoDTO> passos, TenteVoceDTO tenteVoce) {
}
