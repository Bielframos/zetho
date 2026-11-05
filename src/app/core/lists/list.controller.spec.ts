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
