import { ActivatedRoute } from '@angular/router';
import { Component, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { ProductsApi } from '@/products/services/products-api';
import { ProductCard } from '@/products/components/product-card/product-card';

import { map } from 'rxjs';
import { PaginationStore } from '@/shared/components/pagination/pagination-store';
import { Pagination } from '@/shared/components/pagination/pagination';

@Component({
  selector: 'app-gender-page',
  imports: [
    ProductCard,
    Pagination
  ],
  templateUrl: './gender-page.html',
})
export class GenderPage {

  route = inject(ActivatedRoute);
  productsService = inject(ProductsApi);
  paginationService = inject(PaginationStore);

  gender = toSignal(
    this.route.params.pipe(
      map(({ gender }) => gender)
    )
  );

  productsResource = rxResource({
    params: () => ({
      gender: this.gender(),
      page: this.paginationService.currentPage() - 1
    }),
    stream: ({ request }: any) => {
      return this.productsService.getProducts({
        gender: request.gender,
        offset: request.page * 9
      });
    },
  });
}
