package com.aski.IA.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aski.IA.model.PasswordResetTokenModel;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenModel, Long> {

    Optional<PasswordResetTokenModel> findByTokenHash(String tokenHash);

    /** Apaga qualquer token anterior do usuário: só o último pedido de redefinição vale. */
    void deleteByUsuarioId(Long usuarioId);
}
