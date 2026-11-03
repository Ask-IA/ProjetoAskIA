package com.aski.IA.dto;

/** `token` vem do link do e-mail (query param ?token=...). */
public record RedefinirSenhaRequestDTO(String token, String novaSenha) {
}
