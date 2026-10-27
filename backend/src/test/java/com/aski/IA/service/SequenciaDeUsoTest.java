package com.aski.IA.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

/** Regras de docs/REGRAS_GAMIFICACAO.md. Não precisa de banco nem de Spring. */
class SequenciaDeUsoTest {

    private static final LocalDate HOJE = LocalDate.of(2026, 10, 5);

    /** Monta o conjunto de dias de uso a partir de "quantos dias atrás" (0 = hoje, 1 = ontem...). */
    private static Set<LocalDate> dias(int... diasAtras) {
        Set<LocalDate> conjunto = new HashSet<>();
        for (int d : diasAtras) {
            conjunto.add(HOJE.minusDays(d));
        }
        return conjunto;
    }

    @Test
    void semNenhumUsoASequenciaEZero() {
        assertEquals(0, SequenciaDeUso.diasSeguidos(dias(), HOJE));
    }

    @Test
    void usarSoHojeValeUm() {
        assertEquals(1, SequenciaDeUso.diasSeguidos(dias(0), HOJE));
    }

    @Test
    void diasConsecutivosAteHojeSaoContados() {
        assertEquals(3, SequenciaDeUso.diasSeguidos(dias(0, 1, 2), HOJE));
    }

    @Test
    void hojeSemUsoAindaNaoQuebraASequencia() {
        // usou ontem e anteontem; o dia de hoje ainda não acabou
        assertEquals(2, SequenciaDeUso.diasSeguidos(dias(1, 2), HOJE));
    }

    @Test
    void passarUmDiaInteiroSemUsarQuebraASequencia() {
        // usou anteontem, mas nem ontem nem hoje
        assertEquals(0, SequenciaDeUso.diasSeguidos(dias(2, 3), HOJE));
    }

    @Test
    void umBuracoNoMeioInterrompeAContagem() {
        // hoje, ontem, [falta anteontem], 3 dias atrás
        assertEquals(2, SequenciaDeUso.diasSeguidos(dias(0, 1, 3), HOJE));
    }

    @Test
    void naoHaTetoDeDias() {
        int[] quarentaECinco = new int[45];
        for (int i = 0; i < 45; i++) {
            quarentaECinco[i] = i;
        }
        assertEquals(45, SequenciaDeUso.diasSeguidos(dias(quarentaECinco), HOJE));
    }

    @Test
    void perguntaDe22h30EmSalvadorContaNoDiaCerto() {
        ZoneId utc = ZoneId.of("UTC");
        ZoneId brasilia = ZoneId.of("America/Sao_Paulo");

        // gravado como 01h30 de 05/10 em UTC = 22h30 de 04/10 no Brasil
        LocalDateTime noite = LocalDateTime.of(2026, 10, 5, 1, 30);
        assertEquals(LocalDate.of(2026, 10, 4), SequenciaDeUso.diaNoFuso(noite, utc, brasilia));

        // gravado como 03h30 de 05/10 em UTC = 00h30 de 05/10 no Brasil
        LocalDateTime madrugada = LocalDateTime.of(2026, 10, 5, 3, 30);
        assertEquals(LocalDate.of(2026, 10, 5), SequenciaDeUso.diaNoFuso(madrugada, utc, brasilia));
    }
}
