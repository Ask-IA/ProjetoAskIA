package com.aski.IA.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aski.IA.exception.RecursoNaoEncontradoException;

import java.util.Map;

/**
 * Converte exceções em respostas JSON no formato { "message": "..." },
 * que é o que o frontend lê (err.error?.message).
 *
 * A anotação @RestControllerAdvice é o que faz o Spring realmente usar esta
 * classe. Sem ela, esta classe era ignorada e todo erro virava um 500 genérico —
 * por isso "e-mail já cadastrado" chegava no frontend como mensagem genérica.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Regra de negócio violada (e-mail duplicado, senha inválida, campo vazio...) → 400 */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    /** Recurso inexistente ou de outro usuário → 404 */
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> handleNaoEncontrado(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }
}
