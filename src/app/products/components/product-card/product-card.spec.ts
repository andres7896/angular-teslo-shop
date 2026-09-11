import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { environment } from 'src/environments/environment';

import { ProductCard } from './product-card';
import { ProductsApi } from '@/products/services/products-api';
import { createProduct } from 'src/testing/mocks';

describe('ProductCard', () => {
  let fixture: ComponentFixture<ProductCard>;
  let component: ProductCard;

  const product = createProduct({
    title: 'Teslo Hoodie',
    slug: 'teslo-hoodie',
    description: 'a'.repeat(120),
    images: ['hoodie.jpg'],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ProductsApi, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the product title', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.card-title')?.textContent).toContain('Teslo Hoodie');
  });

  it('should truncate the description to 70 characters', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const description = compiled.querySelector('p')?.textContent?.trim() ?? '';

    expect(description.length).toBe(70);
  });

  it('should resolve the image through the product image pipe', () => {
    const image = (fixture.nativeElement as HTMLElement).querySelector('img')!;

    expect(image.getAttribute('src')).toBe(`${environment.baseUrl}/files/product/hoodie.jpg`);
    expect(image.getAttribute('alt')).toBe('Teslo Hoodie');
  });

  it('should link to the product detail page', () => {
    const links = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((element) => element.injector.get(RouterLink).urlTree?.toString());

    expect(links.length).toBeGreaterThan(0);
    links.forEach((url) => expect(url).toBe('/product/teslo-hoodie'));
  });

  it('should stretch the host to fill its grid cell', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList).toContain('block');
    expect(host.classList).toContain('h-full');
    expect(host.querySelector('.card')?.classList).toContain('h-full');
  });

  it('should expose the computed image url', () => {
    expect(component.imageUrl()).toBe('http://localhost:3000/api/files/product/hoodie.jpg');
  });
});
