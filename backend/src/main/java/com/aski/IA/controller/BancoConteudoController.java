package com.aski.IA.controller;

import com.aski.IA.dto.FlashcardBancoDTO;
import com.aski.IA.dto.QuestaoBancoDTO;
import com.aski.IA.service.BancoConteudoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Banco de conteúdo curado (sem IA): questões de quiz e flashcards prontos
 * por matéria, para o aluno praticar mesmo sem a IA disponível. Continua
 * sob /api/** (exige sessão, como todo o resto) só por consistência de
 * padrão de rotas — o conteúdo em si não é por usuário.
 */
@RestController
@RequestMapping("/api/banco")
public class BancoConteudoController {

    private final BancoConteudoService bancoConteudoService;

    public BancoConteudoController(BancoConteudoService bancoConteudoService) {
        this.bancoConteudoService = bancoConteudoService;
    }

    @GetMapping("/questoes")
    public List<QuestaoBancoDTO> questoes(@RequestParam String materia) {
        return bancoConteudoService.questoesPorMateria(materia);
    }

    @GetMapping("/flashcards")
    public List<FlashcardBancoDTO> flashcards(@RequestParam String materia) {
        return bancoConteudoService.flashcardsPorMateria(materia);
    }
}
