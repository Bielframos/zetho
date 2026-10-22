import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { GameService } from '../games/games.service';
import { NotificationStore } from '../system/notifications/notification.store';
import { SeoService } from '../system/seo/seo.service';
import { ZCoinsService } from '../zCoins/zcoins.service';
import { SocialApi } from '../../shared/infra/social-api';
import { ForumService } from './forum.service';
import { ForumFeedPage } from './pages/forum-feed/forum-feed';
import { ForumPostPage } from './pages/forum-post/forum-post';
import { ForumPostDetailResponse, ForumPostsPageResponse } from './forum.types';

describe('ForumService', () => {
  let service: ForumService;
  let apiSpy: jasmine.SpyObj<SocialApi>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<SocialApi>('SocialApi', [
      'request',
      'requestPublic',
    ]);
    isAuthenticated = signal(false);

    TestBed.configureTestingModule({
      providers: [
        ForumService,
        { provide: SocialApi, useValue: apiSpy },
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => isAuthenticated(),
          },
        },
      ],
    });

    service = TestBed.inject(ForumService);
  });

  it('uses requestPublic when unauthenticated and request when authenticated', async () => {
    const emptyFeed: ForumPostsPageResponse = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
      hasMore: false,
      game: null,
    };
    apiSpy.requestPublic.and.resolveTo(emptyFeed);
    apiSpy.request.and.resolveTo(emptyFeed);

    await service.getPosts({ page: 1, sort: 'recent' });
    expect(apiSpy.requestPublic).toHaveBeenCalledWith(
      'forum/posts?page=1&sort=recent',
    );

    isAuthenticated.set(true);
    await service.getPosts({ page: 1, gameSlug: 'elden-ring', sort: 'top' });
    expect(apiSpy.request).toHaveBeenCalledWith(
      'forum/posts?page=1&gameSlug=elden-ring&sort=top',
      'GET',
    );
  });

  it('returns null on 404 when fetching post by slug or id', async () => {
    apiSpy.requestPublic.and.rejectWith(
      new Error('API request failed (404)'),
    );

    const res = await service.getPostBySlugOrId('inexistente');
    expect(res).toBeNull();
  });

  it('sends createPost, updateComment, deleteComment, and voteComment to social endpoints', async () => {
    apiSpy.request.and.resolveTo({ $id: 'c1' } as any);

    await service.createPost({
      gameId: 'g1',
      title: 'Título',
      content: '<p>Conteúdo</p>',
    });
    expect(apiSpy.request).toHaveBeenCalledWith('social/comments', 'POST', {
      gameId: 'g1',
      title: 'Título',
      content: '<p>Conteúdo</p>',
    });

    await service.updateComment('c1', {
      title: 'Novo título',
      content: '<p>Editado</p>',
    });
    expect(apiSpy.request).toHaveBeenCalledWith(
      'social/comments/c1',
      'PATCH',
      {
        title: 'Novo título',
        content: '<p>Editado</p>',
      },
    );

    await service.deleteComment('c1');
    expect(apiSpy.request).toHaveBeenCalledWith(
      'social/comments/c1',
      'DELETE',
    );

    await service.voteComment('c1', 'up');
    expect(apiSpy.request).toHaveBeenCalledWith(
      'social/comments/c1/vote',
      'POST',
      { type: 'up' },
    );
  });
});

