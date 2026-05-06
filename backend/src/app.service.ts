import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article, ArticleStatus } from './articles/schemas/article.schema';
import { Category } from './categories/schemas/category.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  getApiInfo(): any {
    return {
      name: 'CMS Blog Collaboratif API',
      version: '1.0.0',
      description: 'API pour le blog collaboratif de recettes de cuisine',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        articles: '/api/articles',
        categories: '/api/categories',
        comments: '/api/comments'
      },
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  async getStats() {
    const [published, pending, total, categories] = await Promise.all([
      this.articleModel.countDocuments({ status: ArticleStatus.PUBLISHED }),
      this.articleModel.countDocuments({ status: ArticleStatus.PENDING }),
      this.articleModel.countDocuments(),
      this.categoryModel.countDocuments()
    ]);

    return {
      published,
      pending,
      total,
      categories
    };
  }
}
