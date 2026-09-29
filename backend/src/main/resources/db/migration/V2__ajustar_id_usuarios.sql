-- V2: o antigo db/init.sql criava tb_users.id como SERIAL (INTEGER), mas a entidade
-- usa Long (BIGINT). Com ddl-auto=validate isso derrubaria a aplicação na subida.
-- Em bancos criados pelo V1 o id já é BIGINT e este comando não muda nada.
ALTER TABLE tb_users ALTER COLUMN id TYPE BIGINT;
