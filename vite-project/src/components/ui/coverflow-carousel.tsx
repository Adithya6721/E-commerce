import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";
import type { Product } from "../../services/productService";
import { Link } from "react-router-dom";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

export const CoverflowCarousel = ({
  products,
}: {
  products: Product[];
}) => {
  if (!products || products.length === 0) return null;

  // Swiper loop mode requires at least 2x the slidesPerView.
  // If we have very few products, we duplicate them so the loop animation doesn't break.
  const displayProducts = products.length < 6 
    ? [...products, ...products, ...products].slice(0, Math.max(6, products.length * 2))
    : products;

  return (
    <div className="w-full bg-slate-950 py-20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center relative z-10">
        <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 sm:text-5xl drop-shadow-lg pb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Trending Now
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Experience our premium collection in immersive 3D. Swipe to explore.
        </p>
      </div>

      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 30, // Y-axis rotation
          stretch: 0, // Space between
          depth: 250, // Z-depth translation
          modifier: 1, // Effect multiplier
          slideShadows: true,
        }}
        loop={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ el: '.swiper-pagination', clickable: true }}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="w-full max-w-6xl mx-auto"
      >
        {displayProducts.map((product, idx) => (
          <SwiperSlide key={`${product.id}-${idx}`} className="w-[300px] sm:w-[400px] aspect-[4/5]">
            <Link to={`/products/${product.id}`} className="block w-full h-full relative group rounded-3xl overflow-hidden border border-white/10 bg-[#111111] p-3 shadow-2xl">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0a0c]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay for dark theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 text-left transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full backdrop-blur-md">
                      Rs {product.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Explore &rarr;</span>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <div className="swiper-pagination !relative !bottom-auto mt-10" />
      
      {/* Custom styles for pagination dots to fit dark theme */}
      <style>{`
        .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.3) !important;
          opacity: 1 !important;
          width: 10px;
          height: 10px;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          background-color: #ffffff !important;
          width: 24px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};
