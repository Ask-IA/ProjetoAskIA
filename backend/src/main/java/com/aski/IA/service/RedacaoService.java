package com.aski.IA.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.aski.IA.dto.CompetenciaAvaliadaDTO;
import com.aski.IA.dto.CompetenciaCorrigidaDTO;
import com.aski.IA.dto.CorrecaoGeradaDTO;
import com.aski.IA.dto.CorrecaoRedacaoDTO;
import com.aski.IA.dto.CorrigirRedacaoRequestDTO;
import com.aski.IA.dto.CotaDTO;
import com.aski.IA.exception.IaIndisponivelException;
import com.aski.IA.exception.LimiteDiarioExcedidoException;

/**
 * Corretor de redação no modelo do ENEM (5 competências, 0 a 1000).
 *
 * Decisões de escopo (versão 1):
 * - Nada é gravado no banco: cada correção é uma chamada nova à IA, como flashcards e quiz.
 *   Assim não há tabela nova nem mudança de schema. Histórico de redações fica para depois.
 * - Limite próprio, separado da cota de perguntas do Ask IA: corrigir redação é a chamada
 *   mais cara do app (texto longo entrando e saindo). O contador fica EM MEMÓRIA e volta a
 *   zero quando o backend reinicia — aceitável para o TCC; se virar problema, vira tabela.
 * - Só conta a correção que DEU CERTO: se a IA falhar, o aluno não perde a tentativa.
 * - Tudo que dá para validar sem IA é validado ANTES de chamar a IA (tamanho mínimo e máximo),
 *   para não pagar chamada de API por um pedido que seria recusado de qualquer jeito.
 * - A nota total é somada AQUI, e cada nota é conferida (só 0, 40, 80, 120, 160 ou 200):
 *   o número exibido ao aluno nunca é um número que a IA "inventou".
 */
@Service
public class RedacaoService {

    private static final int TAMANHO_MAXIMO_TEMA = 300;
    private static final int TAMANHO_MINIMO_TEMA = 5;
    private static final int TAMANHO_MAXIMO_TEXTO = 5000;
    /** Aproximação de "até 7 linhas" da folha do ENEM, que já zera a redação. */
    private static final int MINIMO_DE_PALAVRAS = 80;

    private static final Map<Integer, String> NOMES = Map.of(
            1, "Domínio da norma padrão",
            2, "Compreensão do tema e repertório",
            3, "Argumentação e organização das ideias",
            4, "Coesão do texto",
            5, "Proposta de intervenção");

    private final IaService iaService;
    private final int limiteDiario;
    private final ZoneId fuso;

    /** usuário → (dia, quantas correções deram certo nesse dia). */
    private final Map<Long, UsoDoDia> usoPorUsuario = new ConcurrentHashMap<>();

    public RedacaoService(IaService iaService,
                          @Value("${app.redacao.limite-diario:3}") int limiteDiario,
                          @Value("${app.ia.fuso:America/Sao_Paulo}") String fuso) {
        this.iaService = iaService;
        this.limiteDiario = limiteDiario;
        this.fuso = ZoneId.of(fuso);
    }

    public CotaDTO cota(Long usuarioId) {
        int usadas = usadasHoje(usuarioId);
        return new CotaDTO(limiteDiario, usadas, Math.max(limiteDiario - usadas, 0));
    }