describe('ForumFeedPage', () => {
  it('loads forum posts, applies SEO, and ignores stale responses on rapid filter change (A -> B -> A)', async () => {
    const queryParams$ = new BehaviorSubject(convertToParamMap({}));
    const user = signal<any>({ $id: 'u1' });
    const profile = signal<any>({
      $id: 'p1',
      gamertag: 'biel',
      avatarUrl: null,
    });

    let resolveFirstCall!: (value: ForumPostsPageResponse) => void;
    const firstCallPromise = new Promise<ForumPostsPageResponse>((resolve) => {
      resolveFirstCall = resolve;
    });

    const forumServiceSpy = jasmine.createSpyObj<ForumService>('ForumService', [
      'getPosts',
      'createPost',
      'voteComment',
    ]);

    forumServiceSpy.getPosts.and.callFake((params) => {
      if (params?.sort === 'top') {
        return firstCallPromise;
      }
      return Promise.resolve({
        items: [
          {
            $id: 'post-recent',
            $createdAt: '2026-04-01T12:00:00.000Z',
            gameId: 'g1',
            title: 'Discussão recente',
            slug: 'discussao-recente--post-recent',
            content: '<p>Texto recente</p>',
            excerpt: 'Texto recente',
            parentId: null,
            depth: 0,
            voteCount: 3,
            replyCount: 1,
            viewerVote: null,
            author: { $id: 'p1', gamertag: 'biel', avatarUrl: null },
            game: {
              $id: 'g1',
              name: 'Elden Ring',
              slug: 'elden-ring',
              coverUrl: null,
              releaseYear: '2022',
            },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
        hasMore: false,
        game: null,
      });
    });

    const seoSpy = jasmine.createSpyObj<SeoService>('SeoService', [
      'apply',
      'setJsonLd',
      'clearJsonLd',
      'toAbsoluteUrl',
    ]);
    seoSpy.toAbsoluteUrl.and.callFake((p: string) => `https://zetho.gg${p}`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParams$.asObservable() },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate') },
        },
        {
          provide: AuthStore,
          useValue: {
            user,
            profile,
            isAuthenticated: () => !!user(),
          },
        },
        { provide: ForumService, useValue: forumServiceSpy },
        {
          provide: GameService,
          useValue: { searchGame: jasmine.createSpy('searchGame') },
        },
        {
          provide: NotificationStore,
          useValue: { show: jasmine.createSpy('show') },
        },
        { provide: SeoService, useValue: seoSpy },
        {
          provide: ZCoinsService,
          useValue: {
            applyInput: jasmine
              .createSpy('applyInput')
              .and.resolveTo(undefined),
          },
        },
      ],
    }).overrideComponent(ForumFeedPage, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ForumFeedPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.posts().length).toBe(1);
    expect(component.posts()[0].$id).toBe('post-recent');
    expect(seoSpy.apply).toHaveBeenCalled();
    expect(seoSpy.setJsonLd).toHaveBeenCalledWith(
      'forum-feed',
      jasmine.objectContaining({ '@type': 'CollectionPage' }),
    );

    // Switch sort to 'top' (slow call) and immediately back to 'recent' (fast call)
    component.setSort('top');
    fixture.detectChanges();
    component.setSort('recent');
    fixture.detectChanges();
    await fixture.whenStable();

    // Now resolve the stale 'top' call and verify it does NOT overwrite the 'recent' state
    resolveFirstCall({
      items: [
        {
          $id: 'post-stale-top',
          $createdAt: '2026-04-01T10:00:00.000Z',
          gameId: 'g1',
          title: 'Stale top',
          slug: 'stale-top--post-stale-top',
          content: '<p>Stale</p>',
          excerpt: 'Stale',
          parentId: null,
          depth: 0,
          voteCount: 99,
          replyCount: 0,
          viewerVote: null,
          author: null,
          game: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
      hasMore: false,
      game: null,
    });
    await fixture.whenStable();

    expect(component.posts().map((p) => p.$id)).toEqual(['post-recent']);
  });
});

