import { TestBed } from '@angular/core/testing';
import { GameService } from './games.service';
import { GameRepository } from './games.repository';
import { ZEntryService } from '../zEntries/zEntries.service';
import { GameStore } from './game.store';
import { GenresCacheService } from './genres-cache.service';
import { GameRow } from './game.types';

const makeGame = (overrides: Partial<GameRow> = {}): GameRow =>
  ({
    $id: 'game-1',
    $sequence: 1,
    $databaseId: 'app',
    $tableId: 'games',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z',
    $permissions: [],
    name: 'Fortnite',
    slug: 'fortnite',
    coverUrl: 'https://example.com/cover.jpg',
    releaseYear: '2017',
    releaseDate: '2017-07-25T00:00:00.000Z',
    summary: 'Battle royale game',
    hypes: 0,
    externalReference: 1,
    gameType: null,
    genres: [],
    involvedCompanies: [],
    syncedAt: '2024-01-01T00:00:00.000Z',
    zStats: null as any,
    similarGames: [],
    ratingAvg: 0,
    ratingCount: 0,
    ratingSum: 0,
    ...overrides,
  }) as GameRow;

describe('GameService.searchGame', () => {
  let service: GameService;
  let repositorySpy: jasmine.SpyObj<GameRepository>;
  let zEntryServiceSpy: jasmine.SpyObj<ZEntryService>;
  let genresCacheSpy: jasmine.SpyObj<GenresCacheService>;
  let gameStoreSpy: jasmine.SpyObj<GameStore>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('GameRepository', [
      'searchGames',
      'findByIds',
      'findAllGenres',
    ]);

    zEntryServiceSpy = jasmine.createSpyObj('ZEntryService', [
      'getEntry',
      'getEntriesByGameIds',
    ]);

    genresCacheSpy = jasmine.createSpyObj('GenresCacheService', [
      'ensureLoaded',
      'getGenreIdFromSlug',
      'normalizeGameGenres',
      'options',
    ]);
    genresCacheSpy.ensureLoaded.and.returnValue(Promise.resolve());
    genresCacheSpy.getGenreIdFromSlug.and.returnValue(null);

    gameStoreSpy = jasmine.createSpyObj('GameStore', ['setGame']);

    zEntryServiceSpy.getEntriesByGameIds.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: GameRepository, useValue: repositorySpy },
        { provide: ZEntryService, useValue: zEntryServiceSpy },
        { provide: GenresCacheService, useValue: genresCacheSpy },
        { provide: GameStore, useValue: gameStoreSpy },
      ],
    });

    service = TestBed.inject(GameService);
  });

  it('should find a game by its exact name (case-insensitive)', async () => {
    const fortnite = makeGame({ name: 'Fortnite', slug: 'fortnite' });
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [fortnite], total: 1 }),
    );

    const result = await service.searchGame('Fortnite', {});

    expect(repositorySpy.searchGames).toHaveBeenCalledWith(
      'Fortnite',
      jasmine.objectContaining({ pageSize: 12, offset: 0 }),
    );
    expect(result.total).toBe(1);
    expect(result.rows[0].name).toBe('Fortnite');
  });

  it('should find a game by partial name match (fort → Fortnite)', async () => {
    const fortnite = makeGame({ name: 'Fortnite', slug: 'fortnite' });
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [fortnite], total: 1 }),
    );

    const result = await service.searchGame('fort', {});

    expect(repositorySpy.searchGames).toHaveBeenCalledWith(
      'fort',
      jasmine.objectContaining({}),
    );
    expect(result.total).toBe(1);
    expect(result.rows[0].name).toBe('Fortnite');
  });

  it('should find a game by partial name match (arc → Arc Raiders)', async () => {
    const arcRaiders = makeGame({ name: 'Arc Raiders', slug: 'arc-raiders' });
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [arcRaiders], total: 1 }),
    );

    const result = await service.searchGame('arc', {});

    expect(result.total).toBe(1);
    expect(result.rows[0].name).toBe('Arc Raiders');
  });

  it('should find a game by slug match (flinthook → Flinthook)', async () => {
    const flinthook = makeGame({ name: 'Flinthook', slug: 'flinthook' });
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [flinthook], total: 1 }),
    );

    const result = await service.searchGame('flinthook', {});

    expect(result.total).toBe(1);
    expect(result.rows[0].slug).toBe('flinthook');
  });

  it('should return empty results when no games match', async () => {
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [], total: 0 }),
    );

    const result = await service.searchGame('nonexistentgame', {});

    expect(result.total).toBe(0);
    expect(result.rows.length).toBe(0);
  });

  it('should return empty results when genre filter does not match', async () => {
    genresCacheSpy.getGenreIdFromSlug.and.returnValue(null);

    const result = await service.searchGame('game', {
      filters: { genre: 'nonexistent-genre' },
    });

    expect(repositorySpy.searchGames).not.toHaveBeenCalled();
    expect(result.total).toBe(0);
  });

  it('should pass genre filter when genre is valid', async () => {
    genresCacheSpy.getGenreIdFromSlug.and.returnValue('genre-id-123');
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [], total: 0 }),
    );

    await service.searchGame('game', { filters: { genre: 'action' } });

    expect(repositorySpy.searchGames).toHaveBeenCalledWith(
      'game',
      jasmine.objectContaining({ genreId: 'genre-id-123' }),
    );
  });

  it('should pass year filter when year is provided', async () => {
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: [], total: 0 }),
    );

    await service.searchGame('game', { filters: { year: '2020' } });

    expect(repositorySpy.searchGames).toHaveBeenCalledWith(
      'game',
      jasmine.objectContaining({ year: '2020' }),
    );
  });

  it('should calculate page and pageCount correctly', async () => {
    const games = Array.from({ length: 5 }, (_, i) =>
      makeGame({ $id: `game-${i}`, name: `Game ${i}` }),
    );
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: games, total: 25 }),
    );

    const result = await service.searchGame('game', {
      pageSize: 5,
      offset: 10,
    });

    expect(result.page).toBe(3);
    expect(result.pageCount).toBe(5);
    expect(result.pageSize).toBe(5);
    expect(result.total).toBe(25);
  });

  it('should attach z-entries in a single batch request when fingerprint is provided', async () => {
    const games = [
      makeGame({ $id: 'g1', name: 'Game 1' }),
      makeGame({ $id: 'g2', name: 'Game 2' }),
    ];
    repositorySpy.searchGames.and.returnValue(
      Promise.resolve({ rows: games, total: 2 }),
    );
    const mockZEntry = {
      $id: 'ze1',
      gameId: 'g1',
      ownerFingerprint: 'fp123',
      status: 'completed' as const,
      liked: false,
      hyped: false,
    };
    zEntryServiceSpy.getEntriesByGameIds.and.returnValue(
      Promise.resolve([mockZEntry as any]),
    );

    const result = await service.searchGame('game', {
      fingerprint: 'fp123',
    });

    expect(zEntryServiceSpy.getEntriesByGameIds).toHaveBeenCalledWith(
      'fp123',
      ['g1', 'g2'],
    );
    expect(zEntryServiceSpy.getEntry).not.toHaveBeenCalled();
    expect((result.rows[0] as any).zEntry).toBeDefined();
    expect((result.rows[1] as any).zEntry).toBeNull();
  });
});