    public CorrecaoRedacaoDTO corrigir(Long usuarioId, CorrigirRedacaoRequestDTO dto) {
        // 1) Validação barata, antes de qualquer chamada paga.
        String tema = dto == null || dto.tema() == null ? "" : dto.tema().trim();
        String texto = dto == null || dto.texto() == null ? "" : dto.texto().trim();

        if (tema.length() < TAMANHO_MINIMO_TEMA) {
            throw new IllegalArgumentException("Informe o tema da redação.");
        }
        if (tema.length() > TAMANHO_MAXIMO_TEMA) {
            throw new IllegalArgumentException("O tema passou de " + TAMANHO_MAXIMO_TEMA + " caracteres.");
        }
        if (texto.length() > TAMANHO_MAXIMO_TEXTO) {
            throw new IllegalArgumentException("A redação passou de " + TAMANHO_MAXIMO_TEXTO
                    + " caracteres, bem mais que as 30 linhas da folha do ENEM.");
        }
        int palavras = contarPalavras(texto);
        if (palavras < MINIMO_DE_PALAVRAS) {
            throw new IllegalArgumentException("Sua redação tem " + palavras + " palavras. No ENEM, texto com até "
                    + "7 linhas recebe nota zero — escreva pelo menos umas " + MINIMO_DE_PALAVRAS
                    + " palavras antes de corrigir.");
        }

        // 2) Limite do dia, também antes de chamar a IA.
        if (usadasHoje(usuarioId) >= limiteDiario) {
            throw new LimiteDiarioExcedidoException("Você já usou as " + limiteDiario
                    + " correções de redação de hoje. Elas voltam à meia-noite.");
        }

        // 3) IA. Se falhar, IaIndisponivelException sobe (503) e a tentativa NÃO é contada.
        CorrecaoGeradaDTO bruta = iaService.corrigirRedacao(tema, texto);
        List<CompetenciaCorrigidaDTO> competencias = conferir(bruta);

        // 4) Só agora conta a correção — ela deu certo.
        int usadas = registrarUso(usuarioId);

        int total = competencias.stream().mapToInt(CompetenciaCorrigidaDTO::nota).sum();
        return new CorrecaoRedacaoDTO(total, competencias, textoOuNulo(bruta.comentarioGeral()),
                textoOuNulo(bruta.motivoNotaZero()), Math.max(limiteDiario - usadas, 0));
    }

    // ---------- conferência do que a IA devolveu ----------

    /**
     * Garante exatamente as competências 1 a 5, cada nota em {0, 40, ..., 200} (arredonda para o
     * valor válido mais próximo) e zera tudo quando a IA apontou motivo de nota zero.
     */
    private List<CompetenciaCorrigidaDTO> conferir(CorrecaoGeradaDTO bruta) {
        Map<Integer, CompetenciaAvaliadaDTO> porNumero = new HashMap<>();
        for (CompetenciaAvaliadaDTO c : bruta.competencias()) {
            if (c != null && c.numero() >= 1 && c.numero() <= 5) {
                porNumero.putIfAbsent(c.numero(), c);
            }
        }
        if (porNumero.size() != 5) {
            throw new IaIndisponivelException("A IA devolveu a correção incompleta. Tente novamente.");
        }

        boolean zerada = textoOuNulo(bruta.motivoNotaZero()) != null;
        List<CompetenciaCorrigidaDTO> resultado = new ArrayList<>();
        for (int numero = 1; numero <= 5; numero++) {
            CompetenciaAvaliadaDTO c = porNumero.get(numero);
            int nota = zerada ? 0 : notaValida(c.nota());
            resultado.add(new CompetenciaCorrigidaDTO(numero, NOMES.get(numero), nota,
                    textoOuNulo(c.comentario()), textoOuNulo(c.comoMelhorar())));
        }
        return resultado;
    }

    /** 0 a 200, de 40 em 40 — a escala oficial de cada competência. */
    private int notaValida(int nota) {
        int limitada = Math.max(0, Math.min(200, nota));
        return (int) Math.round(limitada / 40.0) * 40;
    }

    // ---------- contador em memória ----------

    private record UsoDoDia(LocalDate dia, int usadas) {
    }

    private int usadasHoje(Long usuarioId) {
        UsoDoDia uso = usoPorUsuario.get(usuarioId);
        return uso != null && uso.dia().equals(hoje()) ? uso.usadas() : 0;
    }

    private int registrarUso(Long usuarioId) {
        LocalDate hoje = hoje();
        UsoDoDia novo = usoPorUsuario.compute(usuarioId, (id, atual) ->
                atual != null && atual.dia().equals(hoje)
                        ? new UsoDoDia(hoje, atual.usadas() + 1)
                        : new UsoDoDia(hoje, 1));
        return novo.usadas();
    }

    private LocalDate hoje() {
        return LocalDate.now(fuso);
    }

    // ---------- auxiliares ----------

    private static int contarPalavras(String texto) {
        String limpo = texto.trim();
        return limpo.isEmpty() ? 0 : limpo.split("\\s+").length;
    }

    private static String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
