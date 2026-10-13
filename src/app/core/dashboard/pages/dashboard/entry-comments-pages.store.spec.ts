import { TestBed } from '@angular/core/testing';
import { DashboardService, EntryComment } from '../../dashboard.service';
import { NotificationStore } from '../../../system/notifications/notification.store';
import { EntryCommentsPagesStore } from './entry-comments-pages.store';

const comment = (id: string, parentId: string | null = null): EntryComment => ({
  $id: id,
  $createdAt: new Date().toISOString(),
  entryId: 'entry-a',
  profileId: 'profile-1',
  content: id,
  parentId,
  depth: parentId ? 1 : 0,
  replyCount: 0,
});

describe('EntryCommentsPagesStore', () => {
  let service: { getEntryComments: jasmine.Spy };
  let notifications: { show: jasmine.Spy };
  let store: EntryCommentsPagesStore;

  beforeEach(() => {
    service = { getEntryComments: jasmine.createSpy() };
    notifications = { show: jasmine.createSpy() };
    TestBed.configureTestingModule({
      providers: [
        EntryCommentsPagesStore,
        { provide: DashboardService, useValue: service },
        { provide: NotificationStore, useValue: notifications },
      ],
    });
    store = TestBed.inject(EntryCommentsPagesStore);
  });

  it('ignores an old A response after the drawer changes A → B → A', async () => {
    let resolveFirstA!: (value: {
      items: EntryComment[];
      total: number;
      hasMore: boolean;
    }) => void;
    let aCalls = 0;
    service.getEntryComments.and.callFake((entryId: string) => {
      if (entryId === 'entry-b') {
        return Promise.resolve({
          items: [comment('entry-b')],
          total: 1,
          hasMore: false,
        });
      }
      aCalls += 1;
      if (aCalls === 1) {
        return new Promise((resolve) => (resolveFirstA = resolve));
      }
      return Promise.resolve({
        items: [comment('current-entry-a')],
        total: 1,
        hasMore: false,
      });
    });

    store.reset('entry-a');
    const firstARequest = store.loadRoots();
    store.reset('entry-b');
    await store.loadRoots();
    store.reset('entry-a');
    await store.loadRoots();
    resolveFirstA({
      items: [comment('stale-entry-a')],
      total: 1,
      hasMore: false,
    });
    await firstARequest;

    expect(store.roots().items.map((item) => item.$id)).toEqual([
      'current-entry-a',
    ]);
    expect(store.roots().loading).toBeFalse();
  });

  it('merges a root page with concurrent inserts and filters deleted comments', async () => {
    let resolveNextPage!: (value: {
      items: EntryComment[];
      total: number;
      hasMore: boolean;
    }) => void;
    service.getEntryComments.and.returnValues(
      Promise.resolve({
        items: [comment('root-to-delete'), comment('root-keep')],
        total: 3,
        hasMore: true,
      }),
      new Promise((resolve) => (resolveNextPage = resolve)),
    );
    store.reset('entry-a');
    await store.loadRoots();

    const nextPage = store.loadRoots();
    store.prependRoot(comment('root-created-locally'));
    store.removeComment(comment('root-to-delete'));
    resolveNextPage({
      items: [comment('root-to-delete'), comment('root-from-server')],
      total: 3,
      hasMore: false,
    });
    await nextPage;

    expect(store.roots().items.map((item) => item.$id)).toEqual([
      'root-created-locally',
      'root-keep',
      'root-from-server',
    ]);
  });

  it('merges reply pagination with concurrent inserts and does not restore deletions', async () => {
    let resolveNextPage!: (value: {
      items: EntryComment[];
      total: number;
      hasMore: boolean;
    }) => void;
    service.getEntryComments.and.returnValues(
      Promise.resolve({
        items: [comment('reply-to-delete', 'root-1')],
        total: 2,
        hasMore: true,
      }),
      new Promise((resolve) => (resolveNextPage = resolve)),
    );
    store.reset('entry-a');
    await store.loadReplies('root-1');

    const nextPage = store.loadReplies('root-1');
    store.prependReply('root-1', comment('reply-created-locally', 'root-1'));
    store.removeComment(comment('reply-to-delete', 'root-1'));
    resolveNextPage({
      items: [
        comment('reply-to-delete', 'root-1'),
        comment('reply-from-server', 'root-1'),
      ],
      total: 2,
      hasMore: false,
    });
    await nextPage;

    expect(store.replyPage('root-1').items.map((item) => item.$id)).toEqual([
      'reply-created-locally',
      'reply-from-server',
    ]);
  });

  it('discards replies that finish loading after their parent is deleted', async () => {
    let resolveReplies!: (value: {
      items: EntryComment[];
      total: number;
      hasMore: boolean;
    }) => void;
    service.getEntryComments.and.returnValue(
      new Promise((resolve) => (resolveReplies = resolve)),
    );
    store.reset('entry-a');
    store.roots.set({
      items: [comment('root-to-delete')],
      page: 1,
      hasMore: false,
      loading: false,
    });

    const request = store.loadReplies('root-to-delete');
    store.removeComment(comment('root-to-delete'));
    resolveReplies({
      items: [comment('reply-from-stale-response', 'root-to-delete')],
      total: 1,
      hasMore: false,
    });
    await request;

    expect(store.roots().items).toEqual([]);
    expect(store.replies()).toEqual({});
    expect(store.replyPage('root-to-delete').loading).toBeFalse();
  });

  it('keeps the last root page and retries the same page after a load failure', async () => {
    service.getEntryComments.and.returnValues(
      Promise.resolve({ items: [comment('root-1')], total: 2, hasMore: true }),
      Promise.reject(new Error('Falha na página seguinte')),
      Promise.resolve({ items: [comment('root-2')], total: 2, hasMore: false }),
    );
    store.reset('entry-a');

    await store.loadRoots();
    await store.loadRoots();

    expect(store.roots().items.map((item) => item.$id)).toEqual(['root-1']);
    expect(store.roots()).toEqual(
      jasmine.objectContaining({ page: 1, hasMore: true, loading: false }),
    );
    expect(notifications.show).toHaveBeenCalledOnceWith({
      message: 'Falha na página seguinte',
      type: 'error',
    });

    await store.loadRoots();
    expect(service.getEntryComments.calls.argsFor(2)).toEqual(['entry-a', 2]);
    expect(store.roots().items.map((item) => item.$id)).toEqual([
      'root-1',
      'root-2',
    ]);
  });

  it('keeps reply pagination retryable after a page failure', async () => {
    service.getEntryComments.and.returnValues(
      Promise.resolve({
        items: [comment('reply-1', 'root-1')],
        total: 2,
        hasMore: true,
      }),
      Promise.reject(new Error('Falha nas respostas')),
      Promise.resolve({
        items: [comment('reply-2', 'root-1')],
        total: 2,
        hasMore: false,
      }),
    );
    store.reset('entry-a');

    await store.loadReplies('root-1');
    await store.loadReplies('root-1');

    expect(store.replyPage('root-1').page).toBe(1);
    expect(store.replyPage('root-1').loading).toBeFalse();
    await store.loadReplies('root-1');

    expect(service.getEntryComments.calls.argsFor(2)).toEqual([
      'entry-a',
      2,
      20,
      'root-1',
    ]);
    expect(store.replyPage('root-1').items.map((item) => item.$id)).toEqual([
      'reply-1',
      'reply-2',
    ]);
  });
});
