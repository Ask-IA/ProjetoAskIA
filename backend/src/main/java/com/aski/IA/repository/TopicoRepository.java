package com.aski.IA.repository;

import com.aski.IA.model.TopicoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TopicoRepository extends JpaRepository<TopicoModel, Long> {

    Optional<TopicoModel> findByIdAndMateriaId(Long id, Long materiaId);

    /** Quantos tópicos concluídos o usuário tem, somando todas as matérias — usado no cálculo de XP. */
    @Query("select count(t) from TopicoModel t where t.materia.usuario.id = :usuarioId and t.concluido = true")
    long contarConcluidosDoUsuario(@Param("usuarioId") Long usuarioId);
}
