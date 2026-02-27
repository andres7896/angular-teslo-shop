
import { ActivatedRoute } from '@angular/router';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ProductsApi } from '@/products/services/products-api';
import { ProductCarousel } from "@/products/components/product-carousel/product-carousel";

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.html',
  imports: [ProductCarousel],
})
export class ProductPage {

  activateRoute = inject(ActivatedRoute);
  productsService = inject(ProductsApi);

  productIdSlug = this.activateRoute.snapshot.params['idSlug'];

  productResource = rxResource({
    params: () => ({ idSlug: this.productIdSlug }),
    stream: ({ request }: any) => this.productsService.getBySlug( request.idSlug )
  });
}
