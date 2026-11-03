package com.aski.IA.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.CartaoGeradoDTO;
import com.aski.IA.dto.FlashcardBancoDTO;
import com.aski.IA.dto.FlashcardRespostaDTO;
import com.aski.IA.dto.QuestaoBancoDTO;
import com.aski.IA.dto.QuestaoGeradaDTO;
import com.aski.IA.dto.ResultadoGeracaoDTO;
import com.aski.IA.exception.IaIndisponivelException;
import com.aski.IA.model.MateriaModel;
import com.aski.IA.model.TopicoModel;

/**
 * Flashcards e quiz gerados pela IA, a partir das matérias/tópicos que o próprio aluno já
 * cadastrou (tela Matérias) — não são dados fixos: cada geração é uma chamada nova à IA.
 *
 * Decisão de design: nada da geração por IA é persistido. Cada clique em "Gerar" pede um lote
 * novo, do mesmo jeito que o Ask IA responde pergunta por pergunta.
 *
 * FALLBACK (importante, resolve um problema real): se a chamada à IA falhar por qualquer motivo
 * (sem chave configurada, cota da conta estourada, erro de rede, resposta malformada — tudo isso
 * vira IaIndisponivelException em IaService), caímos automaticamente para o banco de conteúdo
 * curado pela equipe (BancoConteudoService) filtrado pelo nome da matéria, em vez de devolver erro
 * pro aluno. Só propagamos o erro original se o banco também não tiver nada pra essa matéria — aí
 * sim não há o que mostrar. ResultadoGeracaoDTO.doBanco() avisa o frontend qual foi a fonte usada.
 */
@Service
public class RevisaoService {

    private final MateriaService materiaService;
    private final IaService iaService;
    private final BancoConteudoService bancoConteudoService;

    public RevisaoService(MateriaService materiaService, IaService iaService,
                          BancoConteudoService bancoConteudoService) {
        this.materiaService = materiaService;
        this.iaService = iaService;
        this.bancoConteudoService = bancoConteudoService;
    }

    @Transactional(readOnly = true)
    public ResultadoGeracaoDTO<FlashcardRespostaDTO> gerarFlashcards(Long usuarioId, Long materiaId) {
        MateriaModel materia = materiaService.buscarDoUsuario(usuarioId, materiaId);
        List<String> topicos = nomesDosTopicos(materia);

        try {
            List<CartaoGeradoDTO> cartoes = iaService.gerarFlashcards(materia.getNome(), topicos);
            List<FlashcardRespostaDTO> itens = cartoes.stream()
                    .map(c -> new FlashcardRespostaDTO(materia.getNome(), c.frente(), c.verso()))
                    .toList();
            return new ResultadoGeracaoDTO<>(itens, false);
        } catch (IaIndisponivelException falhaIa) {
            List<FlashcardBancoDTO> doBanco = bancoConteudoService.flashcardsPorMateria(materia.getNome());
            if (doBanco.isEmpty()) throw falhaIa;
            List<FlashcardRespostaDTO> itens = doBanco.stream()
                    .map(f -> new FlashcardRespostaDTO(f.materia(), f.frente(), f.verso()))
                    .toList();
            return new ResultadoGeracaoDTO<>(itens, true);
        }
    }

    @Transactional(readOnly = true)
    public ResultadoGeracaoDTO<QuestaoGeradaDTO> gerarQuiz(Long usuarioId, Long materiaId) {
        MateriaModel materia = materiaService.buscarDoUsuario(usuarioId, materiaId);
        List<String> topicos = nomesDosTopicos(materia);

        try {
            List<QuestaoGeradaDTO> itens = iaService.gerarQuiz(materia.getNome(), topicos);
            return new ResultadoGeracaoDTO<>(itens, false);
        } catch (IaIndisponivelException falhaIa) {
            List<QuestaoBancoDTO> doBanco = bancoConteudoService.questoesPorMateria(materia.getNome());
            if (doBanco.isEmpty()) throw falhaIa;
            List<QuestaoGeradaDTO> itens = doBanco.stream()
                    .map(q -> new QuestaoGeradaDTO(q.enunciado(), q.alternativas(), q.correta(), q.explicacao()))
                    .toList();
            return new ResultadoGeracaoDTO<>(itens, true);
        }
    }

    private List<String> nomesDosTopicos(MateriaModel materia) {
        return materia.getTopicos().stream().map(TopicoModel::getNome).toList();
    }
}
