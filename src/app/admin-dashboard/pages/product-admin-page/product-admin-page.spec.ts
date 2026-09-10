import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductAdminPage } from './product-admin-page';
import { ProductsApi } from '@/products/services/products-api';
import { ActivatedRouteStub, createProduct, provideActivatedRouteStub } from 'src/testing/mocks';

describe('ProductAdminPage', () => {
  let fixture: ComponentFixture<ProductAdminPage>;
  let component: ProductAdminPage;
  let productsApi: jasmine.SpyObj<ProductsApi>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: ActivatedRouteStub;

  const html = () => fixture.nativeElement as HTMLElement;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const setup = async (id = 'product-1') => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', [
      'getById',
      'createProduct',
      'updateProduct',
    ]);
    productsApi.getById.and.returnValue(of(createProduct({ id })));
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    activatedRoute = new ActivatedRouteStub({ id });

    await TestBed.configureTestingModule({
      imports: [ProductAdminPage],
      providers: [
        provideZonelessChangeDetection(),
        provideActivatedRouteStub(activatedRoute),
        { provide: ProductsApi, useValue: productsApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductAdminPage);
    component = fixture.componentInstance;
  };

  it('should create', async () => {
    await setup();
    await render();

    expect(component).toBeTruthy();
  });

  it('should read the product id from the route', async () => {
    await setup('product-7');
    await render();

    expect(component.productId()).toBe('product-7');
    expect(productsApi.getById).toHaveBeenCalledWith('product-7');
  });

  it('should render the product details form once loaded', async () => {
    await setup();
    await render();

    expect(component.productResource.hasValue()).toBeTrue();
    expect(html().querySelector('product-details')).not.toBeNull();
    expect(html().querySelector('.loading')).toBeNull();
  });

  it('should reload when the route id changes', async () => {
    await setup('product-1');
    await render();

    activatedRoute.setParams({ id: 'product-2' });
    await render();

    expect(productsApi.getById).toHaveBeenCalledWith('product-2');
  });

  it('should redirect to the products list when the product cannot be loaded', async () => {
    await setup();
    productsApi.getById.and.returnValue(throwError(() => new Error('not found')));

    activatedRoute.setParams({ id: 'missing' });
    await render();

    expect(component.productResource.error()).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
    expect(html().querySelector('product-details')).toBeNull();
  });
});
