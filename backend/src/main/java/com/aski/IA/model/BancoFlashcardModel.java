package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Flashcard curado pela equipe (não gerado por IA), guardado em
 * tb_banco_flashcards (ver db/06_banco_conteudo.sql). É o que permite a
 * tela de Flashcards funcionar mesmo sem nenhuma chave de IA configurada.
 */
@Entity
@Table(name = "tb_banco_flashcards")
@Getter
@Setter
@NoArgsConstructor
public class BancoFlashcardModel {

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
    private String frente;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String verso;
}
