package com.aski.IA.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aski.IA.model.PasswordResetTokenModel;
import com.aski.IA.model.UserModel;
import com.aski.IA.repository.PasswordResetTokenRepository;
import com.aski.IA.repository.UserRepository;

/**
 * "Esqueci minha senha": gera um link de uso único (válido por 30 min),
 * manda por e-mail (EmailService/Resend) e, depois, troca a senha quando o
 * aluno volta com o token.
 *
 * Por segurança, solicitar() nunca revela se o nome/e-mail existe na base:
 * o comportamento é o mesmo (nenhuma exceção, nenhuma pista) tanto para quem
 * tem conta quanto para quem não tem — só quem tem conta recebe o e-mail.
 */
@Service
public class PasswordResetService {

    /** Mesmo tamanho mínimo do cadastro (UserService). */
    private static final int TAMANHO_MINIMO_SENHA = 6;
    private static final Duration VALIDADE = Duration.ofMinutes(30);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final String frontendUrl;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService,
                                @Value("${app.frontend-url}") String frontendUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void solicitar(String identificador) {
        if (identificador == null || identificador.isBlank()) {
            throw new IllegalArgumentException("Informe seu nome ou e-mail.");
        }
        String valor = identificador.trim();

        // Mesma regra do login: com "@" é e-mail, sem "@" é nome.
        Optional<UserModel> encontrado = valor.contains("@")
                ? userRepository.findFirstByEmailIgnoreCase(valor)
                : userRepository.findFirstByNameIgnoreCase(valor);

        if (encontrado.isEmpty()) return; // não revela se existe ou não

        UserModel usuario = encontrado.get();
        tokenRepository.deleteByUsuarioId(usuario.getId()); // só o pedido mais recente vale

        String tokenBruto = gerarTokenBruto();
        tokenRepository.save(new PasswordResetTokenModel(usuario, hash(tokenBruto), LocalDateTime.now().plus(VALIDADE)));

        String link = frontendUrl + "/redefinir-senha?token=" + tokenBruto;
        emailService.enviarRedefinicaoSenha(usuario.getEmail(), usuario.getName(), link);
    }

    @Transactional
    public void redefinir(String tokenBruto, String novaSenha) {
        if (tokenBruto == null || tokenBruto.isBlank()) {
            throw new IllegalArgumentException("Link inválido.");
        }
        if (novaSenha == null || novaSenha.length() < TAMANHO_MINIMO_SENHA) {
            throw new IllegalArgumentException(
                    "A senha precisa ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
        }

        PasswordResetTokenModel registro = tokenRepository.findByTokenHash(hash(tokenBruto))
                .orElseThrow(() -> new IllegalArgumentException("Esse link é inválido ou já foi usado."));

        if (registro.getExpiraEm().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(registro);
            throw new IllegalArgumentException("Esse link expirou. Peça a redefinição de novo.");
        }

        UserModel usuario = registro.getUsuario();
        usuario.setPassword(passwordEncoder.encode(novaSenha));
        tokenRepository.delete(registro); // uso único: funciona só uma vez
    }

    // ---------- auxiliares ----------

    /** 32 bytes aleatórios (256 bits) em hexadecimal — vai no link do e-mail, nunca no banco. */
    private String gerarTokenBruto() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** SHA-256 em hexadecimal (64 caracteres) — o que de fato é gravado em tb_tokens_redefinicao_senha. */
    private String hash(String valor) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 é garantido pela própria especificação da JVM (sempre disponível).
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
