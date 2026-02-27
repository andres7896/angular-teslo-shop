import { ActivatedRoute, Router } from '@angular/router';
import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { ProductsApi } from '@/products/services/products-api';

import { ProductDetails } from '@/admin-dashboard/components/product-details/product-details';

import { map } from 'rxjs';

@Component({
  selector: 'app-product-admin-page',
  imports: [
    ProductDetails
  ],
  templateUrl: './product-admin-page.html',
})
export class ProductAdminPage {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  productsService = inject(ProductsApi);

  productId = toSignal(
    this.activatedRoute.params.pipe(
      map(params => params['id'])
    )
  );

  productResource = rxResource({
    params: () => ({ id: this.productId() }),
    stream: ({ request }: any) => this.productsService.getById( request.id )
  });

  redirectEffect = effect(() => {
    if (this.productResource.error()) {
      this.router.navigate(['/admin/products']);
    }
  });
}
