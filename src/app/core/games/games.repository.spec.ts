import { GameRepository } from './games.repository';
import { Query } from '../appwrite/appwrite.client';
import * as appwriteClient from '../appwrite/appwrite.client';

describe('GameRepository.searchGames', () => {
  let repository: GameRepository;
  let listRowsSpy: jasmine.Spy;

  beforeEach(() => {
    repository = new GameRepository();

    listRowsSpy = spyOn(appwriteClient.appwrite.databases, 'listRows');
    listRowsSpy.and.returnValue(
      Promise.resolve({ rows: [], total: 0, $type: 'rowsList' }),
    );
  });

  it('should search by name substring using Query.contains', async () => {
    await repository.searchGames('fort', {});

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        tableId: 'games',
        queries: jasmine.arrayContaining([
          Query.or([
            Query.contains('name', 'fort'),
            Query.contains('slug', 'fort'),
          ]),
        ]),
      }),
    );
  });

  it('should normalize query (lowercase, no accents)', async () => {
    await repository.searchGames('Pokémon', {});

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([
          Query.or([
            Query.contains('name', 'pokemon'),
            Query.contains('slug', 'pokemon'),
          ]),
        ]),
      }),
    );
  });

  it('should apply genre filter when genreId is provided', async () => {
    await repository.searchGames('game', { genreId: 'genre-id-123' });

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([
          Query.equal('genres', 'genre-id-123'),
        ]),
      }),
    );
  });

  it('should apply year filter when year is provided', async () => {
    await repository.searchGames('game', { year: '2020' });

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([Query.equal('releaseYear', '2020')]),
      }),
    );
  });

  it('should not add search query when query is empty', async () => {
    await repository.searchGames('', {});

    const callArgs = listRowsSpy.calls.mostRecent().args[0];
    const queryStrings: string[] = callArgs.queries;
    const orQuery = Query.or([
      Query.contains('name', ''),
      Query.contains('slug', ''),
    ]);

    expect(queryStrings).not.toContain(orQuery);
  });

  it('should apply pagination with limit and offset', async () => {
    await repository.searchGames('game', { pageSize: 5, offset: 10 });

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([
          Query.limit(5),
          Query.offset(10),
        ]),
      }),
    );
  });

  it('should order results by name ascending', async () => {
    await repository.searchGames('game', {});

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([Query.orderAsc('name')]),
      }),
    );
  });

  it('should return rows and total from Appwrite response', async () => {
    const mockRows = [
      { $id: 'g1', name: 'Fortnite', slug: 'fortnite' } as any,
    ];
    listRowsSpy.and.returnValue(
      Promise.resolve({ rows: mockRows, total: 1, $type: 'rowsList' }),
    );

    const result = await repository.searchGames('fort', {});

    expect(result.rows).toEqual(mockRows);
    expect(result.total).toBe(1);
  });

  it('should use default pageSize of 12 and offset of 0', async () => {
    await repository.searchGames('game', {});

    expect(listRowsSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        queries: jasmine.arrayContaining([
          Query.limit(12),
          Query.offset(0),
        ]),
      }),
    );
  });
});
