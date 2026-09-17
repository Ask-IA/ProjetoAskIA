import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, data);
  }

  register(data: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, data);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }

  /**
   * Confirma se existe sessão válida no backend.
   * 200 = logado; 401 = não logado.
   *
   * BUG conhecido do backend (reportado ao Jorge): a resposta vem com corpo
   * vazio — deveria trazer id, name e email. O guard funciona mesmo assim
   * porque só olha o status; quando o backend for corrigido, o tipo
   * UserResponse passa a valer de verdade (ex.: mostrar o nome no Painel).
   */
  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`);
  }
}
