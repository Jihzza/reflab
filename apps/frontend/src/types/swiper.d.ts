/**
 * Type declarations for Swiper CSS imports
 *
 * Swiper's CSS files don't have TypeScript declarations,
 * so we declare them as modules to prevent TS errors.
 */

declare module "swiper/css" {
  const content: string;
  export default content;
}

declare module "swiper/css/navigation" {
  const content: string;
  export default content;
}

declare module "swiper/css/pagination" {
  const content: string;
  export default content;
}

declare module "swiper/css/autoplay" {
  const content: string;
  export default content;
}
