package com.aski.IA.repository;

import com.aski.IA.model.SessaoEstudoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SessaoEstudoRepository extends JpaRepository<SessaoEstudoModel, Long> {

    List<SessaoEstudoModel> findByUsuarioIdOrderByDataDesc(Long usuarioId);

    /** Só as datas (sem carregar as sessões inteiras): base da sequência de dias de uso. */
    @Query("select s.data from SessaoEstudoModel s where s.usuario.id = :usuarioId")
    List<LocalDateTime> datasDoUsuario(@Param("usuarioId") Long usuarioId);
}
