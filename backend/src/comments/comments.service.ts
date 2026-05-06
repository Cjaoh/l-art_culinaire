import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentStatus, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationHelper, PaginationResult } from '../common/helpers/pagination.helper';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel('Comment') private commentModel: Model<CommentDocument>,
    @InjectModel('Article') private articleModel: Model<any>
  ) {}

  // ================= CREATE =================

  async create(dto: CreateCommentDto, authorId: string) {
    const comment = await this.commentModel.create({
      ...dto,
      author: authorId,
      article: dto.article,
      parent: dto.parent || undefined,
      status: CommentStatus.PENDING,
    });

    // Incrémenter le compteur de commentaires de l'article
    await this.articleModel.findByIdAndUpdate(dto.article, {
      $inc: { commentsCount: 1 },
    });

    return comment.populate('author', 'name');
  }

  // ================= READ =================

  async findAll(
    page = 1,
    limit = 10,
    status = CommentStatus.APPROVED,
    articleId?: string,
    authorId?: string,
  ): Promise<PaginationResult<CommentDocument>> {

    const query: any = { status };

    if (articleId) {
      query.article = new Types.ObjectId(articleId);
    }

    if (authorId) {
      query.author = new Types.ObjectId(authorId);
    }

    const { skip, limit: queryLimit } = PaginationHelper.createQuery(page, limit);

    const [data, total] = await Promise.all([
      this.commentModel.find(query)
        .populate('author', 'name')
        .populate('article', 'title')
        .populate('parent', 'content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      this.commentModel.countDocuments(query),
    ]);

    return PaginationHelper.createPaginationResult(data, total, page, limit);
  }

  async findByArticle(articleId: string, page = 1, limit = 10) {
    return this.findAll(page, limit, CommentStatus.APPROVED, articleId);
  }

  async findReplies(commentId: string) {
    return this.commentModel.find({ parent: commentId })
      .populate('author', 'name')
      .sort({ createdAt: 1 });
  }

  async findOne(id: string) {
    const comment = await this.commentModel.findById(id)
      .populate('author', 'name')
      .populate('article', 'title')
      .populate('parent', 'content')
      .populate('moderatedBy', 'name');
    
    if (!comment) throw new NotFoundException();
    return comment;
  }

  async getPendingComments(page = 1, limit = 10) {
    return this.findAll(page, limit, CommentStatus.PENDING);
  }

  async getReportedComments(page = 1, limit = 10) {
    const query = { reportsCount: { $gt: 0 } };
    
    const { skip, limit: queryLimit } = PaginationHelper.createQuery(page, limit);

    const [data, total] = await Promise.all([
      this.commentModel.find(query)
        .populate('author', 'name')
        .populate('article', 'title')
        .sort({ reportsCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(queryLimit),
      this.commentModel.countDocuments(query),
    ]);

    return PaginationHelper.createPaginationResult(data, total, page, limit);
  }

  // ================= UPDATE =================

  async update(id: string, dto: UpdateCommentDto, userId: string, role: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    this.checkUpdatePermission(comment, userId, role);

    return this.commentModel.findByIdAndUpdate(id, dto, { new: true })
      .populate('author', 'name');
  }

  async approveComment(id: string, moderatorId: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    return this.commentModel.findByIdAndUpdate(id, {
      status: CommentStatus.APPROVED,
      moderatedBy: new Types.ObjectId(moderatorId),
      moderatedAt: new Date(),
    }, { returnDocument: 'after' }).populate('author', 'name');
  }

  async rejectComment(id: string, moderatorId: string, reason?: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    const updateData: any = {
      status: CommentStatus.REJECTED,
      moderatedBy: new Types.ObjectId(moderatorId),
      moderatedAt: new Date(),
    };

    if (reason) {
      updateData.moderationReason = reason;
    }

    // Décrémenter le compteur de commentaires de l'article
    await this.articleModel.findByIdAndUpdate(comment.article, {
      $inc: { commentsCount: -1 },
    });

    return this.commentModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('author', 'name');
  }

  async markAsSpam(id: string, moderatorId: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    // Décrémenter le compteur de commentaires de l'article
    await this.articleModel.findByIdAndUpdate(comment.article, {
      $inc: { commentsCount: -1 },
    });

    return this.commentModel.findByIdAndUpdate(id, {
      status: CommentStatus.SPAM,
      moderatedBy: new Types.ObjectId(moderatorId),
      moderatedAt: new Date(),
    }, { returnDocument: 'after' }).populate('author', 'name');
  }

  async reportComment(id: string, userId: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    const userObjectId = new Types.ObjectId(userId);
    
    // Vérifier si l'utilisateur a déjà signalé ce commentaire
    if (comment.reportedBy?.some(id => id.toString() === userObjectId.toString())) {
      throw new ForbiddenException('You have already reported this comment');
    }

    return this.commentModel.findByIdAndUpdate(id, {
      $inc: { reportsCount: 1 },
      $addToSet: { reportedBy: userObjectId }
    }, { returnDocument: 'after' }).populate('author', 'name');
  }

  async incrementLikes(id: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    return this.commentModel.findByIdAndUpdate(id, {
      $inc: { likesCount: 1 },
    }, { returnDocument: 'after' });
  }

  async decrementLikes(id: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    if (comment.likesCount && comment.likesCount > 0) {
      return this.commentModel.findByIdAndUpdate(id, {
        $inc: { likesCount: -1 },
      }, { returnDocument: 'after' });
    }

    return comment;
  }

  // ================= DELETE =================

  async remove(id: string, userId: string, role: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException();

    this.checkDeletePermission(comment, userId, role);

    // Décrémenter le compteur de commentaires de l'article
    await this.articleModel.findByIdAndUpdate(comment.article, {
      $inc: { commentsCount: -1 },
    });

    await this.commentModel.findByIdAndDelete(id);
  }

  // ================= UTILS =================

  private checkUpdatePermission(comment: CommentDocument, userId: string, role: string) {
    if (role === UserRole.ADMIN || role === UserRole.EDITOR) return;
    if (comment.author.toString() === userId) return;
    throw new ForbiddenException();
  }

  private checkDeletePermission(comment: CommentDocument, userId: string, role: string) {
    if (role === UserRole.ADMIN) return;
    if (comment.author.toString() === userId) return;
    throw new ForbiddenException();
  }
}