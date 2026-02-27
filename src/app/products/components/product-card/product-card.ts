import { SlicePipe } from '@angular/common';
import { RouterLink } from "@angular/router";
import { Component, computed, inject, input } from '@angular/core';

import { ProductsApi } from '@/products/services/products-api';
import { Product } from '@/products/interfaces/product.interface';
import { ProductImagePipe } from '@/products/pipes/product-image-pipe.ts-pipe';

@Component({
  selector: 'product-card',
  imports: [RouterLink, SlicePipe, ProductImagePipe],
  templateUrl: './product-card.html',
})
export class ProductCard {

  product = input.required<Product>();

  productsService = inject( ProductsApi );

  imageUrl = computed(() => {
    return `http://localhost:3000/api/files/product/${
      this.product().images[0]
    }`
  });
}
