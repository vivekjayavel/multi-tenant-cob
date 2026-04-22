'use client';
import { useEffect, useRef } from 'react';
import { register } from 'swiper/element/bundle';

register();

export default function SwiperCarousel({
  children,
  slidesPerView   = 1,
  spaceBetween    = 16,
  loop            = false,
  autoplay        = false,
  autoplayDelay   = 3500,
  pagination      = false,
  navigation      = false,
  breakpoints,
  className       = '',
  centeredSlides  = false,
}) {
  const swiperRef = useRef(null);

  useEffect(() => {
    const el = swiperRef.current;
    if (!el) return;

    const params = {
      slidesPerView,
      spaceBetween,
      loop,
      centeredSlides,
      grabCursor: true,
      ...(autoplay && { autoplay: { delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true } }),
      ...(pagination && { pagination: { clickable: true } }),
      ...(navigation && { navigation: true }),
      ...(breakpoints && { breakpoints }),
      injectStyles: [
        `
        :host .swiper-button-next,
        :host .swiper-button-prev {
          color: var(--tenant-primary);
          background: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          --swiper-navigation-size: 16px;
        }
        :host .swiper-pagination-bullet-active {
          background: var(--tenant-primary);
        }
        :host .swiper-pagination-bullet {
          opacity: 0.4;
        }
        `,
      ],
    };

    Object.assign(el, params);
    el.initialize();
  }, []);

  return (
    <swiper-container ref={swiperRef} init="false" class={className}>
      {children}
    </swiper-container>
  );
}
