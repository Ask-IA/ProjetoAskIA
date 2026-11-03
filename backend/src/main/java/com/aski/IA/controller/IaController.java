package com.aski.IA.controller;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.aski.IA.dto.CotaDTO;
import com.aski.IA.dto.InteracaoRequestDTO;
import com.aski.IA.dto.InteracaoResponseDTO;
import com.aski.IA.dto.PerguntarRequestDTO;
import com.aski.IA.dto.PerguntarResponseDTO;
import com.aski.IA.dto.RespostaIaDTO;
import com.aski.IA.exception.LimiteDiarioExcedidoException;
import com.aski.IA.model.ModoAjuda;
import com.aski.IA.service.ConversaService;
import com.aski.IA.service.IaService;

/**
 * Pergunta de verdade ao Ask IA. Único caminho que grava uma resposta da IA
 * no histórico — diferente do antigo POST /api/conversas/interacoes (que
 * aceitava a resposta vinda do cliente e foi removido por isso).
 *
 * Ordem importa: a cota é checada ANTES de chamar o modelo, para não gastar
 * uma chamada de API quando o aluno já estourou o limite do dia. A escrita
 * em si (salvar pergunta + resposta, descontar a cota) é toda feita por
 * ConversaService.registrarInteracao() — a mesma regra de negócio de antes,
 * só que agora a "resposta" vem do IaService, nunca do corpo da requisição.
 */
@RestController
@RequestMapping("/api/ia")
public class IaController {

    private final IaService iaService;
    private final ConversaService conversaService;

    public IaController(IaService iaService, ConversaService conversaService) {
        this.iaService = iaService;
        this.conversaService = conversaService;
    }

    @PostMapping("/perguntar")
    @ResponseStatus(HttpStatus.CREATED)
    public PerguntarResponseDTO perguntar(@SessionAttribute("userId") Long usuarioId,
                                          @RequestBody PerguntarRequestDTO dto) {
        if (dto.pergunta() == null || dto.pergunta().isBlank()) {
            throw new IllegalArgumentException("Informe a pergunta.");
        }
        ModoAjuda modo = converterModo(dto.modo());

        CotaDTO cota = conversaService.cota(usuarioId);
        if (cota.restantes() <= 0) {
            throw new LimiteDiarioExcedidoException(
                    "Limite diário de " + cota.limite() + " perguntas atingido.");
        }

        RespostaIaDTO resposta = iaService.perguntar(dto.pergunta(), modo);

        InteracaoResponseDTO salvo = conversaService.registrarInteracao(usuarioId,
                new InteracaoRequestDTO(dto.conversaId(), dto.modo(), dto.pergunta(), resposta));

        return new PerguntarResponseDTO(salvo.conversa(), resposta, salvo.cotaRestante());
    }

    private ModoAjuda converterModo(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("Modo inválido.");
        }
        try {
            return ModoAjuda.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Modo inválido.");
        }
    }
}
