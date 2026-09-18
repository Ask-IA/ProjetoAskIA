package com.aski.IA.dto;

/** `data` vai como texto ISO (ex.: 2026-09-16T20:15:00) — o DatePipe do Angular lê direto. */
public record SessaoResponseDTO(Long id, Long materiaId, int minutos, String anotacoes, String data) {
}
