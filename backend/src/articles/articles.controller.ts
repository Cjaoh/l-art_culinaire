import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, Request, HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /* ── Liste publique ── */
  @Get()
  findAll(
    @Query('page',   new DefaultValuePipe(1),  ParseIntPipe) page:   number,
    @Query('limit',  new DefaultValuePipe(10), ParseIntPipe) limit:  number,
    @Query('category') category?: string,
    @Query('author')   author?:   string
  ) {
    return this.articlesService.findAll(page, limit, undefined, category, author);
  }

  /* ── Recherche ── */
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.articlesService.search(q, page, limit);
  }

  /* ── Articles en attente (modérateurs/admins) ── */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  getPending(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.articlesService.getPendingArticles(page, limit);
  }

  /* ── Stats publiques ── */
  @Get('stats')
  getStats() {
    return this.articlesService.getPublicStats();
  }

  /* ── Articles en vedette ── */
  @Get('featured')
  getFeatured() {
    return this.articlesService.getFeaturedArticles();
  }

  /* ── Activité récente ── */
  @Get('activity')
  getRecentActivity() {
    return this.articlesService.getRecentActivity();
  }

  /* ── Détail par slug ── */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  /* ── Détail par ID ── */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  /* ── Créer un article (tous les connectés avec rôle ≥ author) ── */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateArticleDto, @Request() req: any) {
    return this.articlesService.create(dto, req.user.sub);
  }

  /* ── Modifier ── */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @Request() req: any
  ) {
    return this.articlesService.update(id, dto, req.user.sub, req.user.role);
  }

  /* ══ SOUMETTRE POUR RÉVISION ══
     Route appelée par l'éditeur frontend après sauvegarde.
     Change le statut en "pending". */
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  submitForReview(@Param('id') id: string, @Request() req: any) {
    return this.articlesService.submitForReview(id, req.user.sub);
  }

  /* ── Incrémenter les vues ── */
  @Patch(':id/view')
  incrementViews(@Param('id') id: string) {
    return this.articlesService.incrementViews(id);
  }

  /* ── Like / Unlike ── */
  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.articlesService.toggleLike(id, req.user.sub);
  }

  /* ── Approuver (modérateurs/admins) ── */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  approve(@Param('id') id: string) {
    return this.articlesService.approveArticle(id);
  }

  /* ── Refuser (modérateurs/admins) ── */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.articlesService.rejectArticle(id, reason);
  }

  /* ── Supprimer ── */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.articlesService.remove(id, req.user.sub, req.user.role);
  }
}