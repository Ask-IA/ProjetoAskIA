package com.aski.IA.service;

import com.aski.IA.dto.FlashcardBancoDTO;
import com.aski.IA.dto.QuestaoBancoDTO;
import com.aski.IA.model.BancoFlashcardModel;
import com.aski.IA.model.BancoQuestaoModel;
import com.aski.IA.repository.BancoFlashcardRepository;
import com.aski.IA.repository.BancoQuestaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Banco de questões e flashcards curados pela equipe (sem IA). Existe para
 * o Quiz IA e os Flashcards funcionarem mesmo com a IA fora do ar, sem
 * chave configurada, ou com a cota do dia esgotada — hoje essas duas telas
 * (e o Ask IA) são o único conteúdo de estudo do produto, e dependem 100%
 * de uma chamada paga a um provedor externo. Ver db/06_banco_conteudo.sql.
 *
 * O filtro por matéria normaliza acento e caixa (mesma técnica de
 * areas.ts no frontend): o aluno pode ter cadastrado "Matematica" sem
 * acento, e ainda assim precisa achar o banco de "Matemática".
 */
@Service
public class BancoConteudoService {

    private static final Pattern DIACRITICOS = Pattern.compile("\\p{M}");

    private final BancoQuestaoRepository questaoRepository;
    private final BancoFlashcardRepository flashcardRepository;

    public BancoConteudoService(BancoQuestaoRepository questaoRepository,
                                BancoFlashcardRepository flashcardRepository) {
        this.questaoRepository = questaoRepository;
        this.flashcardRepository = flashcardRepository;
    }

    @Transactional(readOnly = true)
    public List<QuestaoBancoDTO> questoesPorMateria(String materia) {
        String chave = normalizar(materia);
        return questaoRepository.findAll().stream()
                .filter(q -> normalizar(q.getMateria()).equals(chave))
                .map(this::paraDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardBancoDTO> flashcardsPorMateria(String materia) {
        String chave = normalizar(materia);
        return flashcardRepository.findAll().stream()
                .filter(f -> normalizar(f.getMateria()).equals(chave))
                .map(f -> new FlashcardBancoDTO(f.getMateria(), f.getFrente(), f.getVerso()))
                .toList();
    }

    private QuestaoBancoDTO paraDTO(BancoQuestaoModel q) {
        List<String> alternativas = List.of(q.getAlternativaA(), q.getAlternativaB(), q.getAlternativaC(), q.getAlternativaD());
        int indiceCorreta = "ABCD".indexOf(q.getCorreta().trim().toUpperCase());
        return new QuestaoBancoDTO(q.getEnunciado(), alternativas, Math.max(indiceCorreta, 0), q.getExplicacao());
    }

    private static String normalizar(String texto) {
        if (texto == null) return "";
        String semAcento = DIACRITICOS.matcher(Normalizer.normalize(texto, Normalizer.Form.NFD)).replaceAll("");
        return semAcento.toLowerCase().trim();
    }
}
