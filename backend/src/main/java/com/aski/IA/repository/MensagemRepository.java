package com.aski.IA.repository;

import com.aski.IA.model.MensagemModel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aski.IA.model.AutorMensagem;

import java.time.LocalDateTime;

import java.util.List;

public interface MensagemRepository extends JpaRepository<MensagemModel, Long> {

    /** Mensagens na ordem em que foram escritas. O EntityGraph traz os passos junto (evita N+1). */
    @EntityGraph(attributePaths = "passos")
    List<MensagemModel> findByConversaIdOrderByIdAsc(Long conversaId);

    /**
     * Quantas mensagens de um autor o usuário escreveu desde `desde`.
     * Com autor = ALUNO é o número de perguntas feitas hoje (base da cota diária).
     */
    @Query("""
           select count(m) from MensagemModel m
           where m.conversa.usuario.id = :usuarioId
             and m.autor = :autor
             and m.criadaEm >= :desde
           """)
    long contarDesde(@Param("usuarioId") Long usuarioId,
                     @Param("autor") AutorMensagem autor,
                     @Param("desde") LocalDateTime desde);

    /** Total de mensagens de um autor do usuário (com ALUNO: perguntas respondidas, de sempre). */
    @Query("""
           select count(m) from MensagemModel m
           where m.conversa.usuario.id = :usuarioId
             and m.autor = :autor
           """)
    long contarDoAutor(@Param("usuarioId") Long usuarioId, @Param("autor") AutorMensagem autor);

    /** Só as datas das mensagens de um autor: base da sequência de dias de uso. */
    @Query("""
           select m.criadaEm from MensagemModel m
           where m.conversa.usuario.id = :usuarioId
             and m.autor = :autor
           """)
    List<LocalDateTime> datasDoAutor(@Param("usuarioId") Long usuarioId, @Param("autor") AutorMensagem autor);
}
