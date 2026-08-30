package com.aski.IA.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aski.IA.dto.LoginRequestDTO;
import com.aski.IA.dto.RegisterRequestDTO;
import com.aski.IA.dto.UserResponseDTO;
import com.aski.IA.service.UserService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
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

    // o front chama isso ao carregar a tela da aplicação, pra saber se o usuário
    // continua logado (ex: depois de um F5 na página)
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok().build();
    }
}   
