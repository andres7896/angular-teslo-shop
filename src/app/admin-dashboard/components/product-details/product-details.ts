import { ProductsApi } from '@/products/services/products-api';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductCarousel } from '@/products/components/product-carousel/product-carousel';

import { Product } from '@/products/interfaces/product.interface';
import { FormErrorLabel } from '@/shared/components/form-error-label/form-error-label';

import { FormUtils } from '@utils/form-utils';
import { Router } from '@angular/router';
import { firstValueFrom, single } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [ProductCarousel, ReactiveFormsModule, FormErrorLabel],
  templateUrl: './product-details.html',
})
export class ProductDetails implements OnInit {
  product = input<Product>();

  route = inject(Router);
  fb = inject(FormBuilder);
  productService = inject(ProductsApi);

  wasSaved = signal<boolean>(false);

  imageFileList: FileList | undefined = undefined;
  tempImages = signal<string[]>([]);

  imagesToCarousel = computed(() => {
    const currentProductImages = [...this.product()!.images, ...this.tempImages()];

    return currentProductImages;
  });

  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(FormUtils.slugPattern)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: ['men', [Validators.required, Validators.pattern(/men|women|unisex|kid/)]],
  });

  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  ngOnInit(): void {
    this.setFormValue(this.product()!);
  }

  setFormValue(formLike: Partial<Product>) {
    this.productForm.patchValue(formLike as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(', ') });
  }

  onSizeClicked(size: string) {
    const currentSizes = this.productForm.value?.sizes ?? [];

    if (currentSizes.includes(size)) {
      currentSizes.splice(currentSizes.indexOf(size), 1);
    } else {
      currentSizes.push(size);
    }
    this.productForm.patchValue({ sizes: currentSizes });
  }

  async onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();

    if (!isValid) return;

    const formValue = this.productForm.value;

    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags:
        formValue.tags
          ?.toLocaleLowerCase()
          .split(',')
          .map((tag) => tag.trim()) ?? [],
    };

    if (this.product()?.id === 'new') {
      const product = await firstValueFrom(
        this.productService.createProduct(productLike, this.imageFileList)
      );

      this.route.navigateByUrl(`/admin/products/${product.id}`);
    }
    else {
      await firstValueFrom(
        this.productService.updateProduct(this.product()?.id!, productLike, this.imageFileList)
      );
    }

    this.wasSaved.set(true);

    setTimeout(() => {
      this.wasSaved.set(false);
    }, 3000);
  }

  //Images
  onFilesChanged( event: Event ) {
    const filesList = ( event.target as HTMLInputElement ).files;
    this.imageFileList = filesList ?? undefined;

    const imageUrl = Array.from( filesList ?? [] ).map(
      file => URL.createObjectURL( file )
    );

    this.tempImages.set( imageUrl );
  }
}
