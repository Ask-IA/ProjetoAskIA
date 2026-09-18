package com.aski.IA.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.MetaRequestDTO;
import com.aski.IA.dto.MetaResponseDTO;
import com.aski.IA.dto.SessaoRequestDTO;
import com.aski.IA.dto.SessaoResponseDTO;
import com.aski.IA.exception.RecursoNaoEncontradoException;
import com.aski.IA.model.MateriaModel;
import com.aski.IA.model.MetaEstudoModel;
import com.aski.IA.model.SessaoEstudoModel;
import com.aski.IA.model.UserModel;
import com.aski.IA.repository.MetaEstudoRepository;
import com.aski.IA.repository.SessaoEstudoRepository;
import com.aski.IA.repository.UserRepository;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class CronogramaService {

    private static final List<String> DIAS_VALIDOS = List.of(
            "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado");

    private static final Pattern HORA_HH_MM = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

    private final MetaEstudoRepository metaRepository;
    private final SessaoEstudoRepository sessaoRepository;
    private final UserRepository userRepository;
    private final MateriaService materiaService;

    public CronogramaService(MetaEstudoRepository metaRepository,
                             SessaoEstudoRepository sessaoRepository,
                             UserRepository userRepository,
                             MateriaService materiaService) {
        this.metaRepository = metaRepository;
        this.sessaoRepository = sessaoRepository;
        this.userRepository = userRepository;
        this.materiaService = materiaService;
    }

    // ---------- Metas ----------

    @Transactional(readOnly = true)
    public List<MetaResponseDTO> listarMetas(Long usuarioId) {
        return metaRepository.findByUsuarioIdOrderByIdAsc(usuarioId)
                .stream()
                .map(this::paraDTO)
                .toList();
    }

    @Transactional
    public MetaResponseDTO criarMeta(Long usuarioId, MetaRequestDTO dto) {
        if (dto.materiaId() == null) {
            throw new IllegalArgumentException("Selecione uma matéria.");
        }
        if (dto.dia() == null || !DIAS_VALIDOS.contains(dto.dia())) {
            throw new IllegalArgumentException("Dia da semana inválido.");
        }
        if (dto.hora() == null || !HORA_HH_MM.matcher(dto.hora()).matches()) {
            throw new IllegalArgumentException("Hora inválida. Use o formato HH:mm.");
        }

        UserModel usuario = buscarUsuario(usuarioId);
        MateriaModel materia = materiaService.buscarDoUsuario(usuarioId, dto.materiaId());
        String descricao = (dto.descricao() == null || dto.descricao().isBlank()) ? null : dto.descricao().trim();

        MetaEstudoModel salva = metaRepository.save(
                new MetaEstudoModel(usuario, materia, dto.dia(), dto.hora(), descricao));
        return paraDTO(salva);
    }

    @Transactional
    public void removerMeta(Long usuarioId, Long metaId) {
        MetaEstudoModel meta = metaRepository.findByIdAndUsuarioId(metaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Meta não encontrada."));
        metaRepository.delete(meta);
    }

    // ---------- Sessões de estudo ----------

    @Transactional(readOnly = true)
    public List<SessaoResponseDTO> listarSessoes(Long usuarioId) {
        return sessaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId)
                .stream()
                .map(this::paraDTO)
                .toList();
    }

    @Transactional
    public SessaoResponseDTO registrarSessao(Long usuarioId, SessaoRequestDTO dto) {
        if (dto.materiaId() == null) {
            throw new IllegalArgumentException("Selecione uma matéria.");
        }
        if (dto.minutos() <= 0) {
            throw new IllegalArgumentException("Os minutos estudados precisam ser maiores que zero.");
        }

        UserModel usuario = buscarUsuario(usuarioId);
        MateriaModel materia = materiaService.buscarDoUsuario(usuarioId, dto.materiaId());
        String anotacoes = (dto.anotacoes() == null || dto.anotacoes().isBlank()) ? null : dto.anotacoes().trim();

        SessaoEstudoModel salva = sessaoRepository.save(
                new SessaoEstudoModel(usuario, materia, dto.minutos(), anotacoes));
        return paraDTO(salva);
    }

    // ---------- auxiliares ----------

    private UserModel buscarUsuario(Long usuarioId) {
        return userRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }

    private MetaResponseDTO paraDTO(MetaEstudoModel m) {
        return new MetaResponseDTO(m.getId(), m.getMateria().getId(), m.getDia(), m.getHora(), m.getDescricao());
    }

    private SessaoResponseDTO paraDTO(SessaoEstudoModel s) {
        return new SessaoResponseDTO(
                s.getId(), s.getMateria().getId(), s.getMinutos(), s.getAnotacoes(), s.getData().toString());
    }
}
