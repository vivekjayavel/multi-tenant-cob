import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Swiper v9 CSS
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export { SwiperSlide };

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
  const modules = [
    ...(navigation ? [Navigation] : []),
    ...(pagination ? [Pagination] : []),
    ...(autoplay   ? [Autoplay]   : []),
  ];

  return (
    <Swiper
      modules={modules}
      slidesPerView={slidesPerView}
      spaceBetween={spaceBetween}
      loop={loop}
      centeredSlides={centeredSlides}
      grabCursor={true}
      navigation={navigation}
      pagination={pagination ? { clickable: true } : false}
      autoplay={autoplay ? { delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
      breakpoints={breakpoints}
      className={`swiper-themed ${className}`}
    >
      {children}
    </Swiper>
  );
}
