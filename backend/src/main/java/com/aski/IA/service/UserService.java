package com.aski.IA.service;

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

    public UserResponseDTO register(RegisterRequestDTO dto){
        if(userRepository.existsByEmail(dto.email())){
            throw new IllegalArgumentException("Já existe um usuário com esse Email.");
        }

        UserModel user = new UserModel(
                dto.name(),
                dto.email(),
                passwordEncoder.encode(dto.password())
        );

        UserModel saved = userRepository.save(user);
        return new UserResponseDTO(saved.getId(), saved.getName(), saved.getEmail());
    }

    public UserResponseDTO login(LoginRequestDTO dto){
            UserModel user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos."));

            if(!passwordEncoder.matches(dto.password(), user.getPassword())){
                throw new IllegalArgumentException("E-mail ou senha inválidos.");
            }

            return new UserResponseDTO(user.getId(), user.getName(), user.getEmail());
    }
}
