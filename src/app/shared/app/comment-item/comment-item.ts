import { NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { appwrite } from '../../../core/appwrite/appwrite.client';
import { CommentsController } from '../../../core/comments/comments.controller';
import { CommentRow, UserProfileRow } from '../../../types';
import { RouterLink } from '@angular/router';
import { UiLoading } from '../../ui/loading';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.html',
  imports: [FormsModule, NgClass, RouterLink, UiLoading],
})
export class AppCommentItem {
  controller = inject(CommentsController);
  comment = input.required<CommentRow>();
  replies = input<CommentRow[]>([]);
  isLoadingReplies = input(false);

  get depth() {
    return this.comment().depth || 0;
  }

  loadReplies = output();
  reply = output<string>();

  showReplyBox = false;
  replyContent = '';

  toggleReplyBox() {
    this.showReplyBox = !this.showReplyBox;
  }

  onSendReply() {
    if (!this.replyContent.trim()) return;

    this.reply.emit(this.replyContent.trim());
    this.replyContent = '';
    this.showReplyBox = false;
  }

  getAvatar(profile: UserProfileRow) {
    if (profile.avatarUrl) return profile.avatarUrl;

    return appwrite.avatars.getInitials({
      name: profile.gamertag,
      width: 64,
      height: 64,
      background: '3e63dd',
    });
  }
}
