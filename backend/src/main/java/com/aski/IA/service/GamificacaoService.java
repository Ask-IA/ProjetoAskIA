package com.aski.IA.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.GamificacaoDTO;
import com.aski.IA.model.AutorMensagem;
import com.aski.IA.repository.MensagemRepository;
import com.aski.IA.repository.SessaoEstudoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

/**
 * Gamificação, versão mínima: contador de perguntas respondidas + dias seguidos de uso.
 * Regras completas em docs/REGRAS_GAMIFICACAO.md.
 *
 * Tudo é calculado na hora, a partir do que já está gravado (mensagens do Ask IA e sessões
 * de estudo). Não há tabela nova: não existe número guardado que possa ficar fora de sincronia.
 */
@Service
public class GamificacaoService {

    private final MensagemRepository mensagemRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final ZoneId fusoDoApp;

    public GamificacaoService(MensagemRepository mensagemRepository,
                              SessaoEstudoRepository sessaoRepository,
                              // o mesmo fuso do "dia" da cota diária, para os dois concordarem
                              @Value("${app.ia.fuso:America/Sao_Paulo}") String fuso) {
        this.mensagemRepository = mensagemRepository;
        this.sessaoRepository = sessaoRepository;
        this.fusoDoApp = ZoneId.of(fuso);
    }

    @Transactional(readOnly = true)
    public GamificacaoDTO resumo(Long usuarioId) {
        Set<LocalDate> dias = diasDeUso(usuarioId);
        LocalDate hoje = LocalDate.now(fusoDoApp);

        long perguntas = mensagemRepository.contarDoAutor(usuarioId, AutorMensagem.ALUNO);
        return new GamificacaoDTO(perguntas, SequenciaDeUso.diasSeguidos(dias, hoje), dias.contains(hoje));
    }

    /** Usado também pelo /api/progresso, para a ofensiva ter UMA definição só no sistema. */
    @Transactional(readOnly = true)
    public int diasSeguidos(Long usuarioId) {
        return SequenciaDeUso.diasSeguidos(diasDeUso(usuarioId), LocalDate.now(fusoDoApp));
    }

    /** Dias (no fuso do app) em que o usuário perguntou ao Ask IA ou registrou uma sessão de estudo. */
    private Set<LocalDate> diasDeUso(Long usuarioId) {
        ZoneId fusoDoServidor = ZoneId.systemDefault();
        Set<LocalDate> dias = new HashSet<>();

        for (LocalDateTime data : mensagemRepository.datasDoAutor(usuarioId, AutorMensagem.ALUNO)) {
            dias.add(SequenciaDeUso.diaNoFuso(data, fusoDoServidor, fusoDoApp));
        }
        for (LocalDateTime data : sessaoRepository.datasDoUsuario(usuarioId)) {
            dias.add(SequenciaDeUso.diaNoFuso(data, fusoDoServidor, fusoDoApp));
        }
        return dias;
    }
}
