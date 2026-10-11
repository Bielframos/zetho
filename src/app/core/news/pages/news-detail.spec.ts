import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { NewsDetailPage } from './news-detail';
import { NewsService } from '../news.service';
import { SeoService } from '../../system/seo/seo.service';
import type { NewsDetail } from '../news.types';

describe('NewsDetail editorial images and HTML', () => {
  let page: NewsDetailPage;
  const article: NewsDetail = {
    $id: 'news',
    $createdAt: '2026-10-11',
    $updatedAt: '2026-10-11',
    title: 'A game announcement',
    subtitle: null,
    slug: 'announcement',
    tags: [],
    author: null,
    body: '<p>News</p>',
    originalSourceUrl: 'https://example.com/article',
    relatedGames: [],
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({})) },
        },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: NewsService, useValue: {} },
        { provide: SeoService, useValue: { clearJsonLd: () => {} } },
      ],
    });
    page = TestBed.runInInjectionContext(() => new NewsDetailPage());
  });
  it('shows only images with HTTPS source, descriptive alt and credit, and hides failed images', () => {
    page.news.set({
      ...article,
      mainImage: {
        url: 'https://example.com/game.png',
        alt: 'Gameplay',
        credit: 'Studio',
        sourceUrl: 'https://example.com/article',
      },
    });
    expect(page.editorialImage()?.credit).toBe('Studio');
    page.imageFailed.set(true);
    expect(page.editorialImage()).toBeNull();
    page.imageFailed.set(false);
    page.news.set({
      ...article,
      mainImage: {
        url: 'javascript:alert(1)',
        alt: 'Gameplay',
        credit: 'Studio',
        sourceUrl: 'https://example.com',
      },
    });
    expect(page.editorialImage()).toBeNull();
  });
  it('falls back without image when legacy metadata lacks attribution', () => {
    page.news.set({
      ...article,
      mainImage: { url: 'https://example.com/game.png' },
    });
    expect(page.editorialImage()).toBeNull();
  });
  it('removes unsafe markup but preserves known YouTube embeds', () => {
    page.news.set({
      ...article,
      body: '<p onclick="evil()">News</p><script>evil()</script><iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe><iframe src="https://evil.com"></iframe>',
    });
    const rendered = String(page.renderedBody());
    expect(rendered).not.toContain('onclick');
    expect(rendered).not.toContain('<script');
    expect(rendered).not.toContain('https://evil.com');
    expect(rendered).toContain('https://www.youtube.com/embed/abcdefghijk');
  });
});
