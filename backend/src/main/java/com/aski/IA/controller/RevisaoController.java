package com.aski.IA.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.aski.IA.dto.FlashcardRespostaDTO;
import com.aski.IA.dto.QuestaoGeradaDTO;
import com.aski.IA.dto.ResultadoGeracaoDTO;
import com.aski.IA.service.RevisaoService;

/**
 * Flashcards e quiz para uma matéria do aluno logado — IA com fallback
 * automático para o banco de conteúdo curado quando a IA falha (ver
 * RevisaoService). `doBanco` na resposta diz qual das duas fontes foi
 * usada desta vez, pro frontend avisar o aluno.
 *
 * Os dois endpoints são POST (não GET) porque, quando a IA responde, cada
 * chamada é uma geração nova — custa uma chamada de API, não é uma leitura
 * idempotente de algo já guardado. A matéria vem da URL, mas a dona da
 * matéria é sempre checada contra a sessão (RevisaoService -> MateriaService),
 * então ninguém gera flashcards/quiz em cima da matéria de outra pessoa.
 */
@RestController
@RequestMapping("/api/materias/{materiaId}/revisao")
public class RevisaoController {

    private final RevisaoService revisaoService;

    public RevisaoController(RevisaoService revisaoService) {
        this.revisaoService = revisaoService;
    }

    /** POST /api/materias/{materiaId}/revisao/flashcards — gera um novo lote de flashcards (ou cai no banco). */
    @PostMapping("/flashcards")
    public ResultadoGeracaoDTO<FlashcardRespostaDTO> gerarFlashcards(@SessionAttribute("userId") Long usuarioId,
                                                                     @PathVariable Long materiaId) {
        return revisaoService.gerarFlashcards(usuarioId, materiaId);
    }

    /** POST /api/materias/{materiaId}/revisao/quiz — gera um quiz novo (ou cai no banco). */
    @PostMapping("/quiz")
    public ResultadoGeracaoDTO<QuestaoGeradaDTO> gerarQuiz(@SessionAttribute("userId") Long usuarioId,
                                                           @PathVariable Long materiaId) {
        return revisaoService.gerarQuiz(usuarioId, materiaId);
    }
}
