import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../../../auth/auth.store';
import { CommentService } from '../../../comments/comments.service';
import {
  DashboardService,
  DashboardFeedItem,
  EntryComment,
} from '../../dashboard.service';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { EntryCommentsDrawer } from './entry-comments-drawer';

const item = (id: string): DashboardFeedItem => ({
  $id: id,
  type: 'status',
  $createdAt: new Date().toISOString(),
});

const commentItem = (id: string): DashboardFeedItem => ({
  $id: id,
  type: 'comment',
  gameId: 'game-1',
  $createdAt: new Date().toISOString(),
});

const comment = (entryId: string): EntryComment => ({
  $id: `comment-${entryId}`,
  $createdAt: new Date().toISOString(),
  entryId,
  profileId: 'profile-1',
  content: entryId,
  depth: 0,
  replyCount: 0,
});

describe('EntryCommentsDrawer item lifecycle', () => {
  it('keeps current A comments after switching A → B → A with an old request pending', async () => {
    let resolveFirstA!: (value: {
      items: EntryComment[];
      total: number;
      hasMore: boolean;
    }) => void;
    let aCalls = 0;
    const dashboard = {
      getEntryComments: jasmine.createSpy().and.callFake((entryId: string) => {
        if (entryId === 'entry-b') {
          return Promise.resolve({
            items: [comment(entryId)],
            total: 1,
            hasMore: false,
          });
        }
        aCalls += 1;
        if (aCalls === 1) {
          return new Promise((resolve) => (resolveFirstA = resolve));
        }
        return Promise.resolve({
          items: [comment('entry-a-current')],
          total: 1,
          hasMore: false,
        });
      }),
    };
    TestBed.configureTestingModule({
      imports: [EntryCommentsDrawer],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboard },
        { provide: CommentService, useValue: {} },
        {
          provide: AuthStore,
          useValue: { profile: () => null, isAdmin: () => false },
        },
        { provide: NotificationStore, useValue: { show: jasmine.createSpy() } },
      ],
    });
    const fixture = TestBed.createComponent(EntryCommentsDrawer);
    fixture.componentRef.setInput('item', item('entry-a'));
    fixture.detectChanges();

    fixture.componentRef.setInput('item', item('entry-b'));
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    fixture.componentRef.setInput('item', item('entry-a'));
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();

    resolveFirstA({
      items: [comment('entry-a-stale')],
      total: 1,
      hasMore: false,
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(
      fixture.componentInstance.roots().items.map((row) => row.$id),
    ).toEqual(['comment-entry-a-current']);
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('ignores a stale comment thread after switching A → B → A', async () => {
    let resolveFirstA!: (thread: unknown) => void;
    let aCalls = 0;
    const thread = (id: string) => {
      const row = {
        $id: id,
        $createdAt: new Date().toISOString(),
        content: id,
        depth: 0,
        replyCount: 0,
        userProfile: { gamertag: 'Tester', avatarUrl: null },
      };
      return { target: row, parent: row, replies: [], totalReplies: 0 };
    };
    const comments = {
      getCommentThread: jasmine
        .createSpy()
        .and.callFake((_gameId: string, commentId: string) => {
          if (commentId === 'entry-b')
            return Promise.resolve(thread('entry-b'));
          aCalls += 1;
          if (aCalls === 1)
            return new Promise((resolve) => (resolveFirstA = resolve));
          return Promise.resolve(thread('entry-a-current'));
        }),
      createComment: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      imports: [EntryCommentsDrawer],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: { getEntryComments: jasmine.createSpy() },
        },
        { provide: CommentService, useValue: comments },
        {
          provide: AuthStore,
          useValue: { profile: () => null, isAdmin: () => false },
        },
        { provide: NotificationStore, useValue: { show: jasmine.createSpy() } },
      ],
    });
    const fixture = TestBed.createComponent(EntryCommentsDrawer);
    fixture.componentRef.setInput('item', commentItem('entry-a'));
    fixture.detectChanges();

    fixture.componentRef.setInput('item', commentItem('entry-b'));
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    fixture.componentRef.setInput('item', commentItem('entry-a'));
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    resolveFirstA(thread('entry-a-stale'));
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.commentThreadParent()?.$id).toBe(
      'entry-a-current',
    );
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('does not clear a newer delete loading flag when an older request finishes', async () => {
    const deleteResolvers: Array<(result: { deletedCount: number }) => void> =
      [];
    const dashboard = {
      getEntryComments: jasmine.createSpy().and.resolveTo({
        items: [],
        total: 0,
        hasMore: false,
      }),
      deleteEntryComment: jasmine
        .createSpy()
        .and.callFake(
          () => new Promise((resolve) => deleteResolvers.push(resolve)),
        ),
    };
    TestBed.configureTestingModule({
      imports: [EntryCommentsDrawer],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboard },
        { provide: CommentService, useValue: {} },
        {
          provide: AuthStore,
          useValue: {
            profile: () => ({ $id: 'profile-1' }),
            isAdmin: () => false,
          },
        },
        { provide: NotificationStore, useValue: { show: jasmine.createSpy() } },
      ],
    });
    spyOn(window, 'confirm').and.returnValue(true);
    const fixture = TestBed.createComponent(EntryCommentsDrawer);
    fixture.componentRef.setInput('item', item('entry-a'));
    fixture.detectChanges();
    await Promise.resolve();

    const target = comment('entry-a');
    const oldDelete = fixture.componentInstance.deleteComment(target);
    fixture.componentRef.setInput('item', item('entry-b'));
    fixture.detectChanges();
    fixture.componentRef.setInput('item', item('entry-a'));
    fixture.detectChanges();
    const currentDelete = fixture.componentInstance.deleteComment(target);

    deleteResolvers[0]({ deletedCount: 1 });
    await oldDelete;
    expect(fixture.componentInstance.deletingIds().has(target.$id)).toBeTrue();

    deleteResolvers[1]({ deletedCount: 1 });
    await currentDelete;
    expect(fixture.componentInstance.deletingIds().has(target.$id)).toBeFalse();
    fixture.destroy();
    TestBed.resetTestingModule();
  });
});
