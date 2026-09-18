package com.aski.IA.exception;

/**
 * Lançada quando o recurso pedido não existe OU não pertence ao usuário logado.
 * Nos dois casos a resposta é 404 — de propósito: não revelamos a um usuário
 * que existe uma matéria/meta de outra pessoa com aquele id.
 */
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
