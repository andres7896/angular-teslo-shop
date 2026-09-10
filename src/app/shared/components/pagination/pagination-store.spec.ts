import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PaginationStore } from './pagination-store';
import { ActivatedRouteStub, provideActivatedRouteStub } from 'src/testing/mocks';

describe('PaginationStore', () => {
  let activatedRoute: ActivatedRouteStub;

  const buildStore = (queryParams: Record<string, string> = {}) => {
    activatedRoute = new ActivatedRouteStub({}, queryParams);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideActivatedRouteStub(activatedRoute)],
    });

    return TestBed.inject(PaginationStore);
  };

  it('should be created', () => {
    expect(buildStore()).toBeTruthy();
  });

  it('should default to page 1 when there is no page query param', () => {
    expect(buildStore().currentPage()).toBe(1);
  });

  it('should read the page from the query params', () => {
    expect(buildStore({ page: '3' }).currentPage()).toBe(3);
  });

  it('should fall back to page 1 when the query param is not a number', () => {
    expect(buildStore({ page: 'abc' }).currentPage()).toBe(1);
  });

  it('should react to query param changes', () => {
    const store = buildStore({ page: '2' });
    expect(store.currentPage()).toBe(2);

    activatedRoute.setQueryParams({ page: '5' });

    expect(store.currentPage()).toBe(5);
  });
});
