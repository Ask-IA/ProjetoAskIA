package com.aski.IA.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.aski.IA.dto.LoginRequestDTO;
import com.aski.IA.dto.RegisterRequestDTO;
import com.aski.IA.dto.UserResponseDTO;
import com.aski.IA.model.UserModel;
import com.aski.IA.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Tamanho mínimo da senha — o MESMO valor que o frontend exige (cadastro.ts). */
    private static final int TAMANHO_MINIMO_SENHA = 6;
    private static final int TAMANHO_MAXIMO_NOME = 100;

    public UserResponseDTO register(RegisterRequestDTO dto){
        // Nome e e-mail são formas de entrar, então precisam ser únicos e sem ambiguidade.
        String nome = dto.name() == null ? "" : dto.name().trim();
        if(nome.isEmpty()){
            throw new IllegalArgumentException("Informe seu nome.");
        }
        if(nome.contains("@")){
            // é o "@" que diferencia e-mail de nome na hora do login
            throw new IllegalArgumentException("O nome não pode conter @.");
        }
        if(nome.length() > TAMANHO_MAXIMO_NOME){
            throw new IllegalArgumentException("O nome pode ter no máximo " + TAMANHO_MAXIMO_NOME + " caracteres.");
        }
        if(dto.email() == null || dto.email().isBlank()){
            throw new IllegalArgumentException("Informe seu e-mail.");
        }
        String email = dto.email().trim();

        if(userRepository.existsByEmail(email) || userRepository.findFirstByEmailIgnoreCase(email).isPresent()){
            throw new IllegalArgumentException("Já existe um usuário com esse Email.");
        }
        if(userRepository.existsByNameIgnoreCase(nome)){
            throw new IllegalArgumentException("Esse nome já está em uso. Escolha outro (por exemplo, com sobrenome).");
        }

        // O frontend já valida isso, mas a regra precisa existir aqui também:
        // qualquer um pode chamar a API direto (Postman, curl) pulando a tela.
        if(dto.password() == null || dto.password().length() < TAMANHO_MINIMO_SENHA){
            throw new IllegalArgumentException(
                    "A senha precisa ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
        }

        UserModel user = new UserModel(
                nome,
                email,
                passwordEncoder.encode(dto.password())
        );

        UserModel saved = userRepository.save(user);
        return new UserResponseDTO(saved.getId(), saved.getName(), saved.getEmail());
    }

    public UserResponseDTO login(LoginRequestDTO dto){
            String identificador = dto.identificador();

            // Com "@" é e-mail; sem "@" é nome (o cadastro proíbe "@" no nome, então não há dúvida).
            Optional<UserModel> encontrado = identificador.contains("@")
                    ? userRepository.findFirstByEmailIgnoreCase(identificador)
                    : userRepository.findFirstByNameIgnoreCase(identificador);

            // Mesma mensagem para "não existe" e "senha errada": não revela quais contas existem.
            UserModel user = encontrado
                .orElseThrow(() -> new IllegalArgumentException("Nome/e-mail ou senha inválidos."));

            if(dto.password() == null || !passwordEncoder.matches(dto.password(), user.getPassword())){
                throw new IllegalArgumentException("Nome/e-mail ou senha inválidos.");
            }

            return new UserResponseDTO(user.getId(), user.getName(), user.getEmail());
    }

    /** Usado pelo GET /auth/me: devolve os dados do usuário da sessão (vazio se ele não existir mais). */
    public Optional<UserResponseDTO> buscarPorId(Long id){
        return userRepository.findById(id)
                .map(user -> new UserResponseDTO(user.getId(), user.getName(), user.getEmail()));
    }
}
