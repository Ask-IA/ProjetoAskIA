package com.aski.IA.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;

/**
 * Regras de data da gamificação, sem depender de banco nem de Spring (por isso é fácil de testar).
 * As regras em texto estão em docs/REGRAS_GAMIFICACAO.md.
 */
final class SequenciaDeUso {

    private SequenciaDeUso() {
    }

    /**
     * O banco guarda data/hora SEM fuso, no fuso do servidor (UTC no Docker). Para saber em que
     * DIA do aluno aquilo aconteceu, converte para o fuso do app (Brasília): uma pergunta feita
     * às 22h30 em Salvador está gravada como 01h30 do dia seguinte em UTC.
     */
    static LocalDate diaNoFuso(LocalDateTime gravadaNoServidor, ZoneId fusoDoServidor, ZoneId fusoDoApp) {
        return gravadaNoServidor.atZone(fusoDoServidor).withZoneSameInstant(fusoDoApp).toLocalDate();
    }

    /**
     * Quantos dias seguidos o aluno usou o app, contando para trás.
     * - Se usou hoje, a sequência termina hoje.
     * - Se ainda não usou hoje, ela termina ontem: o dia não acabou, então não quebra a sequência.
     * - Se não usou nem hoje nem ontem, a sequência é 0.
     * Não há teto: 45 dias seguidos valem 45.
     */
    static int diasSeguidos(Set<LocalDate> diasDeUso, LocalDate hoje) {
        LocalDate dia = diasDeUso.contains(hoje) ? hoje : hoje.minusDays(1);
        int total = 0;
        while (diasDeUso.contains(dia)) {
            total++;
            dia = dia.minusDays(1);
        }
        return total;
    }
}
