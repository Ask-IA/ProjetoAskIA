package com.aski.IA.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.aski.IA.dto.ConversaDetalheDTO;
import com.aski.IA.dto.ConversaResumoDTO;
import com.aski.IA.dto.InteracaoRequestDTO;
import com.aski.IA.dto.PaginaDTO;
import com.aski.IA.service.ConversaService;

/**
 * Histórico de perguntas do Ask IA do aluno logado.
 * O usuário vem da sessão (@SessionAttribute), nunca de um parâmetro da URL.
 * O SessaoInterceptor já barra quem não está logado.
 */
@RestController
@RequestMapping("/api/conversas")
public class ConversaController {

    private final ConversaService conversaService;

    public ConversaController(ConversaService conversaService) {
        this.conversaService = conversaService;
    }

    /** GET /api/conversas?page=0&size=20 — mais recentes primeiro. size máximo: 50. */
    @GetMapping
    public PaginaDTO<ConversaResumoDTO> listar(@SessionAttribute("userId") Long usuarioId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return conversaService.listar(usuarioId, page, size);
    }

    /** GET /api/conversas/{id} — conversa com todas as mensagens. */
    @GetMapping("/{conversaId}")
    public ConversaDetalheDTO detalhar(@SessionAttribute("userId") Long usuarioId,
                                       @PathVariable Long conversaId) {
        return conversaService.detalhar(usuarioId, conversaId);
    }

    /**
     * POST /api/conversas/interacoes — salva pergunta + resposta.
     *
     * TRANSITÓRIO: enquanto o endpoint da IA não existe, é o frontend quem envia a
     * resposta para ser guardada. Quando o backend chamar a IA, apague este método
     * e faça o endpoint da IA chamar conversaService.registrarInteracao() — assim
     * o cliente não consegue gravar uma "resposta da IA" inventada no histórico.
     */
    @PostMapping("/interacoes")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversaResumoDTO registrar(@SessionAttribute("userId") Long usuarioId,
                                       @RequestBody InteracaoRequestDTO dto) {
        return conversaService.registrarInteracao(usuarioId, dto);
    }
}
