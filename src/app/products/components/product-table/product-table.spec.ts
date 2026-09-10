import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductTable } from './product-table';
import { createProduct } from 'src/testing/mocks';

describe('ProductTable', () => {
  let fixture: ComponentFixture<ProductTable>;

  const rows = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'));

  const render = (products = [createProduct()]) => {
    fixture.componentRef.setInput('products', products);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTable],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTable);
  });

  it('should create', () => {
    render();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one row per product', () => {
    render([
      createProduct({ id: 'a' }),
      createProduct({ id: 'b' }),
      createProduct({ id: 'c' }),
    ]);

    expect(rows().length).toBe(3);
  });

  it('should render an empty body when there are no products', () => {
    render([]);

    expect(rows().length).toBe(0);
  });

  it('should render the title, sizes and price of the product', () => {
    render([createProduct({ title: 'Teslo Cap', price: 25 })]);

    const row = rows()[0];
    expect(row.textContent).toContain('Teslo Cap');
    expect(row.textContent).toContain('M, L');
    expect(row.textContent).toContain('$25.00');
  });

  it('should link every row to the product admin page', () => {
    render([createProduct({ id: 'product-9' })]);

    const links = Array.from(rows()[0].querySelectorAll('a'));
    expect(links.length).toBe(2);
    links.forEach((link) => expect(link.getAttribute('href')).toBe('/admin/products/product-9'));
  });

  it('should flag a low stock with the error badge', () => {
    render([createProduct({ stock: 5 })]);

    expect(rows()[0].querySelector('.badge-error')?.textContent).toContain('5');
  });

  it('should flag a medium stock with the warning badge', () => {
    render([createProduct({ stock: 15 })]);

    expect(rows()[0].querySelector('.badge-warning')?.textContent).toContain('15');
  });

  it('should flag a healthy stock with the success badge', () => {
    render([createProduct({ stock: 50 })]);

    expect(rows()[0].querySelector('.badge-success')?.textContent).toContain('50');
  });
});
