import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let component: Pagination;

  const render = (pages: number, currentPage = 1) => {
    fixture.componentRef.setInput('pages', pages);
    fixture.componentRef.setInput('currentPage', currentPage);
    fixture.detectChanges();
  };

  const pageInputs = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('input'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    render(0);

    expect(component).toBeTruthy();
  });

  it('should build the list of pages', () => {
    render(3);

    expect(component.getPagesList()).toEqual([1, 2, 3]);
  });

  it('should render one control per page', () => {
    render(4);

    expect(pageInputs().length).toBe(4);
    expect(pageInputs().map((input) => input.getAttribute('aria-label'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
  });

  it('should not render any control when there are no pages', () => {
    render(0);

    expect(pageInputs().length).toBe(0);
  });

  it('should mark the current page as checked', () => {
    render(3, 2);

    expect(pageInputs()[1].checked).toBeTrue();
    expect(pageInputs()[0].checked).toBeFalse();
  });

  it('should update the active page when a page is clicked', () => {
    render(3, 1);

    pageInputs()[2].click();
    fixture.detectChanges();

    expect(component.activePage()).toBe(3);
    expect(pageInputs()[2].checked).toBeTrue();
  });

  it('should follow the currentPage input when it changes', () => {
    render(3, 1);

    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    expect(component.activePage()).toBe(3);
  });
});
