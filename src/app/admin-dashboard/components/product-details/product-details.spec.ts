import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ProductDetails } from './product-details';
import { ProductsApi } from '@/products/services/products-api';
import { Product } from '@/products/interfaces/product.interface';
import { createProduct } from 'src/testing/mocks';

describe('ProductDetails', () => {
  let fixture: ComponentFixture<ProductDetails>;
  let component: ProductDetails;
  let productsApi: jasmine.SpyObj<ProductsApi>;
  let router: jasmine.SpyObj<Router>;

  const html = () => fixture.nativeElement as HTMLElement;

  const setup = (product: Product = createProduct()) => {
    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  };

  const fileListOf = (names: string[]): FileList => {
    const dataTransfer = new DataTransfer();
    names.forEach((name) =>
      dataTransfer.items.add(new File(['contenido'], name, { type: 'image/png' })),
    );

    return dataTransfer.files;
  };

  beforeEach(async () => {
    productsApi = jasmine.createSpyObj<ProductsApi>('ProductsApi', [
      'createProduct',
      'updateProduct',
    ]);
    productsApi.createProduct.and.returnValue(of(createProduct({ id: 'created-1' })));
    productsApi.updateProduct.and.returnValue(of(createProduct()));
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ProductsApi, useValue: productsApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    setup();

    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should fill the form with the product data', () => {
      setup(createProduct({ title: 'Teslo Cap', slug: 'teslo-cap', price: 45, stock: 8 }));

      expect(component.productForm.value).toEqual(
        jasmine.objectContaining({
          title: 'Teslo Cap',
          slug: 'teslo-cap',
          price: 45,
          stock: 8,
          gender: 'men',
        }),
      );
    });

    it('should join the tags into a single text field', () => {
      setup(createProduct({ tags: ['shirt', 'summer'] }));

      expect(component.productForm.value.tags).toBe('shirt, summer');
    });

    it('should render the product title', () => {
      setup(createProduct({ title: 'Teslo Cap' }));

      expect(html().querySelector('h1')?.textContent).toContain('Teslo Cap');
    });

    it('should start with a valid form for an existing product', () => {
      setup();

      expect(component.productForm.valid).toBeTrue();
    });
  });

  describe('sizes', () => {
    it('should remove a size that is already selected', () => {
      setup(createProduct({ sizes: [] as never }));
      component.productForm.patchValue({ sizes: ['M', 'L'] });

      component.onSizeClicked('M');

      expect(component.productForm.value.sizes).toEqual(['L']);
    });

    it('should add a size that is not selected yet', () => {
      setup(createProduct({ sizes: [] as never }));
      component.productForm.patchValue({ sizes: ['M'] });

      component.onSizeClicked('XL');

      expect(component.productForm.value.sizes).toEqual(['M', 'XL']);
    });

    it('should toggle the size from the template buttons', () => {
      setup(createProduct({ sizes: [] as never }));
      component.productForm.patchValue({ sizes: [] });

      const sizeButton = Array.from(html().querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'XS',
      )!;
      sizeButton.click();

      expect(component.productForm.value.sizes).toEqual(['XS']);
    });
  });

  describe('images', () => {
    it('should combine the product images with the temporary ones', () => {
      setup(createProduct({ images: ['image-1.jpg'] }));

      expect(component.imagesToCarousel()).toEqual(['image-1.jpg']);
    });

    it('should keep the selected files and create their preview urls', () => {
      setup(createProduct({ images: ['image-1.jpg'] }));
      const files = fileListOf(['nueva.png']);

      component.onFilesChanged({ target: { files } } as unknown as Event);

      expect(component.imageFileList).toBe(files);
      expect(component.tempImages().length).toBe(1);
      expect(component.tempImages()[0].startsWith('blob:')).toBeTrue();
      expect(component.imagesToCarousel().length).toBe(2);
    });

    it('should clear the previews when no file is selected', () => {
      setup();

      component.onFilesChanged({ target: { files: null } } as unknown as Event);

      expect(component.imageFileList).toBeUndefined();
      expect(component.tempImages()).toEqual([]);
    });
  });

  describe('onSubmit', () => {
    it('should not call the service when the form is invalid', async () => {
      setup();
      component.productForm.patchValue({ title: '' });

      await component.onSubmit();

      expect(productsApi.updateProduct).not.toHaveBeenCalled();
      expect(productsApi.createProduct).not.toHaveBeenCalled();
      expect(component.productForm.touched).toBeTrue();
    });

    it('should update an existing product with the tags as a list', async () => {
      setup(createProduct({ id: 'product-1', tags: ['shirt', 'summer'] }));

      await component.onSubmit();

      expect(productsApi.updateProduct).toHaveBeenCalledTimes(1);
      const [id, productLike] = productsApi.updateProduct.calls.mostRecent().args;
      expect(id).toBe('product-1');
      expect(productLike.tags).toEqual(['shirt', 'summer']);
      expect(productLike.title).toBe('Teslo T-Shirt');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should forward the selected files when updating', async () => {
      setup();
      const files = fileListOf(['nueva.png']);
      component.onFilesChanged({ target: { files } } as unknown as Event);

      await component.onSubmit();

      expect(productsApi.updateProduct.calls.mostRecent().args[2]).toBe(files);
    });

    it('should create the product and navigate to it when the id is "new"', async () => {
      setup(createProduct({ id: 'new' }));

      await component.onSubmit();

      expect(productsApi.createProduct).toHaveBeenCalledTimes(1);
      expect(productsApi.updateProduct).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/products/created-1');
    });

    it('should show the success alert and hide it after three seconds', async () => {
      jasmine.clock().install();
      try {
        setup();

        await component.onSubmit();
        fixture.detectChanges();

        expect(component.wasSaved()).toBeTrue();
        expect(html().querySelector('.alert-success')?.textContent).toContain(
          'Datos actualizados correctamente',
        );

        jasmine.clock().tick(3000);
        fixture.detectChanges();

        expect(component.wasSaved()).toBeFalse();
        expect(html().querySelector('.alert-success')).toBeNull();
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
