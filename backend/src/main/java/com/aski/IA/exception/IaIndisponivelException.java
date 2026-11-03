package com.aski.IA.exception;

/**
 * A chamada à IA (OpenAI) falhou ou devolveu algo que não dava para entender.
 * Vira 503 (Service Unavailable): o problema é do provedor externo, não do
 * que o aluno pediu — diferente de um 400, que seria culpa da requisição.
 */
public class IaIndisponivelException extends RuntimeException {
    public IaIndisponivelException(String mensagem) {
        super(mensagem);
    }

    public IaIndisponivelException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}
