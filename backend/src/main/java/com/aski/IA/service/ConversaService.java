package com.aski.IA.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.ConversaDetalheDTO;
import com.aski.IA.dto.ConversaResumoDTO;
import com.aski.IA.dto.InteracaoRequestDTO;
import com.aski.IA.dto.MensagemResponseDTO;
import com.aski.IA.dto.PaginaDTO;
import com.aski.IA.dto.PassoDTO;
import com.aski.IA.dto.RespostaIaDTO;
import com.aski.IA.dto.TenteVoceDTO;
import com.aski.IA.exception.RecursoNaoEncontradoException;
import com.aski.IA.model.AreaEnem;
import com.aski.IA.model.AutorMensagem;
import com.aski.IA.model.ConversaModel;
import com.aski.IA.model.MensagemModel;
import com.aski.IA.model.ModoAjuda;
import com.aski.IA.model.PassoResposta;
import com.aski.IA.model.UserModel;
import com.aski.IA.repository.ConversaRepository;
import com.aski.IA.repository.MensagemRepository;
import com.aski.IA.repository.UserRepository;

/**
 * Histórico do Ask IA: salva cada pergunta/resposta e lista as conversas do aluno.
 *
 * Regra de ouro: TODA busca passa pelo id do usuário logado. Conversa de outra
 * pessoa responde 404 (igual a "não existe"), como já é feito em Matéria.
 *
 * Quando o endpoint da IA existir (ex.: POST /api/ia/perguntar), ele deve chamar
 * registrarInteracao() logo depois de receber a resposta do modelo.
 */
@Service
public class ConversaService {

    static final int TAMANHO_MAXIMO_PAGINA = 50;
    private static final int TAMANHO_MAXIMO_PERGUNTA = 4000;
    private static final int TAMANHO_TITULO = 42;

    private final ConversaRepository conversaRepository;
    private final MensagemRepository mensagemRepository;
    private final UserRepository userRepository;

    public ConversaService(ConversaRepository conversaRepository,
                           MensagemRepository mensagemRepository,
                           UserRepository userRepository) {
        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
        this.userRepository = userRepository;
    }

    // ---------- leitura ----------

    /** Conversas do usuário, da mais recente para a mais antiga. `pagina` começa em 0. */
    @Transactional(readOnly = true)
    public PaginaDTO<ConversaResumoDTO> listar(Long usuarioId, int pagina, int tamanho) {
        int paginaSegura = Math.max(pagina, 0);
        int tamanhoSeguro = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO_PAGINA);

        Pageable pageable = PageRequest.of(paginaSegura, tamanhoSeguro,
                Sort.by(Sort.Order.desc("atualizadaEm"), Sort.Order.desc("id")));
        Page<ConversaModel> resultado = conversaRepository.findByUsuarioId(usuarioId, pageable);

