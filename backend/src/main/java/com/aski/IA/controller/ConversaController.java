package com.aski.IA.controller;

import org.springframework.web.bind.annotation.*;

import com.aski.IA.dto.ConversaDetalheDTO;
import com.aski.IA.dto.ConversaResumoDTO;
import com.aski.IA.dto.CotaDTO;
import com.aski.IA.dto.PaginaDTO;
import com.aski.IA.service.ConversaService;

/**
 * Histórico de perguntas do Ask IA do aluno logado — só LEITURA.
 * O usuário vem da sessão (@SessionAttribute), nunca de um parâmetro da URL.
 * O SessaoInterceptor já barra quem não está logado.
 *
 * Gravar uma interação (pergunta + resposta) é feito só por IaController,
 * que chama a IA de verdade antes de salvar. Este controller não tem mais
 * nenhum endpoint de escrita: do contrário, qualquer cliente HTTP poderia
 * gravar no histórico uma "resposta da IA" inventada.
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

    /** GET /api/conversas/cota — quantas perguntas o usuário logado ainda pode fazer hoje. */
    @GetMapping("/cota")
    public CotaDTO cota(@SessionAttribute("userId") Long usuarioId) {
        return conversaService.cota(usuarioId);
    }

    /** GET /api/conversas/{id} — conversa com todas as mensagens. */
    @GetMapping("/{conversaId}")
    public ConversaDetalheDTO detalhar(@SessionAttribute("userId") Long usuarioId,
                                       @PathVariable Long conversaId) {
        return conversaService.detalhar(usuarioId, conversaId);
    }
}
