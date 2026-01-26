
export interface ProductShade {
    name: string;
    color: string;
    image?: string;
}

export interface ProductData {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    description: string;
    fullDescription: string;
    keyFeatures: string[];
    howToUse: string;
    ingredients: string;
    images: string[];
    image?: string; // For compatibility with ProductCard
    shades?: ProductShade[];
    sizes?: { name: string; price: number }[];
    category: 'makeup' | 'skincare' | 'other';
    subcategory?: 'face' | 'lip' | 'cleanse-tone' | 'treatments' | 'moisturize-sunscreen';
}


