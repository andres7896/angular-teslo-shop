import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';

import { ProductPage } from './product-page';
import { ProductsApi } from '@/products/services/products-api';
import { Product } from '@/products/interfaces/product.interface';
import { ActivatedRouteStub, createProduct, provideActivatedRouteStub } from 'src/testing/mocks';

describe('ProductPage', () => {
  let fixture: ComponentFixture<ProductPage>;
  let component: ProductPage;
  let productsApi: jasmine.SpyObj<ProductsApi>;

  const html = () => fixture.nativeElement as HTMLElement;

  /** Deja que el recurso resuelva y vuelve a renderizar. */
  const flush = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };

  const setup = async (stream: Observable<Product>, slug = 'teslo-t-shirt') => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', ['getBySlug']);
    productsApi.getBySlug.and.returnValue(stream);

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        provideZonelessChangeDetection(),
        provideActivatedRouteStub(new ActivatedRouteStub({ idSlug: slug })),
        { provide: ProductsApi, useValue: productsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await flush();
  };

  it('should create', async () => {
    await setup(of(createProduct()));

    expect(component).toBeTruthy();
  });

  it('should read the slug from the route snapshot', async () => {
    await setup(of(createProduct()), 'teslo-hoodie');

    expect(component.productIdSlug).toBe('teslo-hoodie');
    expect(productsApi.getBySlug).toHaveBeenCalledWith('teslo-hoodie');
  });

  it('should show the loader while the product is being fetched', async () => {
    await setup(new Subject<Product>());

    expect(component.productResource.isLoading()).toBeTrue();
    expect(html().querySelector('.loading')).not.toBeNull();
    expect(html().querySelector('product-carousel')).toBeNull();
  });

  it('should render the product once it is loaded', async () => {
    await setup(of(createProduct({ title: 'Teslo Jacket', description: 'Muy abrigada' })));

    expect(html().querySelector('.loading')).toBeNull();
    expect(html().querySelector('h2')?.textContent).toContain('Teslo Jacket');
    expect(html().textContent).toContain('Muy abrigada');
  });

  it('should render the carousel with the product images', async () => {
    await setup(of(createProduct({ images: ['one.jpg', 'two.jpg'] })));

    expect(html().querySelector('product-carousel')).not.toBeNull();
    expect(html().querySelectorAll('product-carousel img').length).toBeGreaterThan(0);
  });
});
