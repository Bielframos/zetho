import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../auth/auth.store';
import { ConnectionsRepository } from './connections.repository';
import { ConnectionsService } from './connections.service';
import { FollowStore } from './follow.store';
import { FollowControl } from '../../shared/ui/follow-control';
const row = { $id: 'relation', requesterProfileId: 'owner', targetProfileId: 'peer' } as any;
const deferred = () => { let resolve!: (value: any) => void; let reject!: (error: unknown) => void; const promise = new Promise<any>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
@Component({ imports: [FollowControl], template: '<ui-follow-control [profileId]="target()" gamertag="Peer"/><ui-follow-control [profileId]="target()" gamertag="Peer"/>' })
class Host { target = signal('peer'); }

describe('Shared follow state and explicit mutations', () => {
  const user = signal<any>({ $id: 'user' });
  const profile = signal<any>({ $id: 'owner' });
  let repository: { findUnique: jasmine.Spy; create: jasmine.Spy; delete: jasmine.Spy };
  let store: FollowStore;
  beforeEach(() => {
    user.set({ $id: 'user' }); profile.set({ $id: 'owner' });
    repository = { findUnique: jasmine.createSpy().and.resolveTo(null), create: jasmine.createSpy().and.resolveTo(row), delete: jasmine.createSpy().and.resolveTo() };
    TestBed.configureTestingModule({ providers: [
      { provide: AuthStore, useValue: { user, profile, isAuthenticated: () => !!user() } },
      { provide: ConnectionsRepository, useValue: repository },
    ] });
    store = TestBed.inject(FollowStore);
  });
  it('deduplicates reads and clicks across two components, and never toggles an existing server connection off', async () => {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(repository.findUnique).toHaveBeenCalledTimes(1);
    const request = deferred(); repository.create.and.returnValue(request.promise); repository.findUnique.and.resolveTo(row);
    const buttons = fixture.nativeElement.querySelectorAll('button'); buttons[0].click(); buttons[1].click(); fixture.detectChanges();
    expect(repository.create).toHaveBeenCalledTimes(1); expect(buttons[0].disabled).toBeTrue(); expect(buttons[1].disabled).toBeTrue();
    request.resolve(row); await fixture.whenStable(); fixture.detectChanges();
    expect(store.state('peer').connection).toEqual(row); expect(repository.delete).not.toHaveBeenCalled();
    buttons[0].click(); fixture.detectChanges();
    expect(repository.delete).not.toHaveBeenCalled(); expect(fixture.nativeElement.textContent).toContain('Deixar de seguir');
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.follow-menu')).toBeNull();
  });
  it('retains confirmed mutation on refresh failure and retries only the read', async () => {
    await store.ensure('peer'); repository.findUnique.and.rejectWith(new Error('read failed'));
    await store.setFollowing('peer', true);
    expect(store.state('peer').known).toBeTrue(); expect(store.state('peer').connection).toEqual(row); expect(store.state('peer').error).toContain('consulta');
    repository.findUnique.and.resolveTo(row); await store.refresh('peer');
    expect(repository.create).toHaveBeenCalledTimes(1); expect(repository.delete).not.toHaveBeenCalled(); expect(store.state('peer').error).toBe('');
  });
  it('blocks another mutation after uncertain failure until a read reconciles the result', async () => {
    await store.ensure('peer'); repository.create.and.rejectWith(new Error('network lost after commit'));
    await store.setFollowing('peer', true); await store.setFollowing('peer', true);
    expect(store.state('peer').known).toBeFalse(); expect(repository.create).toHaveBeenCalledTimes(1);
    repository.findUnique.and.resolveTo(row); await store.refresh('peer');
    expect(store.state('peer').known).toBeTrue(); expect(store.state('peer').connection).toEqual(row); expect(repository.create).toHaveBeenCalledTimes(1);
  });
  it('unfollows explicitly and blocks repeated delete clicks', async () => {
    repository.findUnique.and.resolveTo(row); await store.ensure('peer');
    const deletion = deferred(); repository.delete.and.returnValue(deletion.promise);
    const first = store.setFollowing('peer', false); const second = store.setFollowing('peer', false);
    await Promise.resolve(); expect(repository.delete).toHaveBeenCalledTimes(1);
    repository.findUnique.and.resolveTo(null); deletion.resolve(undefined); await Promise.all([first, second]);
    expect(store.state('peer').connection).toBeNull(); expect(repository.create).not.toHaveBeenCalled();
  });
  it('does not start a mutation under another account after an awaited lookup', async () => {
    repository.findUnique.and.resolveTo(row); await store.ensure('peer');
    const lookup = deferred(); repository.findUnique.and.returnValue(lookup.promise);
    const operation = store.setFollowing('peer', false);
    user.set({ $id: 'other-user' }); profile.set({ $id: 'other-owner' });
    lookup.resolve(row); await operation;
    expect(repository.delete).not.toHaveBeenCalled(); expect(store.state('peer').known).toBeFalse();
  });
  it('ignores an old read after switching account and an old mutation after logout', async () => {
    const read = deferred(); repository.findUnique.and.returnValue(read.promise); const request = store.ensure('peer');
    user.set({ $id: 'other-user' }); profile.set({ $id: 'other-owner' });
    repository.findUnique.and.resolveTo(null); await store.ensure('peer'); read.resolve(row); await request;
    expect(store.state('peer').connection).toBeNull();
    const mutation = deferred(); repository.create.and.returnValue(mutation.promise); const save = store.setFollowing('peer', true);
    user.set(null); profile.set(null); mutation.resolve(row); await save;
    expect(store.canFollow('peer')).toBeFalse(); expect(store.state('peer').known).toBeFalse();
  });
  it('keeps results on the original target when a mounted component navigates to another profile', async () => {
    const fixture = TestBed.createComponent(Host); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const request = deferred(); repository.create.and.returnValue(request.promise);
    fixture.nativeElement.querySelector('button').click(); fixture.componentInstance.target.set('next'); fixture.detectChanges(); await fixture.whenStable();
    request.resolve(row); await fixture.whenStable(); fixture.detectChanges();
    expect(store.state('next').connection).toBeNull(); expect(fixture.nativeElement.textContent).not.toContain('Seguindo');
  });
  it('restores focus to the read retry after failure and to the trigger after reconciliation', async () => {
    const fixture = TestBed.createComponent(Host); fixture.autoDetectChanges(); await fixture.whenStable();
    repository.create.and.rejectWith(new Error('uncertain result'));
    const host: HTMLElement = fixture.nativeElement.querySelector('ui-follow-control');
    const trigger = host.querySelector('button')!; trigger.focus(); trigger.click();
    await fixture.whenStable();
    const retry = host.querySelector('.follow-error + button') as HTMLButtonElement;
    expect(retry).toBeTruthy(); expect(document.activeElement).toBe(retry);
    repository.findUnique.and.resolveTo(row); retry.click(); await fixture.whenStable();
    expect(document.activeElement).toBe(host.querySelector('button'));
    expect(host.textContent).toContain('Seguindo');
  });
  it('rejects self-follow and mismatched owner/target read data', async () => {
    await store.ensure('owner'); await store.setFollowing('owner', true); expect(repository.create).not.toHaveBeenCalled();
    repository.findUnique.and.resolveTo({ ...row, requesterProfileId: 'other' }); await store.ensure('peer');
    expect(store.state('peer').known).toBeFalse(); expect(store.state('peer').error).toBeTruthy();
  });
});
