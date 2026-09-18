package com.aski.IA.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.aski.IA.dto.ProgressoDTO;
import com.aski.IA.dto.ResumoPainelDTO;
import com.aski.IA.service.ResumoService;

/** Números prontos para as telas Painel e Progresso. */
@RestController
@RequestMapping("/api")
public class ResumoController {

    private final ResumoService resumoService;

    public ResumoController(ResumoService resumoService) {
        this.resumoService = resumoService;
    }

    @GetMapping("/painel")
    public ResumoPainelDTO painel(@SessionAttribute("userId") Long usuarioId) {
        return resumoService.painel(usuarioId);
    }

    @GetMapping("/progresso")
    public ProgressoDTO progresso(@SessionAttribute("userId") Long usuarioId) {
        return resumoService.progresso(usuarioId);
    }
}
