package com.aski.IA.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Liga o SessaoInterceptor a todas as rotas de /api/** e o RateLimitInterceptor
 * aos 3 endpoints de /auth que aceitam tentativas repetidas (login, cadastro,
 * esqueci-senha — ver RateLimitInterceptor).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SessaoInterceptor sessaoInterceptor;
    private final RateLimitInterceptor rateLimitInterceptor;

    public WebConfig(SessaoInterceptor sessaoInterceptor, RateLimitInterceptor rateLimitInterceptor) {
        this.sessaoInterceptor = sessaoInterceptor;
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessaoInterceptor).addPathPatterns("/api/**");
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/auth/login", "/auth/register", "/auth/esqueci-senha");
    }
}
