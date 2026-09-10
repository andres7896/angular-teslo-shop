import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';

import { ProductsApi } from './products-api';
import { Product } from '@/products/interfaces/product.interface';
import { createProduct, createProductsResponse } from 'src/testing/mocks';

const baseUrl = environment.baseUrl;

describe('ProductsApi', () => {
  let service: ProductsApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductsApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should request the products with the default options', () => {
      let response: unknown;
      service.getProducts({}).subscribe((value) => (response = value));

      const req = httpTesting.expectOne((request) => request.url === `${baseUrl}/products`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('offset')).toBe('0');
      expect(req.request.params.get('gender')).toBe('');

      const expected = createProductsResponse();
      req.flush(expected);

      expect(response).toEqual(expected);
    });

    it('should forward the given options as query params', () => {
      service.getProducts({ limit: 20, offset: 40, gender: 'women' }).subscribe();

      const req = httpTesting.expectOne((request) => request.url === `${baseUrl}/products`);
      expect(req.request.params.get('limit')).toBe('20');
      expect(req.request.params.get('offset')).toBe('40');
      expect(req.request.params.get('gender')).toBe('women');

      req.flush(createProductsResponse());
    });

    it('should serve the cached response on a repeated request', () => {
      const expected = createProductsResponse();

      service.getProducts({ limit: 10, offset: 0 }).subscribe();
      httpTesting.expectOne((request) => request.url === `${baseUrl}/products`).flush(expected);

      let cached: unknown;
      service.getProducts({ limit: 10, offset: 0 }).subscribe((value) => (cached = value));

      httpTesting.expectNone((request) => request.url === `${baseUrl}/products`);
      expect(cached).toEqual(expected);
    });

    it('should not reuse the cache for a different set of options', () => {
      service.getProducts({ limit: 10, offset: 0 }).subscribe();
      httpTesting
        .expectOne((request) => request.url === `${baseUrl}/products`)
        .flush(createProductsResponse());

      const secondPage = createProductsResponse({ products: [createProduct({ id: 'other' })] });
      let response: unknown;
      service.getProducts({ limit: 10, offset: 10 }).subscribe((value) => (response = value));
      httpTesting
        .expectOne((request) => request.url === `${baseUrl}/products`)
        .flush(secondPage);

      expect(response).toEqual(secondPage);
    });
  });

  describe('getBySlug', () => {
    // `getBySlug` aplica un `delay(2000)`; el reloj falso de Jasmine evita esperarlo.
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('should request the product by slug', () => {
      const expected = createProduct();

      let product: Product | undefined;
      service.getBySlug('teslo-t-shirt').subscribe((value) => (product = value));

      httpTesting.expectOne(`${baseUrl}/products/teslo-t-shirt`).flush(expected);
      jasmine.clock().tick(2000);

      expect(product).toEqual(expected);
    });

    it('should serve the product from the cache the second time', () => {
      const expected = createProduct();

      service.getBySlug('teslo-t-shirt').subscribe();
      httpTesting.expectOne(`${baseUrl}/products/teslo-t-shirt`).flush(expected);
      jasmine.clock().tick(2000);

      let cached: Product | undefined;
      service.getBySlug('teslo-t-shirt').subscribe((value) => (cached = value));

      httpTesting.expectNone(`${baseUrl}/products/teslo-t-shirt`);
      expect(cached).toEqual(expected);
    });
  });

  describe('getById', () => {
    // `getById` aplica un `delay(2000)` salvo cuando responde desde caché.
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('should return the empty product for the "new" id without calling the API', () => {
      let product: Product | undefined;
      service.getById('new').subscribe((value) => (product = value));

      httpTesting.expectNone(`${baseUrl}/products/new`);
      expect(product?.id).toBe('new');
      expect(product?.title).toBe('');
      expect(product?.images).toEqual([]);
    });

    it('should request the product by id', () => {
      const expected = createProduct();

      let product: Product | undefined;
      service.getById('product-1').subscribe((value) => (product = value));

      httpTesting.expectOne(`${baseUrl}/products/product-1`).flush(expected);
      jasmine.clock().tick(2000);

      expect(product).toEqual(expected);
    });

    it('should serve the product from the cache the second time', () => {
      service.getById('product-1').subscribe();
      httpTesting.expectOne(`${baseUrl}/products/product-1`).flush(createProduct());
      jasmine.clock().tick(2000);

      let cached: Product | undefined;
      service.getById('product-1').subscribe((value) => (cached = value));

      httpTesting.expectNone(`${baseUrl}/products/product-1`);
      expect(cached?.id).toBe('product-1');
    });
  });

  describe('createProduct', () => {
    it('should post the product and cache it', () => {
      const created = createProduct({ id: 'created-1', slug: 'created-1' });

      let product: Product | undefined;
      service.createProduct({ title: created.title }).subscribe((value) => (product = value));

      const req = httpTesting.expectOne(`${baseUrl}/products`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: created.title });

      req.flush(created);

      expect(product).toEqual(created);

      // Queda en caché: una lectura posterior por id no vuelve a la API.
      let cached: Product | undefined;
      service.getById('created-1').subscribe((value) => (cached = value));
      httpTesting.expectNone(`${baseUrl}/products/created-1`);
      expect(cached).toEqual(created);
    });
  });

  describe('updateProduct', () => {
    it('should patch the product when there are no images to upload', () => {
      const updated = createProduct({ title: 'Nuevo título' });

      let product: Product | undefined;
      service
        .updateProduct('product-1', { title: 'Nuevo título', images: ['image-1.jpg'] })
        .subscribe((value) => (product = value));

      const req = httpTesting.expectOne(`${baseUrl}/products/product-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Nuevo título', images: ['image-1.jpg'] });

      req.flush(updated);

      expect(product).toEqual(updated);
    });

    it('should upload the new images and append them to the product', () => {
      const updated = createProduct();

      service
        .updateProduct('product-1', { images: ['image-1.jpg'] }, buildFileList(['nueva.png']))
        .subscribe();

      const uploadReq = httpTesting.expectOne(`${baseUrl}/files/product`);
      expect(uploadReq.request.method).toBe('POST');
      expect(uploadReq.request.body instanceof FormData).toBeTrue();
      uploadReq.flush({ fileName: 'nueva.png' });

      const patchReq = httpTesting.expectOne(`${baseUrl}/products/product-1`);
      expect(patchReq.request.body).toEqual({ images: ['image-1.jpg', 'nueva.png'] });

      patchReq.flush(updated);
    });
  });

  describe('uploadImages', () => {
    it('should return an empty list when no files are given', () => {
      let names: string[] | undefined;
      service.uploadImages(undefined).subscribe((value) => (names = value));

      httpTesting.expectNone(`${baseUrl}/files/product`);
      expect(names).toEqual([]);
    });

    it('should upload every file and return the generated names', () => {
      let names: string[] | undefined;
      service.uploadImages(buildFileList(['a.png', 'b.png'])).subscribe((value) => (names = value));

      const reqs = httpTesting.match(`${baseUrl}/files/product`);
      expect(reqs.length).toBe(2);

      reqs[0].flush({ fileName: 'a-hash.png' });
      reqs[1].flush({ fileName: 'b-hash.png' });

      expect(names).toEqual(['a-hash.png', 'b-hash.png']);
    });
  });

  describe('updateProductCache', () => {
    it('should replace the product inside the cached lists', () => {
      const original = createProduct({ title: 'Original' });
      service.getProducts({ limit: 10, offset: 0 }).subscribe();
      httpTesting
        .expectOne((request) => request.url === `${baseUrl}/products`)
        .flush(createProductsResponse({ products: [original] }));

      service.updateProductCache({ ...original, title: 'Actualizado' });

      let list: { products: Product[] } | undefined;
      service.getProducts({ limit: 10, offset: 0 }).subscribe((value) => (list = value));

      expect(list?.products[0].title).toBe('Actualizado');
    });

    it('should leave the cached lists untouched when updateProductsList is false', () => {
      const original = createProduct({ title: 'Original' });
      service.getProducts({ limit: 10, offset: 0 }).subscribe();
      httpTesting
        .expectOne((request) => request.url === `${baseUrl}/products`)
        .flush(createProductsResponse({ products: [original] }));

      service.updateProductCache({ ...original, title: 'Actualizado' }, false);

      let list: { products: Product[] } | undefined;
      service.getProducts({ limit: 10, offset: 0 }).subscribe((value) => (list = value));

      expect(list?.products[0].title).toBe('Original');
    });
  });
});

function buildFileList(names: string[]): FileList {
  const dataTransfer = new DataTransfer();

  for (const name of names) {
    dataTransfer.items.add(new File(['contenido'], name, { type: 'image/png' }));
  }

  return dataTransfer.files;
}
