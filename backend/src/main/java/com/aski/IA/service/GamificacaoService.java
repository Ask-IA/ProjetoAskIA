package com.aski.IA.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.ConquistaDTO;
import com.aski.IA.dto.GamificacaoDTO;
import com.aski.IA.model.AutorMensagem;
import com.aski.IA.repository.MensagemRepository;
import com.aski.IA.repository.SessaoEstudoRepository;
import com.aski.IA.repository.TopicoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Gamificação: contador de perguntas respondidas, dias seguidos de uso, XP e conquistas.
 * Regras completas em docs/REGRAS_GAMIFICACAO.md.
 *
 * Tudo é calculado na hora, a partir do que já está gravado (mensagens do Ask IA, sessões de
 * estudo e tópicos concluídos). Não há tabela nova: não existe número guardado que possa ficar
 * fora de sincronia.
 */
@Service
public class GamificacaoService {

    /** Valores de XP por ação — tabela sugerida em REGRAS_GAMIFICACAO.md §3. */
    private static final long XP_POR_PERGUNTA = 10;
    private static final long XP_POR_SESSAO_DE_ESTUDO = 20;
    private static final long XP_POR_TOPICO_CONCLUIDO = 15;
    private static final long XP_POR_DIA_DE_USO = 5;

    private final MensagemRepository mensagemRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final TopicoRepository topicoRepository;
    private final ZoneId fusoDoApp;

    public GamificacaoService(MensagemRepository mensagemRepository,
                              SessaoEstudoRepository sessaoRepository,
                              TopicoRepository topicoRepository,
                              // o mesmo fuso do "dia" da cota diária, para os dois concordarem
                              @Value("${app.ia.fuso:America/Sao_Paulo}") String fuso) {
        this.mensagemRepository = mensagemRepository;
        this.sessaoRepository = sessaoRepository;
        this.topicoRepository = topicoRepository;
        this.fusoDoApp = ZoneId.of(fuso);
    }

    @Transactional(readOnly = true)
    public GamificacaoDTO resumo(Long usuarioId) {
        Set<LocalDate> dias = diasDeUso(usuarioId);
        LocalDate hoje = LocalDate.now(fusoDoApp);

        long perguntas = mensagemRepository.contarDoAutor(usuarioId, AutorMensagem.ALUNO);
        long sessoes = sessaoRepository.countByUsuarioId(usuarioId);
        long topicosConcluidos = topicoRepository.contarConcluidosDoUsuario(usuarioId);

        long xp = perguntas * XP_POR_PERGUNTA
                + sessoes * XP_POR_SESSAO_DE_ESTUDO
                + topicosConcluidos * XP_POR_TOPICO_CONCLUIDO
                + dias.size() * XP_POR_DIA_DE_USO;

        return new GamificacaoDTO(perguntas, SequenciaDeUso.diasSeguidos(dias, hoje), dias.contains(hoje), xp);
    }

    /** Quais já foram desbloqueadas — tabela sugerida em REGRAS_GAMIFICACAO.md §3. */
    @Transactional(readOnly = true)
    public List<ConquistaDTO> conquistas(Long usuarioId) {
        long perguntas = mensagemRepository.contarDoAutor(usuarioId, AutorMensagem.ALUNO);
        int diasSeguidos = diasSeguidos(usuarioId);

        return List.of(
                new ConquistaDTO("primeira-pergunta", "Primeira pergunta",
                        "Faça sua primeira pergunta ao Ask IA.", perguntas >= 1),
                new ConquistaDTO("curioso", "Curioso",
                        "Faça 10 perguntas ao Ask IA.", perguntas >= 10),
                new ConquistaDTO("constante", "Constante",
                        "Mantenha 7 dias seguidos de uso.", diasSeguidos >= 7),
                new ConquistaDTO("imparavel", "Imparável",
                        "Mantenha 30 dias seguidos de uso.", diasSeguidos >= 30)
        );
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
