package com.aski.IA.repository;

import com.aski.IA.model.ConversaModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversaRepository extends JpaRepository<ConversaModel, Long> {

    /** Só as conversas do usuário, já paginadas (a ordenação vem no Pageable). */
    Page<ConversaModel> findByUsuarioId(Long usuarioId, Pageable pageable);

    /** Busca que já garante o dono — evita que um usuário abra a conversa de outro. */
    Optional<ConversaModel> findByIdAndUsuarioId(Long id, Long usuarioId);
}
