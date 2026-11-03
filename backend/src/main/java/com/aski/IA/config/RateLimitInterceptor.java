package com.aski.IA.config;

import java.time.Duration;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Freio contra força bruta em /auth/login, /auth/register e
 * /auth/esqueci-senha — os três únicos endpoints públicos que aceitam
 * tentativas repetidas de adivinhar senha, criar conta em massa, ou
 * "spammar" o e-mail de redefinição de alguém. Os demais endpoints de /auth
 * (logout, redefinir-senha, me) não precisam: ou exigem o token que já saiu
 * por e-mail, ou não fazem sentido repetir.
 *
 * Por IP (ver {@link #ipDoCliente}), não por conta — assim nem revela se a
 * conta existe (coerente com UserService/PasswordResetService, que já
 * tomam esse cuidado na mensagem de erro).
 *
 * Registrado só nesses 3 caminhos em WebConfig; não entra no SessaoInterceptor
 * porque estes 3 são justamente os endpoints onde ainda não existe sessão.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

	private record Limite(int maxTentativas, Duration janela) {
	}

	// Login: 5 tentativas por minuto — permite errar a senha algumas vezes
	// sem travar, mas barra um script testando senha atrás de senha.
	private static final Limite LOGIN = new Limite(5, Duration.ofMinutes(1));
	// Cadastro e "esqueci minha senha" são ações raras para uma pessoa real:
	// janela mais larga e teto mais baixo.
	private static final Limite REGISTRO = new Limite(5, Duration.ofMinutes(10));
	private static final Limite ESQUECI_SENHA = new Limite(3, Duration.ofMinutes(10));

	private static final Map<String, Limite> LIMITES_POR_CAMINHO = Map.of(
			"/auth/login", LOGIN,
			"/auth/register", REGISTRO,
			"/auth/esqueci-senha", ESQUECI_SENHA);

	private final RateLimiter rateLimiter;

	public RateLimitInterceptor(RateLimiter rateLimiter) {
		this.rateLimiter = rateLimiter;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {

		Limite limite = LIMITES_POR_CAMINHO.get(request.getRequestURI());
		if (limite == null) {
			return true; // caminho sem registro aqui (não devia acontecer, ver WebConfig) — não bloqueia
		}

		String ip = ipDoCliente(request);
		boolean permitido = rateLimiter.permitir(request.getRequestURI(), ip, limite.maxTentativas(), limite.janela());

		if (!permitido) {
			response.setStatus(429); // Too Many Requests
			response.setContentType("application/json;charset=UTF-8");
			response.getWriter().write("{\"message\":\"Muitas tentativas. Aguarde um pouco e tente de novo.\"}");
			return false;
		}
		return true;
	}

	/** nginx (nginx.conf) encaminha com X-Forwarded-For; sem proxy na frente, cai no IP direto da conexão. */
	private String ipDoCliente(HttpServletRequest request) {
		String encaminhado = request.getHeader("X-Forwarded-For");
		if (encaminhado != null && !encaminhado.isBlank()) {
			return encaminhado.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}
}
