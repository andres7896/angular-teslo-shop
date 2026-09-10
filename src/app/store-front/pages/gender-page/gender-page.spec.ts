import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { GenderPage } from './gender-page';
import { ProductsApi } from '@/products/services/products-api';
import {
  ActivatedRouteStub,
  createProduct,
  createProductsResponse,
  provideActivatedRouteStub,
} from 'src/testing/mocks';

describe('GenderPage', () => {
  let fixture: ComponentFixture<GenderPage>;
  let component: GenderPage;
  let productsApi: jasmine.SpyObj<ProductsApi>;
  let activatedRoute: ActivatedRouteStub;

  const html = () => fixture.nativeElement as HTMLElement;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setup = async (gender = 'men') => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', ['getProducts']);
    productsApi.getProducts.and.returnValue(
      of(createProductsResponse({ products: [createProduct()], pages: 2 })),
    );
    activatedRoute = new ActivatedRouteStub({ gender });

    await TestBed.configureTestingModule({
      imports: [GenderPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideActivatedRouteStub(activatedRoute),
        { provide: ProductsApi, useValue: productsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenderPage);
    component = fixture.componentInstance;
    await render();
  };

  it('should create', async () => {
    await setup();

    expect(component).toBeTruthy();
  });

  it('should read the gender from the route', async () => {
    await setup('women');

    expect(component.gender()).toBe('women');
    expect(html().querySelector('h1')?.textContent).toContain('women');
  });

  it('should request the products of that gender', async () => {
    await setup('kid');

    expect(productsApi.getProducts).toHaveBeenCalledWith({ gender: 'kid', offset: 0 });
  });

  it('should render a card per product', async () => {
    await setup();

    expect(html().querySelectorAll('product-card').length).toBe(1);
  });

  it('should reload when the gender changes', async () => {
    await setup('men');

    activatedRoute.setParams({ gender: 'women' });
    await render();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ gender: 'women', offset: 0 });
  });

  it('should reload with the matching offset when the page changes', async () => {
    await setup('men');

    activatedRoute.setQueryParams({ page: '2' });
    await render();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ gender: 'men', offset: 9 });
  });
});
