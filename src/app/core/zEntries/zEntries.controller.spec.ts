import { EMPTY } from 'rxjs';
import { ZEntriesController } from './zEntries.controller';

function entry(id: string, groupKey: string) {
  return {
    $id: id,
    gameId: id,
    status: 'completed',
    groupKey,
    game: { $id: id, name: id },
  };
}
function setup(getUserEntries: jasmine.Spy) {
  return new ZEntriesController(
    { getUserEntries } as any,
    { profile$: EMPTY, current: () => ({ fingerprint: 'owner' }) } as any,
    { queryParams: EMPTY } as any,
  );
}

describe('ZEntriesController grouped pagination', () => {
  it('joins a year across pages and preserves server order', async () => {
    const load = jasmine
      .createSpy()
      .and.returnValues(
        Promise.resolve({
          rows: [entry('a', '2026'), entry('b', '2025')],
          total: 4,
        }),
        Promise.resolve({
          rows: [entry('c', '2025'), entry('d', 'unknown')],
          total: 4,
        }),
      );
    const controller = setup(load);
    expect(controller.grouping()).toBe('none');
    controller.grouping.set('release-year');
    controller.pageSize = 2;
    await controller.loadEntries();
    await controller.loadEntries();
    expect(
      controller
        .groups()
        .map((group) => [group.key, group.entries.map((row) => row.$id)]),
    ).toEqual([
      ['2026', ['a']],
      ['2025', ['b', 'c']],
      ['unknown', ['d']],
    ]);
    expect(controller.groups()[2].label).toBe('Ano não informado');
    expect(load.calls.mostRecent().args[2]).toEqual({
      pageSize: 2,
      offset: 2,
      group: 'release-year',
    });
    expect(controller.hasMore()).toBeFalse();
    expect('game' in controller.entries()[0].game.zEntry!).toBeFalse();
    expect('groupKey' in controller.entries()[0].game.zEntry!).toBeFalse();
  });

  it('discards an old page and its loading state after switching grouping', async () => {
    let oldDone!: (value: any) => void;
    let newDone!: (value: any) => void;
    const load = jasmine
      .createSpy()
      .and.returnValues(
        new Promise((resolve) => (oldDone = resolve)),
        new Promise((resolve) => (newDone = resolve)),
      );
    const controller = setup(load);
    const oldRequest = controller.loadEntries();
    controller.grouping.set('alphabetical');
    controller.resetState();
    const newRequest = controller.loadEntries();
    oldDone({ rows: [entry('old', '2025')], total: 1 });
    await oldRequest;
    expect(controller.entries()).toEqual([]);
    expect(controller.loadingMore()).toBeTrue();
    newDone({ rows: [entry('new', 'N')], total: 1 });
    await newRequest;
    expect(controller.groups()[0].key).toBe('N');
    expect(controller.entries()[0].$id).toBe('new');
    expect(controller.loadingMore()).toBeFalse();
  });

  it('keeps the page offset on failure so retry does not skip entries', async () => {
    const load = jasmine
      .createSpy()
      .and.returnValues(
        Promise.reject(new Error('offline')),
        Promise.resolve({ rows: [entry('a', '2026')], total: 1 }),
      );
    const controller = setup(load);
    await controller.loadEntries();
    expect(controller.offset()).toBe(0);
    expect(controller.errors()['loadMore']).toBeTruthy();
    await controller.loadEntries();
    expect(controller.errors()).toEqual({});
    expect(controller.total()).toBe(1);
  });
});
