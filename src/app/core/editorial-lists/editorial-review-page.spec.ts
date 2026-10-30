import { TestBed } from '@angular/core/testing';
import { SocialApi } from '../../shared/infra/social-api';
import { EditorialReviewPage } from './editorial-review-page';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const draft = (id: string, status = 'published', revision = id) => ({
  $id: id,
  status,
  revision,
  payload: JSON.stringify({ title: id, items: [] }),
});

describe('Editorial review selection', () => {
  let page: EditorialReviewPage;
  let request: jasmine.Spy;
  beforeEach(async () => {
    request = jasmine.createSpy().and.resolveTo({ rows: [] });
    TestBed.configureTestingModule({
      providers: [{ provide: SocialApi, useValue: { request } }],
    });
    page = TestBed.runInInjectionContext(() => new EditorialReviewPage());
    await Promise.resolve();
    await Promise.resolve();
    request.calls.reset();
  });
  afterEach(() => page.ngOnDestroy());

  for (const returnToOriginal of [false, true]) {
    it(`discards a late preview after switching lists${returnToOriginal ? ' and returning' : ''}`, async () => {
      const response = deferred<{ body: string }>();
      request.and.returnValue(response.promise);
      page.select(draft('a'));
      const pending = page.action('post');
      page.select(draft('b'));
      if (returnToOriginal) page.select(draft('a'));
      response.resolve({ body: '<p>Preview of A</p>' });
      await pending;

      expect(page.selected()?.$id).toBe(returnToOriginal ? 'a' : 'b');
      expect(page.postBody()).toBe('');
      expect(page.message()).toBe('');
      await page.action('publish-post');
      expect(request).toHaveBeenCalledTimes(1);
    });
  }

  it('publishes the previewed list and requires a fresh preview after a revision change', async () => {
    request.and.resolveTo({ body: '<p>Reviewed post</p>' });
    page.select(draft('a'));
    await page.action('post');
    expect(page.postBody()).toBe('<p>Reviewed post</p>');
    await page.action('publish-post');
    expect(request).toHaveBeenCalledWith(
      'editorial-lists/review/a/publish-post',
      'POST',
      {
        revision: 'a',
        sourcesVerified: false,
      },
    );
    page.select(draft('a', 'published', 'new-revision'));
    request.calls.reset();
    await page.action('publish-post');
    expect(request).not.toHaveBeenCalled();
    expect(page.postBody()).toBe('');
  });

  it('does not mark another draft as published when approval finishes', async () => {
    const response = deferred<object>();
    request.and.returnValue(response.promise);
    page.select(draft('a', 'draft'));
    const pending = page.action('approve');
    page.select(draft('b', 'draft'));
    response.resolve({});
    await pending;
    expect(page.selected()?.$id).toBe('b');
    expect(page.published()).toBeFalse();
    expect(page.message()).toBe('');
  });

  it('does not replace the selected draft with a late saved revision', async () => {
    const response = deferred<ReturnType<typeof draft>>();
    request.and.returnValue(response.promise);
    page.select(draft('a', 'draft'));
    const pending = page.save();
    page.select(draft('b', 'draft'));
    response.resolve(draft('a', 'draft', 'saved-revision'));
    await pending;
    expect(page.selected()?.$id).toBe('b');
    expect(page.message()).toBe('');
  });

  it('ignores errors from a previous selection', async () => {
    const response = deferred<object>();
    request.and.returnValue(response.promise);
    page.select(draft('a'));
    const pending = page.action('post');
    page.select(draft('b'));
    response.reject(new Error('Unavailable'));
    await pending;
    expect(page.message()).toBe('');
    expect(page.busy()).toBeFalse();
  });

  it('discards previews returned after leaving the page', async () => {
    const response = deferred<{ body: string }>();
    request.and.returnValue(response.promise);
    page.select(draft('a'));
    const pending = page.action('post');
    page.ngOnDestroy();
    response.resolve({ body: '<p>Old preview</p>' });
    await pending;
    expect(page.postBody()).toBe('');
    expect(page.message()).toBe('');
  });
});
