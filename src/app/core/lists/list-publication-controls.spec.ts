import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialApi } from '../../shared/infra/social-api';
import { GameService } from '../games/games.service';
import { ListService } from './list.service';
import { ListPublicationControls } from './list-publication-controls';
import { ZereiListRow } from './lists.type';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const draft = (id: string, status = 'published', revision = id) =>
  ({
    $id: id,
    title: id,
    status,
    revision,
    ownerType: 'system',
    criteria: 'Seleção revisada por nossa equipe',
    kind: 'thematic',
  }) as ZereiListRow;
describe('Publication within the existing list page', () => {
  let fixture: ComponentFixture<ListPublicationControls>;
  let page: ListPublicationControls;
  let request: jasmine.Spy;
  const select = (id: string, status = 'published', revision = id) => {
    fixture.componentRef.setInput('list', draft(id, status, revision));
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
  };
  beforeEach(() => {
    request = jasmine.createSpy().and.resolveTo({});
    TestBed.configureTestingModule({
      imports: [ListPublicationControls],
      providers: [
        { provide: SocialApi, useValue: { request } },
        {
          provide: GameService,
          useValue: {
            searchGame: jasmine.createSpy().and.resolveTo({ rows: [] }),
          },
        },
        {
          provide: ListService,
          useValue: { addToList: jasmine.createSpy().and.resolveTo({}) },
        },
      ],
    });
    fixture = TestBed.createComponent(ListPublicationControls);
    page = fixture.componentInstance;
    select('a');
  });
  for (const back of [false, true])
    it(`discards late previews after selection changes${back ? ' A→B→A' : ''}`, async () => {
      const response = deferred<{ body: string }>();
      request.and.returnValue(response.promise);
      const pending = page.generatePost();
      select('b');
      if (back) select('a');
      response.resolve({ body: '<p>Old preview</p>' });
      await pending;
      expect(page.postBody()).toBe('');
      await page.publishPost();
      expect(request).toHaveBeenCalledTimes(1);
    });
  it('only publishes the previewed revision', async () => {
    request.and.resolveTo({ body: '<p>Reviewed post</p>' });
    await page.generatePost();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reviewed post');
    await page.publishPost();
    expect(request).toHaveBeenCalledWith('lists/a/publish-post', 'POST', {
      revision: 'a',
    });
    select('a', 'published', 'new');
    request.calls.reset();
    await page.publishPost();
    expect(request).not.toHaveBeenCalled();
  });
  it('requires saving changes before publishing and sends explicit verification', async () => {
    select('a', 'draft');
    page.verified = true;
    page.content.criteria = 'Critérios alterados após carregar';
    await page.changeStatus('published');
    expect(request).not.toHaveBeenCalled();
    expect(page.message()).toContain('Salve');
    select('a', 'draft');
    page.verified = true;
    await page.changeStatus('published');
    expect(request).toHaveBeenCalledWith('lists/a/status', 'POST', {
      status: 'published',
      revision: 'a',
      sourcesVerified: true,
    });
  });
  it('does not reload a different list after a late save', async () => {
    const response = deferred<object>();
    request.and.returnValue(response.promise);
    const changed = jasmine.createSpy();
    page.changed.subscribe(changed);
    select('a', 'draft');
    const pending = page.save();
    select('b', 'draft');
    response.resolve({});
    await pending;
    expect(changed).not.toHaveBeenCalled();
  });
  it('ignores an old error and a response after leaving the page', async () => {
    const response = deferred<{ body: string }>();
    request.and.returnValue(response.promise);
    const pending = page.generatePost();
    select('b');
    response.reject(new Error('unavailable'));
    await pending;
    expect(page.message()).toBe('');
    const late = deferred<{ body: string }>();
    request.and.returnValue(late.promise);
    const next = page.generatePost();
    fixture.destroy();
    late.resolve({ body: 'old' });
    await next;
    expect(page.postBody()).toBe('');
  });
});
