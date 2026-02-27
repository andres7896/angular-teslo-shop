import { Product } from '@/products/interfaces/product.interface';
import { ProductImagePipe } from '@/products/pipes/product-image-pipe.ts-pipe';
import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'product-table',
  imports: [
    ProductImagePipe,
    RouterLink,
    CurrencyPipe
  ],
  templateUrl: './product-table.html',
})
export class ProductTable {

  products = input.required<Product[]>();
}