        List<ConversaResumoDTO> itens = resultado.getContent().stream().map(this::paraResumo).toList();
        return new PaginaDTO<>(itens, resultado.getNumber(), resultado.getSize(),
                resultado.getTotalElements(), resultado.getTotalPages(), resultado.isLast());
    }

    @Transactional(readOnly = true)
    public ConversaDetalheDTO detalhar(Long usuarioId, Long conversaId) {
        ConversaModel conversa = buscarDoUsuario(usuarioId, conversaId);
        List<MensagemResponseDTO> mensagens = mensagemRepository.findByConversaIdOrderByIdAsc(conversa.getId())
                .stream()
                .map(this::paraDTO)
                .toList();
        return new ConversaDetalheDTO(conversa.getId(), conversa.getTitulo(), minusculo(conversa.getArea()),
                iso(conversa.getCriadaEm()), iso(conversa.getAtualizadaEm()), mensagens);
    }

    // ---------- escrita ----------

    /**
     * Salva a pergunta do aluno e a resposta da IA na conversa indicada (ou numa
     * conversa nova, se conversaId for nulo). As duas mensagens são gravadas na
     * mesma transação: nunca sobra pergunta sem resposta.
     */
    @Transactional
    public ConversaResumoDTO registrarInteracao(Long usuarioId, InteracaoRequestDTO dto) {
        String pergunta = exigirTexto(dto.pergunta(), "Informe a pergunta.");
        if (pergunta.length() > TAMANHO_MAXIMO_PERGUNTA) {
            throw new IllegalArgumentException("A pergunta é longa demais.");
        }
        ModoAjuda modo = converter(ModoAjuda.class, dto.modo(), "Modo inválido.");
        RespostaIaDTO resposta = validarResposta(dto.resposta());
        AreaEnem area = resposta.area() == null || resposta.area().isBlank()
                ? null
                : converter(AreaEnem.class, resposta.area(), "Área inválida.");

        ConversaModel conversa = dto.conversaId() == null
                ? novaConversa(usuarioId, pergunta)
                : buscarDoUsuario(usuarioId, dto.conversaId());

        List<PassoResposta> passos = resposta.passos().stream()
                .map(p -> new PassoResposta(p.titulo().trim(), p.conteudo().trim(), textoOuNulo(p.formula())))
                .toList();
        TenteVoceDTO tente = resposta.tenteVoce();

        mensagemRepository.save(MensagemModel.doAluno(conversa, modo, pergunta));
        mensagemRepository.save(MensagemModel.daIa(conversa, modo, textoOuNulo(resposta.topico()), passos,
                tente == null ? null : textoOuNulo(tente.pergunta()),
                tente == null ? null : textoOuNulo(tente.resposta())));

        conversa.setAtualizadaEm(LocalDateTime.now());
        if (conversa.getArea() == null && area != null) {
            conversa.setArea(area); // a conversa fica com a primeira área identificada
        }
        return paraResumo(conversaRepository.save(conversa));
    }

    // ---------- auxiliares ----------

    private ConversaModel novaConversa(Long usuarioId, String pergunta) {
        UserModel usuario = userRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
        return conversaRepository.save(new ConversaModel(usuario, resumirTitulo(pergunta)));
    }

    /** Toda busca de conversa passa por aqui: id + dono. */
    private ConversaModel buscarDoUsuario(Long usuarioId, Long conversaId) {
        return conversaRepository.findByIdAndUsuarioId(conversaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Conversa não encontrada."));
    }

    private RespostaIaDTO validarResposta(RespostaIaDTO resposta) {
        if (resposta == null || resposta.passos() == null || resposta.passos().isEmpty()) {
            throw new IllegalArgumentException("A resposta da IA precisa ter ao menos um passo.");
        }
        for (PassoDTO passo : resposta.passos()) {
            if (passo == null || passo.titulo() == null || passo.titulo().isBlank()
                    || passo.conteudo() == null || passo.conteudo().isBlank()) {
                throw new IllegalArgumentException("Todo passo precisa de título e conteúdo.");
            }
        }
        return resposta;
    }

    private ConversaResumoDTO paraResumo(ConversaModel c) {
        return new ConversaResumoDTO(c.getId(), c.getTitulo(), minusculo(c.getArea()),
                iso(c.getCriadaEm()), iso(c.getAtualizadaEm()));
    }

    private MensagemResponseDTO paraDTO(MensagemModel m) {
        boolean daIa = m.getAutor() == AutorMensagem.IA;
        List<PassoDTO> passos = m.getPassos().stream()
                .map(p -> new PassoDTO(p.getTitulo(), p.getConteudo(), p.getFormula()))
                .toList();
        boolean temTente = m.getTenteVocePergunta() != null || m.getTenteVoceResposta() != null;
        TenteVoceDTO tente = temTente ? new TenteVoceDTO(m.getTenteVocePergunta(), m.getTenteVoceResposta()) : null;

        return new MensagemResponseDTO(m.getId(), daIa ? "ia" : "aluno", minusculo(m.getModo()),
                m.getTexto(), m.getTopico(), passos, tente, iso(m.getCriadaEm()));
    }

    /**
     * Data com fuso (ex.: 2026-09-29T22:38:23Z). O banco guarda LocalDateTime, sem fuso;
     * se saísse assim, o navegador leria a hora do servidor (UTC no Docker) como hora local
     * e "agora" apareceria 3 horas no futuro para quem está no Brasil.
     */
    static String iso(LocalDateTime data) {
        return data.atZone(ZoneId.systemDefault()).toOffsetDateTime().toString();
    }

    /** Mesma regra do frontend: junta espaços e corta em ~42 caracteres com reticências. */
    static String resumirTitulo(String pergunta) {
        String limpo = pergunta.replaceAll("\\s+", " ").trim();
        return limpo.length() > TAMANHO_TITULO
                ? limpo.substring(0, TAMANHO_TITULO - 2).stripTrailing() + "…"
                : limpo;
    }

    private static <E extends Enum<E>> E converter(Class<E> tipo, String valor, String mensagem) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(mensagem);
        }
        try {
            return Enum.valueOf(tipo, valor.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(mensagem);
        }
    }

    private static String minusculo(Enum<?> valor) {
        return valor == null ? null : valor.name().toLowerCase(Locale.ROOT);
    }

    private static String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private static String exigirTexto(String valor, String mensagemSeVazio) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(mensagemSeVazio);
        }
        return valor.trim();
    }
}
