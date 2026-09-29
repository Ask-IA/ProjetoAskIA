package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Conversa do Ask IA: agrupa as perguntas e respostas de um aluno sobre um assunto.
 * Pertence a UM usuário — toda consulta filtra por usuario_id, então ninguém vê a
 * conversa de outra pessoa.
 *
 * As mensagens NÃO ficam numa lista aqui de propósito: são buscadas pelo
 * MensagemRepository, para a listagem de conversas não carregar todo o conteúdo.
 */
@Entity
@Table(name = "tb_conversas")
@Getter
@Setter
@NoArgsConstructor
public class ConversaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    @Column(nullable = false, length = 100)
    private String titulo;

    /** Área do ENEM identificada pela IA. Fica nula até a primeira resposta que a informe. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AreaEnem area;

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    /** Atualizada a cada nova pergunta: é o que ordena "Conversas recentes". */
    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    public ConversaModel(UserModel usuario, String titulo) {
        this.usuario = usuario;
        this.titulo = titulo;
        this.criadaEm = LocalDateTime.now();
        this.atualizadaEm = this.criadaEm;
    }
}
