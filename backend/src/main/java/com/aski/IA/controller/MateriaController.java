package com.aski.IA.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.aski.IA.dto.MateriaRequestDTO;
import com.aski.IA.dto.MateriaResponseDTO;
import com.aski.IA.dto.TopicoRequestDTO;
import com.aski.IA.dto.TopicoResponseDTO;
import com.aski.IA.service.MateriaService;

import java.util.List;

/**
 * Matérias e tópicos do aluno logado.
 *
 * O usuário vem de @SessionAttribute("userId") — o mesmo atributo que o login
 * grava na sessão. O SessaoInterceptor já garantiu que ele existe antes de
 * qualquer método daqui rodar (todo /api/** passa por ele).
 */
@RestController
@RequestMapping("/api/materias")
public class MateriaController {

    private final MateriaService materiaService;

    public MateriaController(MateriaService materiaService) {
        this.materiaService = materiaService;
    }

    @GetMapping
    public List<MateriaResponseDTO> listar(@SessionAttribute("userId") Long usuarioId) {
        return materiaService.listar(usuarioId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MateriaResponseDTO criar(@SessionAttribute("userId") Long usuarioId,
                                    @RequestBody MateriaRequestDTO dto) {
        return materiaService.criar(usuarioId, dto);
    }

    @PostMapping("/{materiaId}/topicos")
    @ResponseStatus(HttpStatus.CREATED)
    public TopicoResponseDTO adicionarTopico(@SessionAttribute("userId") Long usuarioId,
                                             @PathVariable Long materiaId,
                                             @RequestBody TopicoRequestDTO dto) {
        return materiaService.adicionarTopico(usuarioId, materiaId, dto);
    }

    /** Marca ou desmarca o tópico como concluído (alterna o estado atual). */
    @PatchMapping("/{materiaId}/topicos/{topicoId}/alternar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alternarTopico(@SessionAttribute("userId") Long usuarioId,
                               @PathVariable Long materiaId,
                               @PathVariable Long topicoId) {
        materiaService.alternarTopico(usuarioId, materiaId, topicoId);
    }

    @DeleteMapping("/{materiaId}/topicos/{topicoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerTopico(@SessionAttribute("userId") Long usuarioId,
                              @PathVariable Long materiaId,
                              @PathVariable Long topicoId) {
        materiaService.removerTopico(usuarioId, materiaId, topicoId);
    }
}
