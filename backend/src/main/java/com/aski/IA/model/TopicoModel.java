package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Tópico dentro de uma matéria (ex.: "Função Afim"), marcável como concluído. */
@Entity
@Table(name = "tb_topicos")
@Getter
@Setter
@NoArgsConstructor
public class TopicoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false)
    private boolean concluido = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materia_id", nullable = false)
    private MateriaModel materia;

    public TopicoModel(String nome, MateriaModel materia) {
        this.nome = nome;
        this.materia = materia;
    }
}
