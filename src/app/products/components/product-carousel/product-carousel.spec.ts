import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';

import { ProductCarousel } from './product-carousel';

describe('ProductCarousel', () => {
  let fixture: ComponentFixture<ProductCarousel>;
  let component: ProductCarousel;

  const images = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('img')).map((img) =>
      img.getAttribute('src'),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCarousel],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCarousel);
    component = fixture.componentInstance;
  });

  describe('template', () => {
    // Se evita la inicialización de Swiper para poder verificar el DOM que
    // realmente renderiza Angular (Swiper clona slides en modo loop).
    beforeEach(() => {
      spyOn(component, 'swiperInit');
    });

    it('should create', () => {
      fixture.componentRef.setInput('images', []);
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should render one slide per image', () => {
      fixture.componentRef.setInput('images', ['one.jpg', 'two.jpg', 'three.jpg']);
      fixture.detectChanges();

      expect(images()).toEqual([
        `${environment.baseUrl}/files/product/one.jpg`,
        `${environment.baseUrl}/files/product/two.jpg`,
        `${environment.baseUrl}/files/product/three.jpg`,
      ]);
    });

    it('should render the placeholder slide when there are no images', () => {
      fixture.componentRef.setInput('images', []);
      fixture.detectChanges();

      expect(images()).toEqual(['./assets/images/no-image.jpg']);
    });
  });

  describe('swiper lifecycle', () => {
    it('should initialize swiper after the view is ready', () => {
      fixture.componentRef.setInput('images', ['one.jpg']);
      fixture.detectChanges();

      expect(component.swiper).toBeDefined();
    });

    it('should not re-initialize swiper on the first change', () => {
      const initSpy = spyOn(component, 'swiperInit').and.callThrough();

      fixture.componentRef.setInput('images', ['one.jpg']);
      fixture.detectChanges();

      // Sólo la llamada de `ngAfterViewInit`, no la de `ngOnChanges`.
      expect(initSpy).toHaveBeenCalledTimes(1);
    });

    it('should destroy and rebuild swiper when the images change', () => {
      fixture.componentRef.setInput('images', ['one.jpg']);
      fixture.detectChanges();

      const destroySpy = spyOn(component.swiper!, 'destroy');
      const initSpy = spyOn(component, 'swiperInit');

      jasmine.clock().install();
      try {
        fixture.componentRef.setInput('images', ['two.jpg']);
        fixture.detectChanges();

        expect(destroySpy).toHaveBeenCalledWith(true, true);
        expect(initSpy).not.toHaveBeenCalled();

        jasmine.clock().tick(100);

        expect(initSpy).toHaveBeenCalledTimes(1);
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });
});
