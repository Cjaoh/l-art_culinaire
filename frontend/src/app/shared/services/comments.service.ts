import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Comment, 
  CreateCommentDto, 
  UpdateCommentDto,
  CommentsResponse,
  CommentStatus 
} from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getComments(
    page = 1,
    limit = 10,
    articleId?: string,
    status = CommentStatus.APPROVED
  ): Observable<CommentsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', status);

    if (articleId) {
      params = params.set('article', articleId);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  getCommentsByArticle(
    articleId: string,
    page = 1,
    limit = 10
  ): Observable<CommentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/article/${articleId}`, { params }).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  getCommentReplies(commentId: string): Observable<Comment[]> {
    return this.http.get<any>(`${this.apiUrl}/replies/${commentId}`).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  getComment(id: string): Observable<Comment> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data ? res.data : res)
    );
  }

  createComment(commentData: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, commentData);
  }

  updateComment(id: string, commentData: UpdateCommentDto): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}`, commentData);
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  approveComment(id: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectComment(id: string, reason: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  markAsSpam(id: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}/spam`, {});
  }

  reportComment(id: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${id}/report`, {});
  }

  likeComment(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/like`, {});
  }

  unlikeComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/like`);
  }

  getPendingComments(page = 1, limit = 10): Observable<CommentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CommentsResponse>(`${this.apiUrl}/pending`, { params });
  }

  getReportedComments(page = 1, limit = 10): Observable<CommentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CommentsResponse>(`${this.apiUrl}/reported`, { params });
  }
}
