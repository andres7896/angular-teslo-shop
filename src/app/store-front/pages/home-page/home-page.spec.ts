import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { HomePage } from './home-page';
import { ProductsApi } from '@/products/services/products-api';
import {
  ActivatedRouteStub,
  createProduct,
  createProductsResponse,
  provideActivatedRouteStub,
} from 'src/testing/mocks';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let productsApi: jasmine.SpyObj<ProductsApi>;
  let activatedRoute: ActivatedRouteStub;

  const html = () => fixture.nativeElement as HTMLElement;
  const cards = () => Array.from(html().querySelectorAll('product-card'));

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setup = async (queryParams: Record<string, string> = {}) => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', ['getProducts']);
    productsApi.getProducts.and.returnValue(
      of(
        createProductsResponse({
          products: [createProduct({ id: '1' }), createProduct({ id: '2' })],
          pages: 3,
        }),
      ),
    );
    activatedRoute = new ActivatedRouteStub({}, queryParams);

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideActivatedRouteStub(activatedRoute),
        { provide: ProductsApi, useValue: productsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    await render();
  };

  it('should create', async () => {
    await setup();

    expect(component).toBeTruthy();
  });

  it('should load the first page of products', async () => {
    await setup();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 0 });
  });

  it('should render a card per product', async () => {
    await setup();

    expect(cards().length).toBe(2);
  });

  it('should render the pagination with the number of pages from the response', async () => {
    await setup();

    expect(html().querySelectorAll('app-pagination input').length).toBe(3);
  });

  it('should show a message when there are no products', async () => {
    await setup();
    productsApi.getProducts.and.returnValue(of(createProductsResponse({ products: [], pages: 0 })));

    activatedRoute.setQueryParams({ page: '2' });
    await render();

    expect(cards().length).toBe(0);
    expect(html().textContent).toContain('No hay productos');
  });

  it('should request the matching offset when the page changes', async () => {
    await setup();

    activatedRoute.setQueryParams({ page: '3' });
    await render();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 18 });
  });

  it('should start on the page given by the query params', async () => {
    await setup({ page: '2' });

    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 9 });
  });
});
