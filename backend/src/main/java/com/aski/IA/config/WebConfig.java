package com.aski.IA.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Liga o SessaoInterceptor a todas as rotas de /api/**. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SessaoInterceptor sessaoInterceptor;

    public WebConfig(SessaoInterceptor sessaoInterceptor) {
        this.sessaoInterceptor = sessaoInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessaoInterceptor).addPathPatterns("/api/**");
    }
}
