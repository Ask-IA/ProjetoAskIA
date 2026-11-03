package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Questão de múltipla escolha curada pela equipe (não gerada por IA),
 * guardada em tb_banco_questoes (ver db/06_banco_conteudo.sql). É o que
 * permite o Quiz IA funcionar mesmo sem nenhuma chave de IA configurada.
 */
@Entity
@Table(name = "tb_banco_questoes")
@Getter
@Setter
@NoArgsConstructor
public class BancoQuestaoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String area;

    @Column(nullable = false, length = 100)
    private String materia;

    @Column(length = 150)
    private String topico;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String enunciado;

    @Column(name = "alternativa_a", nullable = false, columnDefinition = "TEXT")
    private String alternativaA;

    @Column(name = "alternativa_b", nullable = false, columnDefinition = "TEXT")
    private String alternativaB;

    @Column(name = "alternativa_c", nullable = false, columnDefinition = "TEXT")
    private String alternativaC;

    @Column(name = "alternativa_d", nullable = false, columnDefinition = "TEXT")
    private String alternativaD;

    /** 'A', 'B', 'C' ou 'D' — qual alternativa é a correta. */
    @Column(nullable = false, length = 1)
    private String correta;

    @Column(columnDefinition = "TEXT")
    private String explicacao;
}
