package com.aski.IA.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * "Porteiro" dos endpoints de /api/**: só passa quem tem sessão com userId.
 *
 * Antes, a checagem era um `if (userId == null)` escrito à mão dentro do
 * controller. Funciona para um endpoint; para dez, alguém esquece — e o endpoint
 * fica aberto sem ninguém notar. Centralizando aqui, a regra passa a ser uma só:
 *   /auth/**  → público (login, cadastro, logout, me)
 *   /api/**   → precisa estar logado
 *
 * Registrado em WebConfig.
 */
@Component
public class SessaoInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        // Preflight do CORS não carrega cookie e não deve ser barrado
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Faça login para continuar.\"}");
            return false;
        }
        return true;
    }
}
