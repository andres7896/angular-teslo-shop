import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Gender, Product, ProductsResponse } from '../interfaces/product.interface';
import { delay, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '@/auth/interfaces/user.interface';

const baseUrl = environment.baseUrl;

interface Options {
  limit?: number;
  offset?: number;
  gender?: string;
}

const emptyProduct: Product = {
  id: 'new',
  title: '',
  price: 0,
  description: '',
  slug: '',
  stock: 0,
  sizes: [],
  gender: Gender.Men,
  tags: [],
  images: [],
  user: {} as User,
};

@Injectable({
  providedIn: 'root',
})
export class ProductsApi {
  private http = inject(HttpClient);

  private productsCache = new Map<string, ProductsResponse>();
  private productCache = new Map<string, Product>();

  getProducts(options: Options): Observable<ProductsResponse> {
    const { limit = 10, offset = 0, gender = '' } = options;

    const key = `${limit}-${offset}-${gender}`;
    if (this.productsCache.has(key)) {
      return of(this.productsCache.get(key)!);
    }

    return this.http
      .get<ProductsResponse>(`${baseUrl}/products`, {
        params: {
          limit,
          offset,
          gender,
        },
      })
      .pipe(tap((res) => this.productsCache.set(key, res)));
  }

  getImage(image: string): Observable<any> {
    return this.http
      .get<any>(`${baseUrl}files/product/${image}`)
      .pipe(tap((res) => console.log('Image fetched:', typeof res)));
  }

  getBySlug(idSlug: string): Observable<Product> {
    const key = idSlug;

    if (this.productCache.has(key)) {
      return of(this.productCache.get(key)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${idSlug}`).pipe(
      delay(2000),
      tap((product) => this.productCache.set(key, product)),
    );
  }

  getById(id: string): Observable<Product> {
    const key = id;

    if (key === 'new') {
      return of(emptyProduct);
    }

    if (this.productCache.has(key)) {
      return of(this.productCache.get(key)!);
    }

    return this.http.get<Product>(`${baseUrl}/products/${id}`).pipe(
      delay(2000),
      tap((product) => this.productCache.set(key, product)),
    );
  }

  updateProduct(
    id: string,
    productLike: Partial<Product>,
    imagesFileList?: FileList
  ): Observable<Product> {
    const currentImages = productLike.images ?? [];

    return this.uploadImages(imagesFileList).pipe(
      map( imageNames => ({
        ... productLike,
        images: [...currentImages, ...imageNames]
      })),
      switchMap( (updatedProduct) =>
        this.http.patch<Product>(`${baseUrl}/products/${id}`, updatedProduct)
      ),
      tap((product) => this.updateProductCache(product))
    );

    // return this.http
    //   .patch<Product>(`${baseUrl}/products/${id}`, productLike)
    //   .pipe(tap((product) => this.updateProductCache(product)));
  }

  createProduct(
    productLike: Partial<Product>,
    imagesFileList?: FileList
  ): Observable<Product> {
    return this.http
      .post<Product>(`${baseUrl}/products`, productLike)
      .pipe(tap((product) => this.updateProductCache(product, false)));
  }

  updateProductCache(product: Product, updateProductsList: boolean = true) {
    const productId = product.id;

    this.productCache.set(productId, product);

    if (!updateProductsList) return;

    this.productsCache.forEach((response) => {
      response.products = response.products.map((currentProduct) =>
        currentProduct.id === productId ? product : currentProduct,
      );
    });
  }

  uploadImages(images?: FileList): Observable<string[]> {
    if (!images) return of([]);

    const uploadObservables: Observable<string>[] = Array.from(images).map((imageFile) =>
      this.uploadImage(imageFile),
    );

    return forkJoin(uploadObservables).pipe(
      tap((imageNames) => console.log('All images uploaded:', imageNames))
    );
  }

  uploadImage(imageFile: File): Observable<string> {
    const formData = new FormData();

    formData.append('file', imageFile);

    return this.http
      .post<{ fileName: string }>(`${baseUrl}/files/product`, formData)
      .pipe(map((resp: any) => resp.fileName));
  }
}
