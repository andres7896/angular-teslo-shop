import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap, Params } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { User } from '@/auth/interfaces/user.interface';
import { Gender, Product, ProductsResponse, Size } from '@/products/interfaces/product.interface';

/**
 * Helpers compartidos por los specs. Este archivo está excluido del build de la
 * aplicación (ver `tsconfig.app.json`) y sólo se compila con `tsconfig.spec.json`.
 */

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@teslo.com',
    fullName: 'Test User',
    isActive: true,
    roles: ['user'],
    ...overrides,
  };
}

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    title: 'Teslo T-Shirt',
    price: 100,
    description: 'Una camiseta de prueba',
    slug: 'teslo-t-shirt',
    stock: 15,
    sizes: [Size.M, Size.L],
    gender: Gender.Men,
    tags: ['shirt', 'summer'],
    images: ['image-1.jpg', 'image-2.jpg'],
    user: createUser(),
    ...overrides,
  };
}

export function createProductsResponse(
  overrides: Partial<ProductsResponse> = {},
): ProductsResponse {
  const products = overrides.products ?? [createProduct()];

  return {
    count: products.length,
    pages: 1,
    ...overrides,
    products,
  };
}

/** Doble de `ActivatedRoute` con `params` y `queryParamMap` controlables desde el test. */
export class ActivatedRouteStub {
  private paramsSubject: BehaviorSubject<Params>;
  private queryParamMapSubject: BehaviorSubject<ParamMap>;

  constructor(params: Params = {}, queryParams: Params = {}) {
    this.paramsSubject = new BehaviorSubject<Params>(params);
    this.queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap(queryParams));
  }

  get params(): Observable<Params> {
    return this.paramsSubject.asObservable();
  }

  get queryParamMap(): Observable<ParamMap> {
    return this.queryParamMapSubject.asObservable();
  }

  get snapshot() {
    return {
      params: this.paramsSubject.value,
      queryParamMap: this.queryParamMapSubject.value,
    };
  }

  setParams(params: Params): void {
    this.paramsSubject.next(params);
  }

  setQueryParams(queryParams: Params): void {
    this.queryParamMapSubject.next(convertToParamMap(queryParams));
  }
}

export function provideActivatedRouteStub(stub: ActivatedRouteStub) {
  return { provide: ActivatedRoute, useValue: stub };
}

/** Doble mínimo de `AuthApi` para los componentes que sólo leen su estado. */
export function createAuthApiMock(
  options: {
    user?: User | null;
    isAdmin?: boolean;
    authStatus?: 'checking' | 'authenticated' | 'not-authenticated';
  } = {},
) {
  const user = signal<User | null>(options.user ?? null);
  const authStatus = signal(options.authStatus ?? 'not-authenticated');
  const isAdmin = signal(options.isAdmin ?? false);

  return {
    user,
    authStatus,
    isAdmin,
    token: signal<string | null>(null),
    logout: jasmine.createSpy('logout'),
    login: jasmine.createSpy('login').and.returnValue(of(true)),
    signUp: jasmine.createSpy('signUp').and.returnValue(of(true)),
    checkStatus: jasmine.createSpy('checkStatus').and.returnValue(of(false)),
  };
}
