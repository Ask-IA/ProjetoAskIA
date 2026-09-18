package com.aski.IA.dto;

/** Uma linha do Progresso: % de tópicos concluídos e minutos estudados na matéria. */
public record DesempenhoMateriaDTO(String materia, String cor, int percentual, int minutos) {
}
