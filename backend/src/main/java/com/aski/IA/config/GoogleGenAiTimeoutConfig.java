package com.aski.IA.config;

import java.io.IOException;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.google.genai.types.HttpOptions;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.ai.model.SpringAIModelProperties;
import org.springframework.ai.model.SpringAIModels;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;

/**
 * O starter do Google GenAI (spring-ai-starter-model-google-genai) usa o SDK
 * oficial do Google (com.google.genai.Client) por baixo, não o RestClient/WebClient
 * do Spring — por isso nenhuma propriedade padrão do Spring Boot
 * (spring.http.client.*) nem o spring.ai.retry.* (application.properties) tem
 * qualquer efeito sobre uma chamada que trava DENTRO do transporte HTTP do SDK:
 * retry só age DEPOIS que uma exceção é lançada, e uma chamada pendurada (sem
 * erro, só sem resposta) nunca lança nada.
 *
 * Esta classe substitui o bean "googleGenAiClient" que o Spring AI cria
 * automaticamente (GoogleGenAiChatAutoConfiguration), recriando a mesma lógica
 * de configuração (API key do Gemini Developer API, ou Vertex AI com
 * project-id + location), mas com um timeout HTTP explícito no Client — assim
 * uma chamada que travaria indefinidamente falha rápido, lança exceção, e cai
 * no retry (spring.ai.retry.*) e por fim no fallback (IaIndisponivelException)
 * em vez de ficar pendurada além do timeout de 90s do nginx.
 *
 * O bean "googleGenAiClient" da autoconfiguração padrão do Spring AI é
 * @ConditionalOnMissingBean — como classes de configuração do próprio projeto
 * (como esta) são registradas antes das autoconfigurações serem avaliadas, o
 * bean definido aqui "ganha" e o padrão (sem timeout) nunca chega a ser criado.
 *
 * IMPORTANTE — resiliência: NUNCA lança exceção daqui. A versão original do
 * Spring AI lança IllegalStateException quando a configuração está incompleta
 * (sem api-key nem project-id/location), e isso IMPEDE o Spring de terminar de
 * subir — ou seja, um problema de configuração da IA (.env sem a key, ou um
 * `docker compose up` disparado de outra pasta que não encontrou o .env)
 * derrubava a aplicação INTEIRA, incluindo cadastro e login, que não dependem
 * de IA nenhuma. O comentário em application.properties já promete "sem
 * nenhuma key configurada, o backend ainda sobe" — isso só é verdade de fato
 * para o OpenAI (que não valida a key na hora de criar o bean); para o Google
 * GenAI, com essa validação eager, a promessa ficava quebrada. Por isso, se a
 * configuração estiver incompleta, construímos o Client assim mesmo (com uma
 * api-key claramente inválida) em vez de abortar o startup: a aplicação sobe
 * normalmente, e só a chamada real à IA falha (Google devolve erro de
 * autenticação, o que já cai no retry → IaIndisponivelException → fallback,
 * exatamente como qualquer outra falha do provedor).
 *
 * IMPORTANTE — por que ler do Environment dentro do @Bean, e não com @Value
 * nos campos da classe: em alguns startups o Spring cria a instância desta
 * @Configuration antes de injetar os campos @Value nela (acontece quando a
 * classe precisa ser instanciada cedo pra ser inspecionada, por causa das
 * anotações condicionais acima — o log mostra um WARN do
 * ConfigurationClassPostProcessor avisando isso: "singleton instance has been
 * created too early"). Quando isso acontece, os campos @Value ficam com o
 * valor padrão (string vazia) mesmo com a variável de ambiente certinha no
 * container — foi exatamente esse bug que fazia o Client achar que não tinha
 * api-key nenhuma, mesmo com GEMINI_API_KEY presente (confirmado com
 * `docker compose exec backend printenv GEMINI_API_KEY`). Lendo do
 * Environment diretamente dentro do método @Bean, a resolução é feita na hora
 * em que o bean é efetivamente construído (bem mais tarde no startup, com
 * todas as property sources já carregadas), então não depende dessa ordem de
 * inicialização.
 */
