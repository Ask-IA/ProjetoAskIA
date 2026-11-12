package com.aski.IA.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Decide, ANTES do Spring AI escolher qual provedor de IA ativar, se é OpenAI ou Gemini —
 * sem precisar de uma variável extra "qual provedor usar": só olha qual key está preenchida
 * no .env.
 *
 * Como funciona: o Spring AI usa a propriedade "spring.ai.model.chat" pra decidir qual
 * autoconfiguração de chat liga (evita os dois ChatModel — OpenAI e Gemini — tentarem subir
 * juntos e darem conflito de bean). Essa classe calcula o valor certo dessa propriedade e
 * injeta como a prioridade MAIS ALTA do Environment, antes de qualquer outra fonte
 * (application.properties incluído).
 *
 * Regra:
 * - GEMINI_API_KEY preenchida e OPENAI_API_KEY vazia/ausente → usa Gemini.
 * - Qualquer outro caso (só OpenAI, as duas, ou nenhuma) → usa OpenAI (comportamento de
 *   sempre, e o que já estava em produção antes do Gemini existir no projeto).
 *
 * Provedores compatíveis com a API da OpenAI (ex.: Groq), adicionado em 10/11/2026:
 * - OPENAI_BASE_URL preenchida → vira spring.ai.openai.base-url, e o starter da OpenAI passa a
 *   falar com esse endereço. Groq: OPENAI_BASE_URL=https://api.groq.com/openai/v1, chave do
 *   Groq em OPENAI_API_KEY e o modelo dele em OPENAI_MODEL (ex.: openai/gpt-oss-120b).
 * - OPENAI_BASE_URL vazia/ausente → NADA é sobrescrito: vale o endereço padrão da OpenAI que o
 *   próprio Spring AI define. Por isso a troca é feita aqui, e não com um valor padrão no
 *   application.properties — assim não arriscamos escrever o endereço padrão da OpenAI errado.
 *
 * Por que EnvironmentPostProcessor e não um @Bean/@Configuration comum: essa decisão precisa
 * estar pronta ANTES do Spring decidir quais autoconfigurações de IA vão rodar — depois disso
 * já é tarde. É o mesmo mecanismo que o Spring Boot usa pra ler o .env antes de tudo.
 *
 * Registro: META-INF/spring.factories (único jeito válido para EnvironmentPostProcessor,
 * mesmo no Spring Boot 3/4 — não confundir com o .imports usado por autoconfigurações).
 */
public class IaProviderEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPRIEDADE_PROVEDOR = "spring.ai.model.chat";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String openai = environment.getProperty("OPENAI_API_KEY");
        String gemini = environment.getProperty("GEMINI_API_KEY");

        boolean temOpenai = openai != null && !openai.isBlank();
        boolean temGemini = gemini != null && !gemini.isBlank();

        // Gemini só vence quando é a ÚNICA key preenchida — no empate (as duas ou nenhuma),
        // OpenAI continua sendo o padrão, pra não mudar o comportamento de quem já usava só OpenAI.
        String provedor = (temGemini && !temOpenai) ? "google-genai" : "openai";

        Map<String, Object> propriedades = new HashMap<>();
        propriedades.put(PROPRIEDADE_PROVEDOR, provedor);

        String baseUrl = environment.getProperty("OPENAI_BASE_URL");
        if (baseUrl != null && !baseUrl.isBlank()) {
            propriedades.put("spring.ai.openai.base-url", baseUrl.trim());
        }

        environment.getPropertySources().addFirst(
                new MapPropertySource("ia-provider-autodetect", propriedades));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
