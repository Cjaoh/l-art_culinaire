export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum ArticleFeatureStatus {
  NONE = 'none',
  FEATURED = 'featured',
  TRENDING = 'trending'
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  editor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
  tags: string[];
  status: ArticleStatus;
  featureStatus: ArticleFeatureStatus;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  images: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  publishedAt?: string;
  rejectionReason?: string;
  allowComments: boolean;
  isPinned: boolean;
  scheduledFor?: string;
  readTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  title: string;
  excerpt: string;
  content: string;
  categories?: string[];
  tags?: string[];
  status?: ArticleStatus;
  featureStatus?: ArticleFeatureStatus;
  images?: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  allowComments?: boolean;
  isPinned?: boolean;
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {}

export interface ArticlesResponse {
  articles: Article[];
  total: number;
  pages: number;
}

export interface ModerationStats {
  published: number;
  pending: number;
  rejected: number;
  total: number;
}

export interface ModerationStatsResponse {
  data: ModerationStats;
  meta: {
    total: number;
  };
}

export interface Activity {
  type: 'submitted' | 'approved' | 'rejected' | 'commented';
  user: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  article: {
    _id: string;
    title: string;
  };
  timestamp: string;
  badge: string;
}