import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicListsPage } from './public-lists';
import { DashboardService } from '../../../dashboard/dashboard.service';

describe('PublicListsPage', () => {
  let fixture: ComponentFixture<PublicListsPage>;
  let component: PublicListsPage;
  let getPublicListsSpy: jasmine.Spy;

  beforeEach(async () => {
    getPublicListsSpy = jasmine
      .createSpy('getPublicLists')
      .and.resolveTo({ items: [], total: 0, page: 1, hasMore: false });

    await TestBed.configureTestingModule({
      imports: [PublicListsPage],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: { getPublicLists: getPublicListsSpy },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicListsPage);
    component = fixture.componentInstance;
  });

  it('renders skeleton items with border-b and sm:odd:border-r during loading', () => {
    component.loading.set(true);
    fixture.detectChanges();

    const skeletons = fixture.nativeElement.querySelectorAll(
      '[aria-label="Carregando listas públicas"] > div',
    );
    expect(skeletons.length).toBe(6);
    expect(skeletons[0].classList.contains('sm:odd:border-r')).toBeTrue();
    expect(skeletons[0].classList.contains('sm:border-b')).toBeTrue();
  });

  it('renders list items with border-b and sm:odd:border-r', async () => {
    component.loading.set(false);
    component.lists.set([
      {
        $id: 'list-1',
        title: 'Melhores RPGs',
        slug: 'melhores-rpgs',
        itemCount: 10,
        likeCount: 5,
        saveCount: 2,
        author: { gamertag: 'gamer1' },
      } as any,
      {
        $id: 'list-2',
        title: 'Indies Favoritos',
        slug: 'indies-favoritos',
        itemCount: 5,
        likeCount: 1,
        saveCount: 0,
        author: { gamertag: 'gamer2' },
      } as any,
    ]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ul[aria-label="Listas públicas"] > li');
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('sm:odd:border-r')).toBeTrue();
    expect(items[0].classList.contains('sm:border-b')).toBeTrue();
  });
});
