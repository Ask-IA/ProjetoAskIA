package com.aski.IA.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.aski.IA.dto.MetaRequestDTO;
import com.aski.IA.dto.MetaResponseDTO;
import com.aski.IA.dto.SessaoRequestDTO;
import com.aski.IA.dto.SessaoResponseDTO;
import com.aski.IA.service.CronogramaService;

import java.util.List;

/** Metas semanais e sessões de estudo do aluno logado. */
@RestController
@RequestMapping("/api")
public class CronogramaController {

    private final CronogramaService cronogramaService;

    public CronogramaController(CronogramaService cronogramaService) {
        this.cronogramaService = cronogramaService;
    }

    // ---------- Metas ----------

    @GetMapping("/metas")
    public List<MetaResponseDTO> listarMetas(@SessionAttribute("userId") Long usuarioId) {
        return cronogramaService.listarMetas(usuarioId);
    }

    @PostMapping("/metas")
    @ResponseStatus(HttpStatus.CREATED)
    public MetaResponseDTO criarMeta(@SessionAttribute("userId") Long usuarioId,
                                     @RequestBody MetaRequestDTO dto) {
        return cronogramaService.criarMeta(usuarioId, dto);
    }

    @DeleteMapping("/metas/{metaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerMeta(@SessionAttribute("userId") Long usuarioId,
                            @PathVariable Long metaId) {
        cronogramaService.removerMeta(usuarioId, metaId);
    }

    // ---------- Sessões de estudo ----------

    @GetMapping("/sessoes")
    public List<SessaoResponseDTO> listarSessoes(@SessionAttribute("userId") Long usuarioId) {
        return cronogramaService.listarSessoes(usuarioId);
    }

    @PostMapping("/sessoes")
    @ResponseStatus(HttpStatus.CREATED)
    public SessaoResponseDTO registrarSessao(@SessionAttribute("userId") Long usuarioId,
                                             @RequestBody SessaoRequestDTO dto) {
        return cronogramaService.registrarSessao(usuarioId, dto);
    }
}
