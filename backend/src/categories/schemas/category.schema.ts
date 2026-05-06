import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ type: String, ref: 'Category' })
  parent?: string;

  @Prop({ type: [String], ref: 'Category' })
  children: string[] = [];

  @Prop({ required: true, enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  status: CategoryStatus = CategoryStatus.ACTIVE;

  @Prop()
  imageUrl?: string;

  @Prop({ default: 0 })
  articlesCount: number = 0;

  @Prop({ default: 0 })
  sortOrder: number = 0;

  @Prop()
  icon?: string;

  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
export type CategoryDocument = HydratedDocument<Category>;
