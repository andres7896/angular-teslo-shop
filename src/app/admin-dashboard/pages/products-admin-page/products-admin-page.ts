import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ProductsApi } from '@/products/services/products-api';

import { ProductTable } from "@/products/components/product-table/product-table";
import { PaginationStore } from '@/shared/components/pagination/pagination-store';
import { Pagination } from '@/shared/components/pagination/pagination';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-products-admin-page',
  imports: [
    ProductTable,
    Pagination,
    RouterLink
],
  templateUrl: './products-admin-page.html',
})
export class ProductsAdminPage {

  productsService = inject(ProductsApi);
  paginationService = inject(PaginationStore);

  productsPerPage = signal(10);

  productsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage() - 1,
      limit: this.productsPerPage()
    }),
    stream: ({ request }: any) => {
      return this.productsService.getProducts({
        offset: request.page * 9,
        limit: request.limit,
      });
    },
  });
}
