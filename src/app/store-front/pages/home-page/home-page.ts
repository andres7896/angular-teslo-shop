import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ProductCard } from '@/products/components/product-card/product-card';
import { ProductsApi } from '@/products/services/products-api';
import { Pagination } from "@/shared/components/pagination/pagination";
import { PaginationStore } from '@/shared/components/pagination/pagination-store';
@Component({
  selector: 'app-home-page',
  imports: [ProductCard, Pagination],
  templateUrl: './home-page.html',
})
export class HomePage {

  productsService = inject(ProductsApi);
  paginationService = inject(PaginationStore);

  productsResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage() - 1 }),
    stream: ({ request }: any) => {
      return this.productsService.getProducts({
        offset: request.page * 9
      });
    },
  });
}
