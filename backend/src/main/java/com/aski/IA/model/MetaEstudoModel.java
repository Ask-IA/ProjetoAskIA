package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Meta do cronograma semanal: "estudar Matemática na Segunda às 19:00".
 * O dia é guardado como texto ("Segunda", "Terça"...) exatamente como o
 * frontend envia, e a hora no formato HH:mm.
 */
@Entity
@Table(name = "tb_metas_estudo")
@Getter
@Setter
@NoArgsConstructor
public class MetaEstudoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materia_id", nullable = false)
    private MateriaModel materia;

    @Column(nullable = false, length = 10)
    private String dia;

    @Column(nullable = false, length = 5)
    private String hora;

    @Column(length = 200)
    private String descricao;

    public MetaEstudoModel(UserModel usuario, MateriaModel materia, String dia, String hora, String descricao) {
        this.usuario = usuario;
        this.materia = materia;
        this.dia = dia;
        this.hora = hora;
        this.descricao = descricao;
    }
}
