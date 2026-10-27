package com.aski.IA.exception;

/** O usuário já fez todas as perguntas permitidas hoje. Vira 429 (Too Many Requests). */
public class LimiteDiarioExcedidoException extends RuntimeException {
    public LimiteDiarioExcedidoException(String mensagem) {
        super(mensagem);
    }
}
