import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },   // home pública, estática
  { path: '**', renderMode: RenderMode.Server },    // login, cadastro, /app/* — dinâmico
];
