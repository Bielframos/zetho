import { ListController } from './list.controller';
import { ListService } from './list.service';
import { ProfileStore } from '../userProfiles/profile.store';
import { ZereiListRow } from './lists.type';
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
describe('Shared list detail loading', () => {
  it('discards a draft response after changing selection A→B→A', async () => {
    const old = deferred<ZereiListRow>();
    const current = {
      $id: 'a',
      ownerType: 'system',
      status: 'published',
      title: 'Current',
    } as ZereiListRow;
    const service = {
      getSystemList: jasmine
        .createSpy()
        .and.returnValues(
          old.promise,
          Promise.resolve({ ...current, $id: 'b' }),
          Promise.resolve(current),
        ),
      getItems: jasmine.createSpy().and.resolveTo({ rows: [], total: 0 }),
    };
    const controller = new ListController(
      {} as ProfileStore,
      service as unknown as ListService,
    );
    const first = controller.loadSystem('a');
    await controller.loadSystem('b');
    await controller.loadSystem('a');
    old.resolve({ ...current, status: 'draft', title: 'Old draft' });
    await first;
    expect(controller.list()?.title).toBe('Current');
    expect(controller.list()?.status).toBe('published');
  });
  it('does not restore a draft after leaving the page', async () => {
    const old = deferred<ZereiListRow>();
    const service = {
      getSystemList: () => old.promise,
      getItems: jasmine.createSpy().and.resolveTo({ rows: [], total: 0 }),
    };
    const controller = new ListController(
      {} as ProfileStore,
      service as unknown as ListService,
    );
    const pending = controller.loadSystem('a');
    controller.usePersonal();
    old.resolve({ $id: 'a', title: 'Old draft' } as ZereiListRow);
    await pending;
    expect(controller.list()).toBeNull();
    expect(service.getItems).not.toHaveBeenCalled();
  });
});

describe('List pagination recovery', () => {
  for (const system of [false, true]) {
    it(`preserves items during pagination and retries the same offset (${system ? 'system' : 'personal'})`, async () => {
      const firstRows = Array.from({ length: 50 }, (_, i) => ({ $id: String(i) }));
      const pending = deferred<{ rows: unknown[]; total: number }>();
      const list = { $id: 'list', slug: 'list' } as ZereiListRow;
      const service = {
        getLists: jasmine.createSpy().and.resolveTo({ rows: [list] }),
        getSystemList: jasmine.createSpy().and.resolveTo(list),
        getItems: jasmine.createSpy().and.resolveTo({ rows: firstRows, total: 51 }),
      };
      const controller = new ListController(
        { current: () => ({ fingerprint: 'owner' }) } as unknown as ProfileStore,
        service as unknown as ListService,
      );
      if (system) await controller.loadSystem('list');
      else await controller.load({ slug: 'list' });
      service.getItems.and.returnValue(pending.promise);
      const loading = controller.load({ loadMore: true });
      await Promise.resolve();
      expect(controller.loadingMore()).toBeTrue();
      expect(controller.items().length).toBe(50);
      pending.resolve({ rows: [{ $id: '50' }], total: 51 });
      await loading;
      expect(controller.items().length).toBe(51);
      expect(controller.loadingMore()).toBeFalse();
      service.getItems.and.rejectWith(new Error('Offline'));
      spyOn(console, 'error');
      await controller.load({ loadMore: true });
      expect(controller.items().length).toBe(51);
      expect(controller.list()?.$id).toBe('list');
      service.getItems.and.resolveTo({ rows: [], total: 51 });
      await controller.load({ loadMore: true });
      expect(service.getItems.calls.mostRecent().args[0].offset).toBe(51);
      expect(controller.error()).toBeUndefined();
    });
  }
});
