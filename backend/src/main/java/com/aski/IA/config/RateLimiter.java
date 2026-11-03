package com.aski.IA.config;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Component;

/**
 * Limitador de tentativas simples, em memória, por janela fixa — sem
 * dependência nova (nada de Bucket4j/Redis: não vale a pena pra escala de
 * um TCC, e o app já não é multi-instância).
 *
 * Cada (bucket, chave) tem sua própria janela: "chave" normalmente é o IP de
 * quem fez a requisição (ver RateLimitInterceptor), e "bucket" identifica o
 * endpoint sendo protegido (ex.: "login"), para que o limite de um endpoint
 * não "gaste" o de outro.
 *
 * Não é à prova de múltiplas instâncias do backend atrás de um load balancer
 * (cada instância teria seu próprio contador) — para este projeto, com uma
 * instância só, isso não é um problema.
 */
@Component
public class RateLimiter {

	/** Acima disso, varre o mapa e descarta janelas já expiradas — evita crescer para sempre. */
	private static final int LIMIAR_LIMPEZA = 10_000;

	private final Map<String, Janela> janelas = new ConcurrentHashMap<>();

	/**
	 * @return true se a tentativa é permitida (e já conta como uma); false se o
	 *         limite da janela atual já foi atingido.
	 */
	public boolean permitir(String bucket, String chave, int maxTentativas, Duration janela) {
		String id = bucket + ':' + chave;
		long agora = System.currentTimeMillis();
		long duracaoMs = janela.toMillis();

		Janela j = janelas.computeIfAbsent(id, k -> new Janela(agora));

		synchronized (j) {
			if (agora - j.inicio.get() >= duracaoMs) {
				j.inicio.set(agora);
				j.contagem.set(0);
			}
			if (j.contagem.get() >= maxTentativas) {
				return false;
			}
			j.contagem.incrementAndGet();
		}

		if (janelas.size() > LIMIAR_LIMPEZA) {
			limpar(duracaoMs);
		}
		return true;
	}

	private void limpar(long duracaoMs) {
		long agora = System.currentTimeMillis();
		// margem de 2x: não remove uma janela só porque acabou de vencer, dá
		// espaço para a próxima tentativa (bem comum) reaproveitar o mesmo objeto.
		janelas.entrySet().removeIf(e -> agora - e.getValue().inicio.get() > duracaoMs * 2);
	}

	private static final class Janela {
		final AtomicLong inicio;
		final AtomicInteger contagem = new AtomicInteger(0);

		Janela(long inicio) {
			this.inicio = new AtomicLong(inicio);
		}
	}
}
