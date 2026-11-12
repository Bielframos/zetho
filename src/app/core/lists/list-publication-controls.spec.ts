import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialApi } from '../../shared/infra/social-api';
import { GameService } from '../games/games.service';
import { ListService } from './list.service';
import { ListPublicationControls } from './list-publication-controls';
import { ZereiListItemRowExpanded } from './list.controller';
import { SeoService } from '../system/seo/seo.service';
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
        {
          provide: SeoService,
          useValue: {
            toAbsoluteUrl: (path: string) => `https://zetho.test${path}`,
          },
        },
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
  const gameItem = (id: string, sources: string[] = []) =>
    ({
      $id: id,
      game: { $id: id, name: `Jogo ${id}`, slug: id },
      reason: 'Uma justificativa para a seleção.',
      sources,
    }) as ZereiListItemRowExpanded;
  it('uses the Zetho game page as the source for new editorial items and preserves existing references', async () => {
    select('a', 'draft');
    fixture.componentRef.setInput('items', [
      gameItem('one'),
      gameItem('two', ['https://publisher.test/game']),
    ]);
    fixture.detectChanges();
    await page.save();
    const content = request.calls.mostRecent().args[2].content;
    expect(content.items[0].sources).toEqual(['https://zetho.test/jogo/one']);
    expect(content.items[1].sources).toEqual(['https://publisher.test/game']);
  });
  it('keeps unsaved edits when opening the saved preview and blocks publication', async () => {
    select('a', 'draft');
    page.content.title = 'Título alterado';
    page.openPreview();
    expect(page.tab()).toBe('edit');
    expect(page.content.title).toBe('Título alterado');
    expect(page.message()).toContain('Salve');
    expect(request).not.toHaveBeenCalled();
    page.verified = true;
    await page.changeStatus('published');
    expect(request).not.toHaveBeenCalled();
  });
  it('saves the edited game order and requires checking the new version again', async () => {
    select('a', 'draft');
    fixture.componentRef.setInput('items', [gameItem('one'), gameItem('two')]);
    fixture.detectChanges();
    page.verified = true;
    page.moveItem(1, -1);
    expect(page.dirty).toBeTrue();
    expect(page.verified).toBeFalse();
    await page.save();
    expect(
      request.calls
        .mostRecent()
        .args[2].content.items.map((item: { gameId: string }) => item.gameId),
    ).toEqual(['two', 'one']);
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
