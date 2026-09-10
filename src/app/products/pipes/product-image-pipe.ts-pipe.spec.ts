import { environment } from 'src/environments/environment';

import { ProductImagePipe } from './product-image-pipe.ts-pipe';

const baseUrl = environment.baseUrl;
const noImage = './assets/images/no-image.jpg';

describe('ProductImagePipe', () => {
  let pipe: ProductImagePipe;

  beforeEach(() => {
    pipe = new ProductImagePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the placeholder when the value is null', () => {
    expect(pipe.transform(null)).toBe(noImage);
  });

  it('should return a blob url untouched', () => {
    const blobUrl = 'blob:http://localhost:4200/1234-5678';

    expect(pipe.transform(blobUrl)).toBe(blobUrl);
  });

  it('should build the api url for a single image name', () => {
    expect(pipe.transform('shirt.jpg')).toBe(`${baseUrl}/files/product/shirt.jpg`);
  });

  it('should build the api url with the first image of a list', () => {
    expect(pipe.transform(['first.jpg', 'second.jpg'])).toBe(
      `${baseUrl}/files/product/first.jpg`,
    );
  });

  it('should return the placeholder for an empty list', () => {
    expect(pipe.transform([])).toBe(noImage);
  });
});
