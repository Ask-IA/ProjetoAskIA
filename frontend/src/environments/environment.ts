// Ambiente de PRODUÇÃO (ng build usa este arquivo, sem a flag --configuration development).
//
// apiUrl vazio = URLs relativas ("/api/...", "/auth/..."): o próprio nginx do
// container do frontend encaminha essas rotas para o backend (ver nginx.conf).
// Funciona em qualquer domínio onde o docker-compose for publicado, sem
// precisar saber de antemão a URL pública do backend.
export const environment = {
  production: true,
  apiUrl: '',
};
