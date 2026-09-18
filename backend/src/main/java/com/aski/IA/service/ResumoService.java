package com.aski.IA.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.dto.DesempenhoMateriaDTO;
import com.aski.IA.dto.ProgressoDTO;
import com.aski.IA.dto.ResumoPainelDTO;
import com.aski.IA.dto.ResumoPainelDTO.DesempenhoResumoDTO;
import com.aski.IA.dto.ResumoPainelDTO.MinutosDiaDTO;
import com.aski.IA.model.MateriaModel;
import com.aski.IA.model.SessaoEstudoModel;
import com.aski.IA.model.TopicoModel;
import com.aski.IA.repository.MateriaRepository;
import com.aski.IA.repository.SessaoEstudoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Calcula os números do Painel e do Progresso a partir das sessões de estudo
 * e dos tópicos do usuário. É a mesma lógica que existia no mock do frontend
 * (estudos.service.ts) — só que agora com dados reais, do lado do servidor.
 */
@Service
public class ResumoService {

    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");

    private final MateriaRepository materiaRepository;
    private final SessaoEstudoRepository sessaoRepository;

    public ResumoService(MateriaRepository materiaRepository, SessaoEstudoRepository sessaoRepository) {
        this.materiaRepository = materiaRepository;
        this.sessaoRepository = sessaoRepository;
    }

    @Transactional(readOnly = true)
    public ResumoPainelDTO painel(Long usuarioId) {
        List<MateriaModel> materias = materiaRepository.findByUsuarioIdOrderByIdAsc(usuarioId);
        List<SessaoEstudoModel> sessoes = sessaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId);

        int minutosTotais = sessoes.stream().mapToInt(SessaoEstudoModel::getMinutos).sum();

        LocalDateTime seteDiasAtras = LocalDate.now().minusDays(7).atStartOfDay();
        int minutosSemana = sessoes.stream()
                .filter(s -> !s.getData().isBefore(seteDiasAtras))
                .mapToInt(SessaoEstudoModel::getMinutos)
                .sum();

        int topicosConcluidos = (int) materias.stream()
                .flatMap(m -> m.getTopicos().stream())
                .filter(TopicoModel::isConcluido)
                .count();

        List<DesempenhoMateriaDTO> ordenado = new ArrayList<>(desempenhos(materias, sessoes));
        ordenado.sort(Comparator.comparingInt(DesempenhoMateriaDTO::percentual).reversed());

        DesempenhoResumoDTO maior = ordenado.isEmpty() ? null
                : new DesempenhoResumoDTO(ordenado.get(0).materia(), ordenado.get(0).percentual());
        DesempenhoResumoDTO menor = ordenado.size() < 2 ? null
                : new DesempenhoResumoDTO(
                        ordenado.get(ordenado.size() - 1).materia(),
                        ordenado.get(ordenado.size() - 1).percentual());

        return new ResumoPainelDTO(
                minutosTotais,
                minutosSemana,
                topicosConcluidos,
                materias.size(),
                minutosUltimos7Dias(sessoes),
                maior,
                menor);
    }

    @Transactional(readOnly = true)
    public ProgressoDTO progresso(Long usuarioId) {
        List<MateriaModel> materias = materiaRepository.findByUsuarioIdOrderByIdAsc(usuarioId);
        List<SessaoEstudoModel> sessoes = sessaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId);
        return new ProgressoDTO(ofensiva(sessoes), desempenhos(materias, sessoes));
    }

    // ---------- cálculos ----------

    /** % de tópicos concluídos e minutos estudados, por matéria. */
    private List<DesempenhoMateriaDTO> desempenhos(List<MateriaModel> materias, List<SessaoEstudoModel> sessoes) {
        return materias.stream().map(m -> {
            int total = m.getTopicos().size();
            long feitos = m.getTopicos().stream().filter(TopicoModel::isConcluido).count();
            int minutos = sessoes.stream()
                    .filter(s -> s.getMateria().getId().equals(m.getId()))
                    .mapToInt(SessaoEstudoModel::getMinutos)
                    .sum();
            int percentual = total == 0 ? 0 : (int) Math.round(feitos * 100.0 / total);
            return new DesempenhoMateriaDTO(m.getNome(), m.getCor(), percentual, minutos);
        }).toList();
    }

    /** Minutos por dia nos últimos 7 dias, do mais antigo para hoje. */
    private List<MinutosDiaDTO> minutosUltimos7Dias(List<SessaoEstudoModel> sessoes) {
        List<MinutosDiaDTO> resultado = new ArrayList<>();
        LocalDate hoje = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate dia = hoje.minusDays(i);
            int minutos = sessoes.stream()
                    .filter(s -> s.getData().toLocalDate().equals(dia))
                    .mapToInt(SessaoEstudoModel::getMinutos)
                    .sum();
            resultado.add(new MinutosDiaDTO(dia.format(DIA_MES), minutos));
        }
        return resultado;
    }

    /** Dias seguidos com pelo menos uma sessão. Hoje ainda sem sessão não quebra a sequência. */
    private int ofensiva(List<SessaoEstudoModel> sessoes) {
        int dias = 0;
        LocalDate hoje = LocalDate.now();
        for (int i = 0; i < 30; i++) {
            LocalDate dia = hoje.minusDays(i);
            boolean temSessao = sessoes.stream().anyMatch(s -> s.getData().toLocalDate().equals(dia));
            if (temSessao) {
                dias++;
            } else if (i > 0) {
                break;
            }
        }
        return dias;
    }
}
