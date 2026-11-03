package com.aski.IA.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Envia e-mails transacionais via API HTTP da Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Sem RESEND_API_KEY configurada no .env, o envio não acontece — só fica
 * registrado no log do servidor. O resto do fluxo de "esqueci minha senha"
 * continua funcionando normalmente: por segurança (não revelar se um e-mail
 * existe na base), PasswordResetService nunca deixa uma falha de envio
 * aparecer pro aluno como erro.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestClient restClient;
    private final String remetente;
    private final boolean configurado;

    public EmailService(@Value("${app.resend.api-key}") String apiKey,
                        @Value("${app.resend.remetente}") String remetente) {
        this.remetente = remetente;
        this.configurado = apiKey != null && !apiKey.isBlank();
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + (apiKey == null ? "" : apiKey))
                .build();
    }

    public void enviarRedefinicaoSenha(String destinatario, String nomeDoAluno, String link) {
        if (!configurado) {
            log.warn("RESEND_API_KEY não configurada: e-mail de redefinição de senha NÃO foi enviado para {}", destinatario);
            return;
        }

        String primeiroNome = (nomeDoAluno == null || nomeDoAluno.isBlank())
                ? "" : nomeDoAluno.trim().split("\\s+")[0];

        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1F2937;">
                  <h2 style="color:#1D4ED8; margin-bottom: 4px;">Ask.IA</h2>
                  <p>Oi%s,</p>
                  <p>Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo para escolher
                  uma nova senha. Esse link vale por <strong>30 minutos</strong>.</p>
                  <p style="margin: 24px 0;">
                    <a href="%s" style="background:#1D4ED8; color:#ffffff; padding:12px 20px;
                       border-radius:8px; text-decoration:none; display:inline-block;">Redefinir minha senha</a>
                  </p>
                  <p style="color:#6B7280; font-size: 14px;">
                    Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.
                  </p>
                </div>
                """.formatted(primeiroNome.isEmpty() ? "" : ", " + primeiroNome, link);

        try {
            restClient.post()
                    .uri("/emails")
                    .body(Map.of(
                            "from", remetente,
                            "to", List.of(destinatario),
                            "subject", "Redefinir sua senha no Ask.IA",
                            "html", html))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException e) {
            log.warn("Falha ao enviar e-mail de redefinição de senha via Resend para {}: {}", destinatario, e.getMessage());
        }
    }
}
