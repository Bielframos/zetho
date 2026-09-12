import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../../auth/auth.store';
import { NotificationStore } from '../../system/notifications/notification.store';
import { RatingsService } from '../ratings.service';
import { FeedReviewContent } from './feed-review-content';
import { FeedReviewVotes } from './feed-review-votes';

describe('Feed review content', () => {
  it('truncates text by characters and restores complete rich text on expansion', () => {
    const fixture = TestBed.createComponent(FeedReviewContent);
    fixture.componentRef.setInput('reviewId', 'review-1');
    fixture.componentRef.setInput('content', '<p>' + 'a'.repeat(400) + '</p>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    fixture.componentRef.setInput('content', '<p>' + 'a'.repeat(400) + '<strong>Final da review</strong></p>');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.firstElementChild as HTMLElement;
    const button = wrapper.querySelector('button')!;
    expect(wrapper.textContent).toContain('a'.repeat(400) + '…');
    expect(wrapper.textContent).not.toContain('Final da review');
    expect(button.textContent).toContain('Ver mais');
    expect(getComputedStyle(button).position).toBe('static');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(wrapper.querySelector('strong')?.textContent).toBe('Final da review');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(wrapper.textContent).not.toContain('Final da review');
  });

  it('counts visible characters, decodes entities and preserves paragraph boundaries and emoji', () => {
    const fixture = TestBed.createComponent(FeedReviewContent);
    fixture.componentRef.setInput('reviewId', 'review-2');
    fixture.componentRef.setInput('content', '<p>A &amp; B</p><p>' + '🎮'.repeat(400) + '</p>');
    fixture.detectChanges();
    const preview = fixture.componentInstance.preview();
    expect(preview.startsWith('A & B 🎮')).toBeTrue();
    expect(Array.from(preview).length).toBe(400);
    expect(preview.endsWith('🎮')).toBeTrue();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
  });
});

describe('Feed review votes', () => {
  const voteRating = jasmine.createSpy('voteRating');
  const show = jasmine.createSpy('show');
  const isAuthenticated = jasmine.createSpy('isAuthenticated');

  beforeEach(() => {
    voteRating.calls.reset();
    show.calls.reset();
    isAuthenticated.and.returnValue(true);
    TestBed.configureTestingModule({ providers: [
      { provide: RatingsService, useValue: { voteRating } },
      { provide: AuthStore, useValue: { isAuthenticated } },
      { provide: NotificationStore, useValue: { show } },
    ] });
  });

  function create() {
    const fixture = TestBed.createComponent(FeedReviewVotes);
    fixture.componentRef.setInput('reviewId', 'review-1');
    fixture.componentRef.setInput('voteCount', 3);
    fixture.detectChanges();
    return fixture;
  }

  it('blocks duplicate requests and uses the count returned by the server', async () => {
    let resolve!: (result: { newVoteCount: number }) => void;
    voteRating.and.returnValue(new Promise((done) => resolve = done));
    const fixture = create();
    const changed = jasmine.createSpy('changed');
    fixture.componentInstance.countChanged.subscribe(changed);
    const request = fixture.componentInstance.vote('up');
    await fixture.componentInstance.vote('down');
    fixture.detectChanges();
    expect(voteRating).toHaveBeenCalledOnceWith('review-1', 'up');
    expect([...fixture.nativeElement.querySelectorAll('button')].every((button: HTMLButtonElement) => button.disabled)).toBeTrue();
    resolve({ newVoteCount: 8 });
    await request;
    expect(changed).toHaveBeenCalledOnceWith(8);
    expect(fixture.componentInstance.pending()).toBeFalse();
  });

  it('preserves the count after a failure and lets the user retry', async () => {
    voteRating.and.rejectWith(new Error('offline'));
    const fixture = create();
    const changed = jasmine.createSpy('changed');
    fixture.componentInstance.countChanged.subscribe(changed);
    await fixture.componentInstance.vote('down');
    expect(changed).not.toHaveBeenCalled();
    expect(fixture.componentInstance.voteCount()).toBe(3);
    expect(fixture.componentInstance.pending()).toBeFalse();
    expect(show).toHaveBeenCalled();
  });

  it('requires authentication before sending a vote', async () => {
    isAuthenticated.and.returnValue(false);
    const fixture = create();
    await fixture.componentInstance.vote('up');
    expect(voteRating).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalled();
  });
});
