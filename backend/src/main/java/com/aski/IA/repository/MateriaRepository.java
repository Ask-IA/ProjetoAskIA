package com.aski.IA.repository;

import com.aski.IA.model.MateriaModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MateriaRepository extends JpaRepository<MateriaModel, Long> {

    List<MateriaModel> findByUsuarioIdOrderByIdAsc(Long usuarioId);

    /** Busca que já garante que a matéria é do usuário — evita acesso cruzado. */
    Optional<MateriaModel> findByIdAndUsuarioId(Long id, Long usuarioId);

    long countByUsuarioId(Long usuarioId);
}
