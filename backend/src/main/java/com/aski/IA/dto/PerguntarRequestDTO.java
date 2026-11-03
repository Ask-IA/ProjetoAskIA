package com.aski.IA.dto;

/**
 * Pergunta do aluno para a IA de verdade (POST /api/ia/perguntar).
 * `conversaId` nulo = começa uma conversa nova. `modo`: explicar | resolver | plano.
 * Diferente de InteracaoRequestDTO: aqui NÃO existe campo `resposta` — quem
 * gera a resposta é o backend (IaService), nunca o cliente.
 */
public record PerguntarRequestDTO(Long conversaId, String modo, String pergunta) {
}
