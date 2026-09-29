import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AskIaService } from './ask-ia.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

// O `withCredentials: true` saiu dos métodos: agora é aplicado de forma
// centralizada pelo credenciaisInterceptor (src/app/core), para toda
// chamada que começa com environment.apiUrl.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /**
   * Quem está logado, guardado depois do login ou do /auth/me.
   * O menu (nome e iniciais) e o Painel (saudação) leem daqui, sem repetir
   * a chamada ao backend em cada tela.
   */
  readonly usuario = signal<UserResponse | null>(null);

  // O histórico do Ask IA fica em memória; precisa ser esquecido ao sair/trocar de conta.
  private askIa = inject(AskIaService);

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(usuario => this.guardar(usuario))
    );
  }

  register(data: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, data);
  }

  logout(): Observable<void> {
    // Esquece o usuário mesmo se o backend falhar: a tela volta para o login.
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => {
        this.usuario.set(null);
        this.askIa.limpar();
      })
    );
  }

  /**
   * Confirma se existe sessão válida no backend.
   * 200 = logado (com id, name e email); 401 = não logado.
   * O authGuard chama este método na entrada de /app, então o `usuario`
   * já está preenchido quando o menu aparece.
   */
  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(usuario => this.guardar(usuario))
    );
  }

  private guardar(usuario: UserResponse | null): void {
    // corpo vazio (versão antiga do backend) não apaga o que já sabemos
    if (!usuario?.name) return;

    // Outra conta na mesma aba (sessão que expirou e alguém entrou de novo, ou login
    // em outra aba): as conversas em memória são da conta anterior e não podem aparecer.
    const anterior = this.usuario();
    if (anterior && anterior.id !== usuario.id) this.askIa.limpar();

    this.usuario.set(usuario);
  }
}
