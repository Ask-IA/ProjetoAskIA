package com.aski.IA.dto;

import java.util.List;

public record MateriaResponseDTO(Long id, String nome, String cor, List<TopicoResponseDTO> topicos) {
}
