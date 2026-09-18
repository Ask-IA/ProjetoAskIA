package com.aski.IA.repository;

import com.aski.IA.model.SessaoEstudoModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudoModel, Long> {

    List<SessaoEstudoModel> findByUsuarioIdOrderByDataDesc(Long usuarioId);
}
