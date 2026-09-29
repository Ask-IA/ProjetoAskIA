package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Uma mensagem da conversa. Cada pergunta gera DUAS linhas: a do aluno e a da IA.
 *
 * - ALUNO: usa só `texto` (a pergunta).
 * - IA: usa `topico`, `passos` e "tente você" (a resposta estruturada).
 *
 * A resposta é guardada em colunas normais (e não num JSON) para dar para
 * consultar por SQL — por exemplo, "quais tópicos o aluno mais perguntou".
 */
@Entity
@Table(name = "tb_mensagens")
@Getter
@Setter
@NoArgsConstructor
public class MensagemModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private ConversaModel conversa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AutorMensagem autor;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private ModoAjuda modo;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(length = 100)
    private String topico;

    @ElementCollection
    @CollectionTable(name = "tb_mensagem_passos", joinColumns = @JoinColumn(name = "mensagem_id"))
    @OrderColumn(name = "ordem")
    private List<PassoResposta> passos = new ArrayList<>();

    @Column(name = "tente_voce_pergunta", columnDefinition = "TEXT")
    private String tenteVocePergunta;

    @Column(name = "tente_voce_resposta", columnDefinition = "TEXT")
    private String tenteVoceResposta;

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    public static MensagemModel doAluno(ConversaModel conversa, ModoAjuda modo, String pergunta) {
        MensagemModel m = new MensagemModel();
        m.conversa = conversa;
        m.autor = AutorMensagem.ALUNO;
        m.modo = modo;
        m.texto = pergunta;
        m.criadaEm = LocalDateTime.now();
        return m;
    }

    public static MensagemModel daIa(ConversaModel conversa, ModoAjuda modo, String topico,
                                     List<PassoResposta> passos,
                                     String tenteVocePergunta, String tenteVoceResposta) {
        MensagemModel m = new MensagemModel();
        m.conversa = conversa;
        m.autor = AutorMensagem.IA;
        m.modo = modo;
        m.topico = topico;
        m.passos = new ArrayList<>(passos);
        m.tenteVocePergunta = tenteVocePergunta;
        m.tenteVoceResposta = tenteVoceResposta;
        m.criadaEm = LocalDateTime.now();
        return m;
    }
}
