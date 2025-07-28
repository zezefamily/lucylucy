import { Image } from "@/types/blocks/base";

export interface TestimonialItem {
  avatar?: Image;
  name?: string;
  title?: string;
  comment?: string;
  emoji?: string;
}

export interface Testimonial {
  disabled?: boolean;
  title?: string;
  description?: string;
  items?: TestimonialItem[];
} 