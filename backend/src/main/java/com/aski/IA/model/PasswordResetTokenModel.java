package com.aski.IA.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Pedido de redefinição de senha ("esqueci minha senha").
 *
 * tokenHash é o SHA-256 do token que vai por e-mail — o valor puro NUNCA é
 * gravado no banco, só o hash. Assim, mesmo quem tiver acesso de leitura ao
 * banco não consegue, sozinho, redefinir a senha de ninguém.
 *
 * Uso único: a linha é apagada assim que a senha é redefinida (ou quando o
 * aluno pede um novo link, que invalida o anterior — ver PasswordResetService).
 */
@Entity
@Table(name = "tb_tokens_redefinicao_senha")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetTokenModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private UserModel usuario;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    public PasswordResetTokenModel(UserModel usuario, String tokenHash, LocalDateTime expiraEm) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
        this.criadoEm = LocalDateTime.now();
    }
}
