import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, CreateUserDto, UpdateUserDto } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(page = 1, limit = 10): Observable<any> {
    const params = {
      page: page.toString(),
      limit: limit.toString()
    };
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  updateUser(id: string, userData: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchUsers(query: string, page = 1, limit = 10): Observable<any> {
    const params = {
      q: query,
      page: page.toString(),
      limit: limit.toString()
    };
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }
}
