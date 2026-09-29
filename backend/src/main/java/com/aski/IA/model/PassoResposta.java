package com.aski.IA.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Um passo numerado da resposta da IA. Vive dentro da mensagem (tabela tb_mensagem_passos). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PassoResposta {

    @Column(nullable = false, length = 150)
    private String titulo;

    /** Termos-chave vêm entre ==sinais de igual==, como o frontend já espera. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(length = 500)
    private String formula;
}
