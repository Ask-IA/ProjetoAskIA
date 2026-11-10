package com.aski.IA.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.aski.IA.dto.CorrecaoRedacaoDTO;
import com.aski.IA.dto.CorrigirRedacaoRequestDTO;
import com.aski.IA.dto.CotaDTO;
import com.aski.IA.service.RedacaoService;

/**
 * Corretor de redação no modelo do ENEM. Fica em /api/**, então o SessaoInterceptor já barra
 * quem não está logado. Erros saem pelo GlobalExceptionHandler, no formato { "message": ... }:
 * 400 (texto curto/longo, sem tema), 429 (correções do dia esgotadas), 503 (IA fora do ar).
 */
@RestController
@RequestMapping("/api/redacao")
public class RedacaoController {

    private final RedacaoService redacaoService;

    public RedacaoController(RedacaoService redacaoService) {
        this.redacaoService = redacaoService;
    }

    /** GET /api/redacao/cota — quantas correções o aluno ainda pode pedir hoje. */
    @GetMapping("/cota")
    public CotaDTO cota(@SessionAttribute("userId") Long usuarioId) {
        return redacaoService.cota(usuarioId);
    }

    /** POST /api/redacao/corrigir — corrige a redação nas 5 competências e devolve a nota estimada. */
    @PostMapping("/corrigir")
    public CorrecaoRedacaoDTO corrigir(@SessionAttribute("userId") Long usuarioId,
                                       @RequestBody CorrigirRedacaoRequestDTO dto) {
        return redacaoService.corrigir(usuarioId, dto);
    }
}
