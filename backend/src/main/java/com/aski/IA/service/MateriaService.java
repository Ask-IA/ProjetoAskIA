package com.aski.IA.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.MateriaRequestDTO;
import com.aski.IA.dto.MateriaResponseDTO;
import com.aski.IA.dto.TopicoRequestDTO;
import com.aski.IA.dto.TopicoResponseDTO;
import com.aski.IA.exception.RecursoNaoEncontradoException;
import com.aski.IA.model.MateriaModel;
import com.aski.IA.model.TopicoModel;
import com.aski.IA.model.UserModel;
import com.aski.IA.repository.MateriaRepository;
import com.aski.IA.repository.TopicoRepository;
import com.aski.IA.repository.UserRepository;

import java.util.List;

@Service
public class MateriaService {

    /** Mesma paleta usada pelo frontend nos mocks — a cor é escolhida em rodízio. */
    private static final List<String> CORES = List.of(
            "#1D4ED8", "#DC2626", "#16A34A", "#F59E0B", "#7C3AED", "#0891B2");

    private final MateriaRepository materiaRepository;
    private final TopicoRepository topicoRepository;
    private final UserRepository userRepository;

    public MateriaService(MateriaRepository materiaRepository,
                          TopicoRepository topicoRepository,
                          UserRepository userRepository) {
        this.materiaRepository = materiaRepository;
        this.topicoRepository = topicoRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MateriaResponseDTO> listar(Long usuarioId) {
        return materiaRepository.findByUsuarioIdOrderByIdAsc(usuarioId)
                .stream()
                .map(this::paraDTO)
                .toList();
    }

    @Transactional
    public MateriaResponseDTO criar(Long usuarioId, MateriaRequestDTO dto) {
        String nome = exigirTexto(dto.nome(), "Informe o nome da matéria.");

        UserModel usuario = userRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        long quantidade = materiaRepository.countByUsuarioId(usuarioId);
        String cor = CORES.get((int) (quantidade % CORES.size()));

        MateriaModel salva = materiaRepository.save(new MateriaModel(nome, cor, usuario));
        return paraDTO(salva);
    }

    @Transactional
    public TopicoResponseDTO adicionarTopico(Long usuarioId, Long materiaId, TopicoRequestDTO dto) {
        String nome = exigirTexto(dto.nome(), "Informe o nome do tópico.");
        MateriaModel materia = buscarDoUsuario(usuarioId, materiaId);

        TopicoModel salvo = topicoRepository.save(new TopicoModel(nome, materia));
        return new TopicoResponseDTO(salvo.getId(), salvo.getNome(), salvo.isConcluido());
    }

    /** Marca/desmarca o tópico como concluído. */
    @Transactional
    public void alternarTopico(Long usuarioId, Long materiaId, Long topicoId) {
        buscarDoUsuario(usuarioId, materiaId); // garante que a matéria é do usuário
        TopicoModel topico = topicoRepository.findByIdAndMateriaId(topicoId, materiaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Tópico não encontrado."));
        topico.setConcluido(!topico.isConcluido());
    }

    @Transactional
    public void removerTopico(Long usuarioId, Long materiaId, Long topicoId) {
        buscarDoUsuario(usuarioId, materiaId);
        TopicoModel topico = topicoRepository.findByIdAndMateriaId(topicoId, materiaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Tópico não encontrado."));
        topicoRepository.delete(topico);
    }

    /** Toda busca de matéria passa por aqui: id + dono. Sem isso, um usuário poderia ler a matéria de outro. */
    MateriaModel buscarDoUsuario(Long usuarioId, Long materiaId) {
        return materiaRepository.findByIdAndUsuarioId(materiaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Matéria não encontrada."));
    }

    private MateriaResponseDTO paraDTO(MateriaModel m) {
        List<TopicoResponseDTO> topicos = m.getTopicos().stream()
                .map(t -> new TopicoResponseDTO(t.getId(), t.getNome(), t.isConcluido()))
                .toList();
        return new MateriaResponseDTO(m.getId(), m.getNome(), m.getCor(), topicos);
    }

    private static String exigirTexto(String valor, String mensagemSeVazio) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException(mensagemSeVazio);
        }
        return valor.trim();
    }
}
