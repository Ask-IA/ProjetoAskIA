package com.aski.IA.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.aski.IA.dto.GamificacaoDTO;
import com.aski.IA.service.GamificacaoService;

/**
 * Números de gamificação do usuário logado. O usuário vem da sessão (nunca da URL),
 * então cada pessoa só enxerga os próprios números.
 */
@RestController
@RequestMapping("/api")
public class GamificacaoController {

    private final GamificacaoService gamificacaoService;

    public GamificacaoController(GamificacaoService gamificacaoService) {
        this.gamificacaoService = gamificacaoService;
    }

    /** GET /api/gamificacao — perguntas respondidas, dias seguidos de uso e se já usou hoje. */
    @GetMapping("/gamificacao")
    public GamificacaoDTO gamificacao(@SessionAttribute("userId") Long usuarioId) {
        return gamificacaoService.resumo(usuarioId);
    }
}
