package com.aski.IA.dto;

/**
 * `login` é o e-mail OU o nome do usuário. `email` continua aceito só para
 * quem ainda chama a API do jeito antigo (Postman, scripts).
 */
public record LoginRequestDTO(String login, String email, String password) {

    /** O que a pessoa digitou para se identificar (login tem prioridade sobre email). */
    public String identificador() {
        String valor = (login != null && !login.isBlank()) ? login : email;
        return valor == null ? "" : valor.trim();
    }
}
