package com.aski.IA.repository;

import com.aski.IA.model.TopicoModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TopicoRepository extends JpaRepository<TopicoModel, Long> {

    Optional<TopicoModel> findByIdAndMateriaId(Long id, Long materiaId);
}