describe('ForumPostPage', () => {
  it('loads thread, applies DiscussionForumPosting JSON-LD, and redirects non-canonical slug', async () => {
    const detailResponse: ForumPostDetailResponse = {
      post: {
        $id: 'post1',
        $createdAt: '2026-04-01T12:00:00.000Z',
        gameId: 'g1',
        title: 'Teoria sobre o final de Elden Ring',
        slug: 'teoria-sobre-o-final-de-elden-ring--post1',
        content: '<p>Conteúdo completo com mais de cinquenta caracteres para indexação no Google.</p>',
        excerpt: 'Conteúdo completo com mais de cinquenta caracteres para indexação no Google.',
        parentId: null,
        depth: 0,
        voteCount: 10,
        replyCount: 1,
        viewerVote: null,
        author: { $id: 'p1', gamertag: 'biel', avatarUrl: null },
        game: {
          $id: 'g1',
          name: 'Elden Ring',
          slug: 'elden-ring',
          coverUrl: 'https://cdn.example/cover.jpg',
          releaseYear: '2022',
        },
      },
      replies: {
        items: [
          {
            $id: 'reply1',
            $createdAt: '2026-04-01T12:10:00.000Z',
            gameId: 'g1',
            title: '',
            slug: '',
            content: '<p>Concordo totalmente!</p>',
            excerpt: 'Concordo totalmente!',
            parentId: 'post1',
            depth: 1,
            voteCount: 2,
            replyCount: 0,
            viewerVote: null,
            author: { $id: 'p2', gamertag: 'maria', avatarUrl: null },
            game: null,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasMore: false,
      },
      focusedThread: {
        targetCommentId: 'reply1',
        ancestorIds: ['post1'],
        repliesByParentId: {},
      },
      seo: {
        indexable: true,
        canonicalSlug: 'teoria-sobre-o-final-de-elden-ring--post1',
        description:
          'Conteúdo completo com mais de cinquenta caracteres para indexação no Google.',
      },
    };

    const forumServiceSpy = jasmine.createSpyObj<ForumService>('ForumService', [
      'getPostBySlugOrId',
      'getReplies',
      'createReply',
      'updateComment',
      'deleteComment',
      'voteComment',
    ]);
    forumServiceSpy.getPostBySlugOrId.and.resolveTo(detailResponse);

    const navigateSpy = jasmine.createSpy('navigate');
    const seoSpy = jasmine.createSpyObj<SeoService>('SeoService', [
      'apply',
      'setJsonLd',
      'clearJsonLd',
      'toAbsoluteUrl',
    ]);
    seoSpy.toAbsoluteUrl.and.callFake((p: string) => `https://zetho.gg${p}`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'reply1' })),
            queryParamMap: of(convertToParamMap({ commentId: 'reply1' })),
          },
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
        {
          provide: AuthStore,
          useValue: {
            user: signal({ $id: 'u1' }),
            profile: signal({ $id: 'p1', gamertag: 'biel' }),
            isAuthenticated: () => true,
            isAdmin: () => false,
          },
        },
        { provide: ForumService, useValue: forumServiceSpy },
        {
          provide: NotificationStore,
          useValue: { show: jasmine.createSpy('show') },
        },
        { provide: SeoService, useValue: seoSpy },
        {
          provide: ZCoinsService,
          useValue: {
            applyInput: jasmine
              .createSpy('applyInput')
              .and.resolveTo(undefined),
          },
        },
      ],
    }).overrideComponent(ForumPostPage, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(ForumPostPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.post()?.$id).toBe('post1');
    expect(component.replies().length).toBe(1);
    expect(seoSpy.apply).toHaveBeenCalledWith(
      jasmine.objectContaining({
        canonical: '/forum/teoria-sobre-o-final-de-elden-ring--post1',
        robots: 'index,follow',
        ogType: 'article',
      }),
    );
    expect(seoSpy.setJsonLd).toHaveBeenCalledWith(
      'forum-post',
      jasmine.objectContaining({
        '@type': 'DiscussionForumPosting',
        headline: 'Teoria sobre o final de Elden Ring',
      }),
    );
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/forum', 'teoria-sobre-o-final-de-elden-ring--post1'],
      {
        replaceUrl: true,
        queryParams: { commentId: 'reply1' },
      },
    );
  });
});
