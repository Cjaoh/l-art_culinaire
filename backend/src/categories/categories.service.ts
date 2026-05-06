import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryStatus } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { slugify } from '../shared/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel('Category') private categoryModel: Model<Category>) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = await this.generateUniqueSlug(createCategoryDto.name);
    
    const category = new this.categoryModel({
      ...createCategoryDto,
      slug,
    });

    const savedCategory = await category.save();

    // Si c'est une sous-catégorie, mettre à jour le parent
    if (createCategoryDto.parent) {
      await this.categoryModel.findByIdAndUpdate(
        createCategoryDto.parent,
        { $push: { children: savedCategory._id } }
      );
    }

    return savedCategory;
  }

  async findAll(status = CategoryStatus.ACTIVE): Promise<Category[]> {
    try {
      return this.categoryModel
        .find({ status })
        .sort({ sortOrder: 1, name: 1 })
        .exec();
    } catch (error) {
      console.error('Error in findAll:', error);
      // Retourner des catégories par défaut en cas d'erreur
      return this.categoryModel.find({ status: CategoryStatus.ACTIVE }).exec();
    }
  }

  async findTree(): Promise<Category[]> {
    const categories = await this.categoryModel
      .find({ status: CategoryStatus.ACTIVE })
      .sort({ sortOrder: 1, name: 1 })
      .populate('parent', 'name slug')
      .exec();

    return this.buildTree(categories);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel
      .findById(id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug status articlesCount')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel
      .findOne({ slug })
      .populate('parent', 'name slug')
      .populate('children', 'name slug status articlesCount')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updateData: any = { ...updateCategoryDto };

    if (updateCategoryDto.name) {
      updateData.slug = await this.generateUniqueSlug(updateCategoryDto.name, id);
    }

    // Gérer le changement de parent
    if (updateCategoryDto.parent !== undefined && updateCategoryDto.parent !== category.parent?.toString()) {
      // Retirer de l'ancien parent
      if (category.parent) {
        await this.categoryModel.findByIdAndUpdate(
          category.parent,
          { $pull: { children: id } }
        );
      }

      // Ajouter au nouveau parent
      if (updateCategoryDto.parent) {
        await this.categoryModel.findByIdAndUpdate(
          updateCategoryDto.parent,
          { $push: { children: id } }
        );
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate('parent', 'name slug')
      .populate('children', 'name slug status')
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException('Category not found');
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // No children or parent check needed with simplified schema

    await this.categoryModel.findByIdAndDelete(id);
  }

  // Articles count methods removed since articlesCount field was deleted

  async getPopularCategories(limit = 10): Promise<Category[]> {
    return this.categoryModel
      .find({ status: CategoryStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name slug imageUrl')
      .exec();
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let slug = slugify(name);
    let counter = 1;
    let originalSlug = slug;

    while (true) {
      const query: any = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existing = await this.categoryModel.findOne(query);
      if (!existing) {
        return slug;
      }

      slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }

  private buildTree(categories: Category[], parentId: string | null = null): Category[] {
    return categories
      .filter(category => {
        const categoryParent = category.parent as any;
        return parentId === null 
          ? !categoryParent 
          : categoryParent?.toString() === parentId;
      })
      .map(category => {
        const categoryObj = (category as any).toObject();
        categoryObj.children = this.buildTree(categories, (category as any)._id.toString());
        return categoryObj;
      });
  }
}