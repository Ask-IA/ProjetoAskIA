-- V4: o login passa a aceitar e-mail OU nome, então o nome precisa ser único
-- (sem diferenciar maiúsculas de minúsculas: "Jorge" e "jorge" são o mesmo nome).

-- Contas antigas com nome repetido: a mais antiga mantém o nome; as outras ganham
-- o id no fim (ex.: "Maria" -> "Maria 12"), para o índice abaixo poder ser criado.
UPDATE tb_users u
   SET name = u.name || ' ' || u.id
 WHERE u.name IS NOT NULL
   AND EXISTS (SELECT 1 FROM tb_users o WHERE lower(o.name) = lower(u.name) AND o.id < u.id);

CREATE UNIQUE INDEX ux_users_name_lower ON tb_users (lower(name));
