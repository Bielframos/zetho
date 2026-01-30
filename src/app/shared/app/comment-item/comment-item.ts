import { NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { appwrite } from '../../../core/appwrite/appwrite.client';
import { CommentsController } from '../../../core/comments/comments.controller';
import { CommentRow } from '../../../types';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.html',
  imports: [FormsModule, NgClass],
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

  getAvatar(gamertag: string) {
    return appwrite.avatars.getInitials({
      name: gamertag,
      width: 64,
      height: 64,
      background: '3e63dd',
    });
  }
}
