import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ProductsAdminPage } from './products-admin-page';
import { ProductsApi } from '@/products/services/products-api';
import {
  ActivatedRouteStub,
  createProduct,
  createProductsResponse,
  provideActivatedRouteStub,
} from 'src/testing/mocks';

describe('ProductsAdminPage', () => {
  let fixture: ComponentFixture<ProductsAdminPage>;
  let component: ProductsAdminPage;
  let productsApi: jasmine.SpyObj<ProductsApi>;
  let activatedRoute: ActivatedRouteStub;

  const html = () => fixture.nativeElement as HTMLElement;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setup = async (pages = 3, queryParams: Record<string, string> = {}) => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', ['getProducts']);
    productsApi.getProducts.and.returnValue(
      of(
        createProductsResponse({
          products: [createProduct({ id: '1' }), createProduct({ id: '2' })],
          count: 25,
          pages,
        }),
      ),
    );
    activatedRoute = new ActivatedRouteStub({}, queryParams);

    await TestBed.configureTestingModule({
      imports: [ProductsAdminPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideActivatedRouteStub(activatedRoute),
        { provide: ProductsApi, useValue: productsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsAdminPage);
    component = fixture.componentInstance;
    await render();
  };

  it('should create', async () => {
    await setup();

    expect(component).toBeTruthy();
  });

  it('should load the first page with the default page size', async () => {
    await setup();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 0, limit: 10 });
    expect(component.productsPerPage()).toBe(10);
  });

  it('should render the total number of products', async () => {
    await setup();

    expect(html().querySelector('h3')?.textContent).toContain('25');
  });

  it('should render the products table', async () => {
    await setup();

    expect(html().querySelectorAll('product-table tbody tr').length).toBe(2);
  });

  it('should render the pagination when there is more than one page', async () => {
    await setup(3);

    expect(html().querySelector('app-pagination')).not.toBeNull();
  });

  it('should hide the pagination when there is a single page', async () => {
    await setup(1);

    expect(html().querySelector('app-pagination')).toBeNull();
  });

  it('should reload with the new page size when the select changes', async () => {
    await setup();

    const select = html().querySelector<HTMLSelectElement>('select')!;
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    await render();

    expect(component.productsPerPage()).toBe(50);
    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 0, limit: 50 });
  });

  it('should reload with the matching offset when the page changes', async () => {
    await setup();

    activatedRoute.setQueryParams({ page: '2' });
    await render();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ offset: 9, limit: 10 });
  });

  it('should link to the new product form', async () => {
    await setup();

    const button = html().querySelector<HTMLButtonElement>('button.btn-secondary')!;
    expect(button.textContent).toContain('Agregar producto');
  });
});
