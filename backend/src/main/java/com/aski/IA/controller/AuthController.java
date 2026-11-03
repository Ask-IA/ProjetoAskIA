package com.aski.IA.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aski.IA.dto.EsqueciSenhaRequestDTO;
import com.aski.IA.dto.LoginRequestDTO;
import com.aski.IA.dto.RedefinirSenhaRequestDTO;
import com.aski.IA.dto.RegisterRequestDTO;
import com.aski.IA.dto.UserResponseDTO;
import com.aski.IA.service.PasswordResetService;
import com.aski.IA.service.UserService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;

    public AuthController(UserService userService, PasswordResetService passwordResetService) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@RequestBody RegisterRequestDTO dto) {
        UserResponseDTO created = userService.register(dto);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponseDTO> login(@RequestBody LoginRequestDTO dto, HttpSession session) {
        UserResponseDTO user = userService.login(dto);

        // guarda o id do usuário logado na sessão (o cookie JSESSIONID cuida do resto)
        session.setAttribute("userId", user.id());

        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }

    /**
     * "Esqueci minha senha": sempre responde 204, exista ou não o nome/e-mail
     * informado — assim ninguém descobre por aqui quais contas existem.
     * Se existir, PasswordResetService manda o e-mail (Resend) por trás.
     */
    @PostMapping("/esqueci-senha")
    public ResponseEntity<Void> esqueciSenha(@RequestBody EsqueciSenhaRequestDTO dto) {
        passwordResetService.solicitar(dto.identificador());
        return ResponseEntity.noContent().build();
    }

    /** Troca a senha a partir do token recebido por e-mail (link de "esqueci minha senha"). */
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Void> redefinirSenha(@RequestBody RedefinirSenhaRequestDTO dto) {
        passwordResetService.redefinir(dto.token(), dto.novaSenha());
        return ResponseEntity.noContent().build();
    }

    // o front chama isso ao carregar a tela da aplicação, pra saber se o usuário
    // continua logado (ex: depois de um F5 na página).
    //
    // CORREÇÃO: antes devolvia 200 com corpo vazio. Agora devolve os dados do
    // usuário (id, name, email), que o Painel usa para a saudação.
    // Se o id da sessão não existe mais no banco, a sessão é descartada e vira 401.
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return userService.buscarPorId(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    session.invalidate();
                    return ResponseEntity.status(401).<UserResponseDTO>build();
                });
    }
}