@Configuration
@ConditionalOnClass(Client.class)
@ConditionalOnProperty(name = SpringAIModelProperties.CHAT_MODEL, havingValue = SpringAIModels.GOOGLE_GEN_AI,
		matchIfMissing = true)
public class GoogleGenAiTimeoutConfig {

	private static final Log logger = LogFactory.getLog(GoogleGenAiTimeoutConfig.class);

	/**
	 * Timeout de rede (conexão + leitura da resposta) para cada chamada ao
	 * Gemini, em milissegundos.
	 *
	 * Era 30s. Subiu para 80s em 10/11/2026: a correção de redação pede uma
	 * resposta longa (5 competências com comentários) e o Gemini passou dos 30s
	 * no primeiro teste real (GenAiIOException: timeout). Com o retry
	 * (spring.ai.retry.max-attempts=2), o pior caso é 80s + 1s + 80s = 161s,
	 * por isso o proxy_read_timeout do nginx subiu junto para 180s — senão o
	 * nginx cortaria a conexão (504) enquanto a 2ª tentativa ainda roda.
	 */
	private static final int TIMEOUT_MS = 80_000;

	private final Environment environment;

	public GoogleGenAiTimeoutConfig(Environment environment) {
		this.environment = environment;
	}

	@Bean
	public Client googleGenAiClient() {
		String apiKey = environment.getProperty("spring.ai.google.genai.api-key", "");
		String projectId = environment.getProperty("spring.ai.google.genai.project-id", "");
		String location = environment.getProperty("spring.ai.google.genai.location", "");
		boolean vertexAi = environment.getProperty("spring.ai.google.genai.vertex-ai", Boolean.class, false);
		String credentialsUri = environment.getProperty("spring.ai.google.genai.credentials-uri", "");

		Client.Builder builder = Client.builder().httpOptions(HttpOptions.builder().timeout(TIMEOUT_MS).build());

		boolean hasApiKey = StringUtils.hasText(apiKey);
		boolean hasProject = StringUtils.hasText(projectId);
		boolean hasLocation = StringUtils.hasText(location);
		boolean hasVertexConfig = hasProject && hasLocation;

		try {
			if (vertexAi && hasVertexConfig) {
				configureVertexAi(builder, projectId, location, credentialsUri);
			}
			else if (hasApiKey) {
				builder.apiKey(apiKey);
			}
			else if (hasVertexConfig) {
				logger.debug("Project ID and Location detected. Defaulting to Vertex AI mode.");
				configureVertexAi(builder, projectId, location, credentialsUri);
			}
			else {
				// Não lança: ver o porquê no javadoc da classe. Constrói com uma
				// api-key inválida só pra o Client existir — a chamada real à IA é
				// que vai falhar (e isso já é tratado em IaService/IaController).
				logger.warn("Google GenAI sem 'api-key' nem 'project-id'+'location' configurados "
						+ "(GEMINI_API_KEY vazia no ambiente deste container?). O backend vai subir "
						+ "normalmente, mas o Ask IA vai falhar até isso ser corrigido no .env.");
				builder.apiKey("sem-chave-configurada");
			}
		}
		catch (IOException e) {
			logger.warn("Não foi possível carregar as credenciais do Google GenAI (Vertex AI) — "
					+ "o Ask IA vai falhar até isso ser corrigido.", e);
			builder.apiKey("sem-chave-configurada");
		}

		logger.info("Google GenAI Client configurado com timeout HTTP de " + TIMEOUT_MS
				+ "ms (GoogleGenAiTimeoutConfig). API key presente: " + hasApiKey);

		return builder.build();
	}

	private void configureVertexAi(Client.Builder builder, String projectId, String location, String credentialsUri)
			throws IOException {
		builder.project(projectId).location(location).vertexAI(true);

		if (StringUtils.hasText(credentialsUri)) {
			Resource recurso = new DefaultResourceLoader().getResource(credentialsUri);
			try (var is = recurso.getInputStream()) {
				builder.credentials(GoogleCredentials.fromStream(is));
			}
		}
	}

}
