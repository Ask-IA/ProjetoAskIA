package com.aski.IA.repository;

import com.aski.IA.model.MetaEstudoModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MetaEstudoRepository extends JpaRepository<MetaEstudoModel, Long> {

    List<MetaEstudoModel> findByUsuarioIdOrderByIdAsc(Long usuarioId);

    Optional<MetaEstudoModel> findByIdAndUsuarioId(Long id, Long usuarioId);
}
