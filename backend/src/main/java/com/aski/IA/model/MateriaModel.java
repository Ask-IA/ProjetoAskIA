package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Matéria cadastrada pelo aluno (ex.: Matemática), dona dos seus tópicos.
 * Cada matéria pertence a UM usuário — nenhuma consulta pode cruzar usuários.
 */
@Entity
@Table(name = "tb_materias")
@Getter
@Setter
@NoArgsConstructor
public class MateriaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    /** Cor em hexadecimal (#RRGGBB), usada pelo frontend nas pílulas/gráficos. */
    @Column(nullable = false, length = 7)
    private String cor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    /** Apagar a matéria apaga os tópicos (cascade + orphanRemoval). */
    @OneToMany(mappedBy = "materia", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<TopicoModel> topicos = new ArrayList<>();

    public MateriaModel(String nome, String cor, UserModel usuario) {
        this.nome = nome;
        this.cor = cor;
        this.usuario = usuario;
    }
}
