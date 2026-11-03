package com.aski.IA.dto;

import java.util.List;

/**
 * Envelope de resposta de POST .../revisao/flashcards|quiz. `doBanco` diz
 * ao frontend se `itens` veio da IA de verdade (false) ou do banco curado,
 * usado como FALLBACK automático quando a IA falha (sem chave, cota da
 * conta estourada, erro de rede, resposta malformada — ver
 * RevisaoService). Existe para o aluno nunca ver uma tela vazia só porque
 * a IA está indisponível, e para não gastar uma segunda chamada de API
 * numa nova tentativa manual.
 */
public record ResultadoGeracaoDTO<T>(List<T> itens, boolean doBanco) {
}
