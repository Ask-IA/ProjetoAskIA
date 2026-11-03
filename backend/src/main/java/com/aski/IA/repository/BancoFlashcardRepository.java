package com.aski.IA.repository;

import com.aski.IA.model.BancoFlashcardModel;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Tabela pequena e praticamente estática (conteúdo curado pela equipe) —
 * o filtro por matéria é feito em BancoConteudoService, normalizando
 * acentos e maiúsculas/minúsculas em Java (findAll() + stream), porque o
 * aluno pode ter cadastrado a matéria sem acento (ex.: "Matematica").
 */
public interface BancoFlashcardRepository extends JpaRepository<BancoFlashcardModel, Long> {
}
