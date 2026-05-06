import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article, ArticleStatus, ArticleDocument } from './schemas/article.schema';
import { Category } from '../categories/schemas/category.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { slugify } from '../shared/utils/slug.util';
import { PaginationHelper, PaginationResult } from '../common/helpers/pagination.helper';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel('Article') private articleModel: Model<ArticleDocument>,
    @InjectModel('Category') private categoryModel: Model<Category>,
  ) {}

  // ================= CREATE =================

  async create(dto: CreateArticleDto, authorId: string) {
    const slug = await this.generateUniqueSlug(dto.title);

    return this.articleModel.create({
      ...dto,
      slug,
      author: new Types.ObjectId(authorId),
      status: ArticleStatus.DRAFT,
      likes: [],
      viewsCount: 0,
    });
  }

  async createRecipe(dto: CreateRecipeDto, authorId: string) {
    const slug = await this.generateUniqueSlug(dto.title);

    return this.articleModel.create({
      ...dto,
      slug,
      author: new Types.ObjectId(authorId),
      status: ArticleStatus.DRAFT,
      likes: [],
      viewsCount: 0,
    });
  }

  // ================= READ =================

  async findAll(page = 1, limit = 10, status = ArticleStatus.PUBLISHED, category?: string, author?: string) {
    const query: any = { status };
    
    if (category) {
      // Récupérer la catégorie par slug
      const categoryDoc = await this.categoryModel.findOne({ slug: category }).exec();
      if (categoryDoc) {
        query.categories = categoryDoc._id;
      }
    }
    
    if (author) {
      query.author = new Types.ObjectId(author);
    }

    const { skip, limit: queryLimit } = PaginationHelper.createQuery(page, limit);

    const [data, total] = await Promise.all([
      this.articleModel.find(query)
        .populate('author', 'name')
        .populate('categories', 'name slug icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      this.articleModel.countDocuments(query),
    ]);

    console.log(`Articles found: ${total} with status ${status}`);
    return PaginationHelper.createPaginationResult(data, total, page, limit);
  }

  async findOne(id: string) {
    // Vérifier si l'ID est un ObjectId valide
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id).populate('author');
    if (!article) throw new NotFoundException();
    return article;
  }

  async findBySlug(slug: string) {
    const article = await this.articleModel.findOne({ slug }).populate('author');
    if (!article) throw new NotFoundException();
    return article;
  }

  // ================= EXTRA METHODS (A FIX) =================

  async searchRecipes(
    ingredients?: string[],
    maxCookingTime?: number,
    maxPrepTime?: number,
    servings?: number,
    page = 1,
    limit = 10
  ) {
    const query: any = { status: ArticleStatus.PUBLISHED };
    
    if (ingredients && ingredients.length > 0) {
      query.ingredients = { $all: ingredients };
    }
    
    if (maxCookingTime) {
      query.cookingTimeMinutes = { $lte: maxCookingTime };
    }
    
    if (maxPrepTime) {
      query.prepTimeMinutes = { $lte: maxPrepTime };
    }
    
    if (servings) {
      query.servings = servings;
    }
    
    return this.paginateQuery(query, page, limit);
  }

  async getRecipesByIngredients(ingredients: string[], page = 1, limit = 10) {
    const query = {
      status: ArticleStatus.PUBLISHED,
      ingredients: { $all: ingredients },
    };

    return this.paginateQuery(query, page, limit);
  }

  async getRecipesByCookingTime(maxMinutes: number, page = 1, limit = 10) {
    const query = {
      status: ArticleStatus.PUBLISHED,
      cookingTimeMinutes: { $lte: maxMinutes },
    };

    return this.paginateQuery(query, page, limit);
  }

  async getFeaturedArticles() {
    return this.articleModel.find({ status: ArticleStatus.PUBLISHED })
      .populate('author', 'name')
      .sort({ viewsCount: -1 })
      .limit(5);
  }

  async getRecentActivity() {
    return this.articleModel.find()
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);
  }

  async getModerationStats() {
    return {
      pending: await this.articleModel.countDocuments({ status: ArticleStatus.PENDING }),
      rejected: await this.articleModel.countDocuments({ status: ArticleStatus.REJECTED }),
    };
  }

  async getPublicStats() {
    return {
      published: await this.articleModel.countDocuments({ status: ArticleStatus.PUBLISHED }),
      pending: await this.articleModel.countDocuments({ status: ArticleStatus.PENDING }),
      rejected: await this.articleModel.countDocuments({ status: ArticleStatus.REJECTED }),
      total: await this.articleModel.countDocuments(),
    };
  }

  async getPendingArticles(page = 1, limit = 10) {
    return this.paginateQuery({ status: ArticleStatus.PENDING }, page, limit);
  }

  async incrementViews(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    return this.articleModel.findByIdAndUpdate(id, {
      $inc: { viewsCount: 1 },
    }, { returnDocument: 'after' });
  }

  async toggleLike(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();
    
    const userObjectId = new Types.ObjectId(userId);
    const isLiked = article.likes.includes(userObjectId);
    
    if (isLiked) {
      article.likes = article.likes.filter(like => !like.equals(userObjectId));
    } else {
      article.likes.push(userObjectId);
    }
    
    return article.save();
  }

  async submitForReview(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();
    
    if (article.author.toString() !== userId) {
      throw new ForbiddenException();
    }
    
    return this.articleModel.findByIdAndUpdate(id, {
      status: ArticleStatus.PENDING,
    }, { returnDocument: 'after' });
  }

  async approveArticle(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();
    
    return this.articleModel.findByIdAndUpdate(id, {
      status: ArticleStatus.PUBLISHED,
    }, { returnDocument: 'after' });
  }

  async rejectArticle(id: string, reason?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();
    
    const updateData: any = {
      status: ArticleStatus.REJECTED,
    };
    
    if (reason) {
      updateData.rejectionReason = reason;
    }
    
    return this.articleModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // ================= SEARCH =================

  async search(query: string, page = 1, limit = 10) {
    const regex = new RegExp(query, 'i');

    return this.paginateQuery({
      status: ArticleStatus.PUBLISHED,
      $or: [{ title: regex }, { content: regex }],
    }, page, limit);
  }

  // ================= UPDATE =================

  async update(id: string, dto: UpdateArticleDto, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();

    this.checkUpdatePermission(article, userId, role);

    return this.articleModel.findByIdAndUpdate(id, dto, { new: true });
  }

  // ================= DELETE =================

  async remove(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid article ID format');
    }
    
    const article = await this.articleModel.findById(id);
    if (!article) throw new NotFoundException();

    this.checkDeletePermission(article, userId, role);

    await this.articleModel.findByIdAndDelete(id);
  }

  // ================= UTILS =================

  private async paginateQuery(query: any, page: number, limit: number) {
    const { skip, limit: queryLimit } = PaginationHelper.createQuery(page, limit);

    const [data, total] = await Promise.all([
      this.articleModel.find(query).skip(skip).limit(queryLimit),
      this.articleModel.countDocuments(query),
    ]);

    return PaginationHelper.createPaginationResult(data, total, page, limit);
  }

  private async generateUniqueSlug(title: string, excludeId?: string) {
    let slug = slugify(title);
    let i = 1;

    while (await this.articleModel.findOne({ slug })) {
      slug = `${slug}-${i++}`;
    }

    return slug;
  }

  private checkUpdatePermission(article: ArticleDocument, userId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    if (article.author.toString() === userId) return;
    throw new ForbiddenException();
  }

  private checkDeletePermission(article: ArticleDocument, userId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    if (article.author.toString() === userId) return;
    throw new ForbiddenException();
  }
}