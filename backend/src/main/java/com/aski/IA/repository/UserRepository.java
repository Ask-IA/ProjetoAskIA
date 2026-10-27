package com.aski.IA.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aski.IA.model.UserModel;

public interface UserRepository extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByEmail(String email);

    /** Login por e-mail sem diferenciar maiúsculas. */
    Optional<UserModel> findFirstByEmailIgnoreCase(String email);

    /** Login por nome sem diferenciar maiúsculas (o nome é único: índice ux_users_name_lower). */
    Optional<UserModel> findFirstByNameIgnoreCase(String name);

    boolean existsByEmail(String email);

    boolean existsByNameIgnoreCase(String name);
}
