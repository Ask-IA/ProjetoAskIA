// Ambiente de PRODUÇÃO (ng build usa este arquivo).
//
// TODO (integração/publicação): trocar apiUrl pela URL pública do backend
// quando ele for publicado (ex.: https://askia-backend.onrender.com).
// Enquanto isso fica igual ao de desenvolvimento para não quebrar build local.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080',
};
