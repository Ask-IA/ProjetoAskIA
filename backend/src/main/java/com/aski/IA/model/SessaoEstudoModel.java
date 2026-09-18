package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Sessão de estudo registrada pelo aluno ("estudei 30 min de Português").
 * É a base de TODOS os números do Painel e do Progresso (tempo total,
 * semana, minutos por dia, ofensiva).
 */
@Entity
@Table(name = "tb_sessoes_estudo")
@Getter
@Setter
@NoArgsConstructor
public class SessaoEstudoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materia_id", nullable = false)
    private MateriaModel materia;

    @Column(nullable = false)
    private int minutos;

    @Column(length = 300)
    private String anotacoes;

    @Column(nullable = false)
    private LocalDateTime data;

    public SessaoEstudoModel(UserModel usuario, MateriaModel materia, int minutos, String anotacoes) {
        this.usuario = usuario;
        this.materia = materia;
        this.minutos = minutos;
        this.anotacoes = anotacoes;
        this.data = LocalDateTime.now();
    }
}
