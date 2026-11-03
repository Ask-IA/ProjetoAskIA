package com.aski.IA.dto;

/** Mesma regra do login: `identificador` é o e-mail OU o nome do usuário. */
public record EsqueciSenhaRequestDTO(String identificador) {
}
