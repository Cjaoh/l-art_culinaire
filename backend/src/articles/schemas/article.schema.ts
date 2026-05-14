import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED'
}

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  author: Types.ObjectId;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }])
  categories: Types.ObjectId[];

  @Prop([String])
  tags: string[];

  @Prop({ required: true, enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status: ArticleStatus;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop([Types.ObjectId])
  likes: Types.ObjectId[]; // Array of User references

  @Prop()
  featuredImage?: string;

  @Prop({ type: Date })
  publishedAt?: Date;

  // Recipe-specific fields
  @Prop([{ name: String, quantity: String, unit: String }])
  ingredients: { name: string; quantity: string; unit: string; }[];

  @Prop([String])
  steps: string[];

  @Prop({ default: 0 })
  cookingTimeMinutes: number;

  @Prop({ default: 0 })
  preparationTimeMinutes: number;

  @Prop({ default: 1 })
  servings: number;

  @Prop()
  rejectionReason?: string;

  @Prop({ default: 0 })
  commentsCount?: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
export type ArticleDocument = HydratedDocument<Article>;
ArticleSchema.index({ 'ingredients.name': 'text' });
ArticleSchema.index({ cookingTimeMinutes: 1 });
ArticleSchema.index({ preparationTimeMinutes: 1 });
