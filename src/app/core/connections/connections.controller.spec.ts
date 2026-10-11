import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConnectionsController } from './connections.controller';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionsService } from './connections.service';
import { ProfileStore } from '../userProfiles/profile.store';
import { AuthStore } from '../auth/auth.store';
describe('Connections list refresh', () => {
  it('invalidates totals after a mutation and ignores a response from the previous profile', async () => {
    const profile = signal<any>({ $id: 'first' }); const revision = signal(0); const user = signal({ $id: 'user' });
    let finish!: (value: any) => void;
    const followers = jasmine.createSpy().and.callFake((id: string) => id === 'first' ? new Promise(resolve => finish = resolve) : Promise.resolve({ rows: [{ $id: 'new' }], total: 1 }));
    TestBed.configureTestingModule({ providers: [
      { provide: ProfileStore, useValue: { current: profile } },
      { provide: AuthStore, useValue: { user } },
      { provide: ConnectionsService, useValue: { revision } },
      { provide: ConnectionsRepository, useValue: { getFollowers: followers } },
    ] });
    const controller = TestBed.inject(ConnectionsController); TestBed.flushEffects();
    profile.set({ $id: 'next' }); TestBed.flushEffects(); await Promise.resolve();
    finish({ rows: [{ $id: 'stale' }], total: 999 }); await Promise.resolve();
    expect(controller.total()).toBe(1); expect(controller.profiles().map(p => p.$id)).toEqual(['new']);
    followers.and.resolveTo({ rows: [{ $id: 'new' }, { $id: 'added' }], total: 2 }); revision.update(v => v + 1); TestBed.flushEffects(); await Promise.resolve();
    expect(controller.total()).toBe(2);
    followers.and.rejectWith(new Error('refresh failed')); revision.update(v => v + 1); TestBed.flushEffects(); await Promise.resolve();
    expect(controller.errors()['loadMore']).toContain('atualizar');
    followers.and.resolveTo({ rows: [], total: 0 }); await controller.loadConnections(); expect(controller.total()).toBe(0); expect(controller.errors()).toEqual({});
  });
});
