package com.aski.IA.repository;

import com.aski.IA.model.MensagemModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<MensagemModel, Long> {

    /** Mensagens na ordem em que foram escritas. O EntityGraph traz os passos junto (evita N+1). */
    @EntityGraph(attributePaths = "passos")
    List<MensagemModel> findByConversaIdOrderByIdAsc(Long conversaId);
}
