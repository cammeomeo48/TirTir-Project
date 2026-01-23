// Product data for TIRTIR product detail pages
// Cloned from original TIRTIR website

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
    shades?: ProductShade[];
    sizes?: { name: string; price: number }[];
    category: 'makeup' | 'skincare' | 'other';
    subcategory?: 'face' | 'lip' | 'cleanse-tone' | 'treatments' | 'moisturize-sunscreen';
}

export const PRODUCTS: ProductData[] = [
    // ========================================
    // MASK FIT RED CUSHION
    // ========================================
    {
        id: 'mask-fit-red-cushion',
        slug: 'mask-fit-red-cushion',
        name: 'MASK FIT RED CUSHION',
        price: 24.00,
        originalPrice: 30.00,
        rating: 4.9,
        reviewCount: 4521,
        description: 'The viral cushion foundation that provides 72-hour coverage with a lightweight, glass-skin finish. Perfect for all skin types.',
        fullDescription: 'Experience the #1 viral cushion foundation loved by millions. The Mask Fit Red Cushion offers buildable medium-to-full coverage that lasts up to 72 hours. Infused with Hibiscus Sabdariffa Flower Extract, Propolis Extract, and Astaxanthin to improve skin elasticity while providing antioxidant protection.',
        keyFeatures: [
            '72-Hour Long-Wearing Coverage',
            'Natural, Skin-Like Finish',
            'Available in 40 Shades',
            'Lightweight & Breathable Formula',
        ],
        howToUse: 'Press the puff gently onto the cushion to pick up product. Apply to the face using light dabbing motions, starting from the center and blending outwards. Build coverage as desired.',
        ingredients: 'Water, Cyclopentasiloxane, Titanium Dioxide (CI 77891), Trimethylsiloxysilicate, Propanediol, Iron Oxides (CI 77492), Isododecane, Dimethicone, Zinc Oxide, PEG-10 Dimethicone...',
        images: [
            'https://placehold.co/600x750/d32f2f/fff?text=Red+Cushion',
            'https://placehold.co/600x750/c62828/fff?text=Red+Cushion+2',
            'https://placehold.co/600x750/b71c1c/fff?text=Red+Cushion+3',
            'https://placehold.co/600x750/e53935/fff?text=Red+Cushion+4',
        ],
        shades: [
            { name: '13N Porcelain', color: '#f5e6dc' },
            { name: '17C Light Vanilla', color: '#f0dcd0' },
            { name: '21N Ivory', color: '#e8d0c0' },
            { name: '23N Sand', color: '#dcc4b0' },
            { name: '25N Warm Beige', color: '#d0b8a0' },
            { name: '27N Honey', color: '#c4a890' },
            { name: '30N Beige', color: '#b89880' },
            { name: '32N Caramel', color: '#a88870' },
        ],
        category: 'makeup',
        subcategory: 'face',
    },

    // ========================================
    // MASK FIT ALL COVER CUSHION
    // ========================================
    {
        id: 'mask-fit-all-cover-cushion',
        slug: 'mask-fit-all-cover-cushion',
        name: 'MASK FIT ALL COVER CUSHION',
        price: 25.00,
        originalPrice: 32.00,
        rating: 4.8,
        reviewCount: 3847,
        description: 'Flawless Coverage Meets 72-Hour Hydration. High-performance cushion foundation designed to deliver radiant, natural-looking coverage.',
        fullDescription: 'The TIRTIR Mask Fit All Cover Cushion Foundation is a high-performance cushion foundation designed to deliver radiant, natural-looking coverage with long-lasting hydration. Its lightweight, buildable formula ensures your skin looks smooth, even, and flawless while staying comfortably moisturized all day.',
        keyFeatures: [
            'Full-Coverage Perfection – Effortlessly evens skin tone, blurs pores, and conceals imperfections',
            '72-Hour Hydration – Enriched with hyaluronic acid and botanical extracts',
            'Lightweight Texture – Breathable and non-cakey, ideal for sensitive skin',
            'Buildable Formula – Customize coverage from natural to full',
        ],
        howToUse: 'Use the included puff to gently tap the product onto your skin for an even, seamless finish. Build coverage as needed.',
        ingredients: 'Water, Cyclopentasiloxane, Titanium Dioxide (CI 77891), Glycerin, Propanediol, Hyaluronic Acid, Niacinamide, Dimethicone...',
        images: [
            'https://placehold.co/600x750/5d4037/fff?text=All+Cover',
            'https://placehold.co/600x750/4e342e/fff?text=All+Cover+2',
            'https://placehold.co/600x750/3e2723/fff?text=All+Cover+3',
            'https://placehold.co/600x750/6d4c41/fff?text=All+Cover+4',
        ],
        shades: [
            { name: '13N Fair Ivory', color: '#f7ede8' },
            { name: '15N Light Porcelain', color: '#f5e6dc' },
            { name: '17C Light Vanilla', color: '#f0dcd0' },
            { name: '17N Light Ivory', color: '#eedcd2' },
            { name: '21C Warm Ivory', color: '#ecd4c4' },
            { name: '21N Ivory', color: '#e8d0c0' },
            { name: '23N Sand', color: '#dcc4b0' },
            { name: '25C Warm Beige', color: '#d4bca4' },
            { name: '27N Honey', color: '#c4a890' },
            { name: '30N Beige', color: '#b89880' },
            { name: '43N Truffle', color: '#8b7355' },
        ],
        category: 'makeup',
        subcategory: 'face',
    },

    // ========================================
    // MASK FIT AURA CUSHION
    // ========================================
    {
        id: 'mask-fit-aura-cushion',
        slug: 'mask-fit-aura-cushion',
        name: 'MASK FIT AURA CUSHION',
        price: 26.00,
        originalPrice: 34.00,
        rating: 4.7,
        reviewCount: 2156,
        description: 'Glow All Day with Effortless Radiance. Hydrating cushion foundation that delivers buildable coverage with a semi-glow finish.',
        fullDescription: 'Achieve a flawless, luminous complexion with the TIRTIR Mask Fit Aura Cushion, a hydrating cushion foundation that delivers buildable coverage, a semi-glow finish, and up to 72 hours of radiance. It\'s the perfect companion for glowing, confident skin—anytime, anywhere.',
        keyFeatures: [
            'Buildable, Full-Coverage Foundation – Smoothly covers imperfections, evening out skin tone',
            'Hydrating Formula for Comfort – Infused with skin-loving ingredients to nourish and hydrate',
            'Long-Wear Radiance for Up to 72 Hours – Stays luminous and fresh from day to night',
            'Skin-Friendly for All Types – Gentle enough for sensitive skin, lightweight texture',
        ],
        howToUse: 'Gently pat the foundation onto your skin using the included puff, layering as needed for a smooth, airbrushed finish.',
        ingredients: 'Water, Cyclopentasiloxane, Titanium Dioxide (CI 77891), Glycerin, Tridecyl Trimellitate, Pentaerythrityl Tetraisostearate, Alcohol Denat., Polymethylsilsesquioxane...',
        images: [
            'https://placehold.co/600x750/f8bbd9/000?text=Aura+Cushion',
            'https://placehold.co/600x750/f48fb1/000?text=Aura+Cushion+2',
            'https://placehold.co/600x750/ec407a/fff?text=Aura+Cushion+3',
            'https://placehold.co/600x750/fce4ec/000?text=Aura+Cushion+4',
        ],
        shades: [
            { name: '13N Fair Ivory', color: '#f7ede8' },
            { name: '15N Light Porcelain', color: '#f5e6dc' },
            { name: '17W Light Warm', color: '#f2e0d0' },
            { name: '21N Ivory', color: '#e8d0c0' },
            { name: '23N Sand', color: '#dcc4b0' },
            { name: '25N Warm Beige', color: '#d0b8a0' },
            { name: '27N Honey', color: '#c4a890' },
        ],
        category: 'makeup',
        subcategory: 'face',
    },

    // ========================================
    // MASK FIT MAKEUP FIXER
    // ========================================
    {
        id: 'mask-fit-makeup-fixer',
        slug: 'mask-fit-makeup-fixer',
        name: 'MASK FIT MAKEUP FIXER',
        price: 18.00,
        originalPrice: 22.00,
        rating: 4.6,
        reviewCount: 1892,
        description: 'Lock in Your Look, All Day Long. Powerful makeup setting spray to keep your look fresh, radiant, and long-lasting.',
        fullDescription: 'Keep your makeup flawless with the TIRTIR Mask Fit Makeup Fixer, a powerful makeup setting spray designed to ensure your look stays fresh, radiant, and long-lasting. This fine mist provides a protective layer that controls oil, resists humidity, and offers a soft blurring effect, making it the ultimate finishing touch for your beauty routine.',
        keyFeatures: [
            'Powerful Makeup Setting Spray – Creates a thin, even coating to lock in makeup for hours',
            'Oil Control and Blurring Effect – Reduces excess shine with soft-focus finish',
            'Fine Mist for Even Coverage – Wide-angle spray for thorough application',
            'Resists External Factors – Protective barrier against oil, friction, and humidity',
            'Lightweight and Comfortable – Natural feel while delivering professional performance',
        ],
        howToUse: 'Hold the bottle about 20-30 cm from your face and spray evenly after completing your makeup. Allow it to dry naturally for a flawless, long-lasting finish.',
        ingredients: 'Aqua/Water, Alcohol Denat., Pentylene Glycol, Butylene Glycol, 1,2-Hexanediol, Peg-60 Hydrogenated Castor Oil, Polyglyceryl-2 Oleate, Polyacrylic Acid, Centella Asiatica Extract, PVP...',
        images: [
            'https://placehold.co/600x750/90caf9/000?text=Makeup+Fixer',
            'https://placehold.co/600x750/64b5f6/000?text=Makeup+Fixer+2',
            'https://placehold.co/600x750/42a5f5/fff?text=Makeup+Fixer+3',
            'https://placehold.co/600x750/2196f3/fff?text=Makeup+Fixer+4',
        ],
        category: 'makeup',
        subcategory: 'face',
    },

    // ========================================
    // MASK FIT TONE UP ESSENCE
    // ========================================
    {
        id: 'mask-fit-tone-up-essence',
        slug: 'mask-fit-tone-up-essence',
        name: 'MASK FIT TONE UP ESSENCE',
        price: 22.00,
        originalPrice: 28.00,
        rating: 4.8,
        reviewCount: 1654,
        description: 'Your 2-in-1 Skincare Solution for Hydration and Radiance. Multi-functional tone-up essence for flawless, radiant glass-skin look.',
        fullDescription: 'Simplify your routine with the TIRTIR Mask Fit Tone Up Essence, a multi-functional tone-up essence that combines intense hydration and natural coverage to deliver a flawless, radiant glass-skin look. Lightweight and non-greasy, this all-in-one formula blends seamlessly with all skin tones.',
        keyFeatures: [
            '2-in-1 Multi-Functional Essence – Combines skincare and makeup base',
            'Natural Coverage with Skin Tone Correction – Available in Beige, Mint, and Lavender',
            'Deep Hydration with Lightweight Feel – Contains 72% skincare ingredients',
            'Glass-Skin Glow – Achieve a luminous, makeup-free look with dewy finish',
            'Gentle on Sensitive Skin – Passed hypoallergenic tests',
        ],
        howToUse: 'Apply an appropriate amount to the face and blend evenly. Use alone for a natural glow or as a primer under makeup.',
        ingredients: 'Water, Glycerin, Butylene Glycol, Niacinamide, Cocos Nucifera (Coconut) Extract, Prunus Persica (Peach) Fruit Extract, Titanium Dioxide, Dimethicone...',
        images: [
            'https://placehold.co/600x750/ffe0b2/000?text=Tone+Up+Essence',
            'https://placehold.co/600x750/ffcc80/000?text=Tone+Up+Essence+2',
            'https://placehold.co/600x750/ffb74d/000?text=Tone+Up+Essence+3',
            'https://placehold.co/600x750/ffa726/fff?text=Tone+Up+Essence+4',
        ],
        shades: [
            { name: 'Beige', color: '#f5e6d8' },
            { name: 'Mint', color: '#d4edda' },
            { name: 'Lavender', color: '#e8daef' },
        ],
        category: 'makeup',
        subcategory: 'face',
    },

    // ========================================
    // WATERISM GLOW MELTING BALM
    // ========================================
    {
        id: 'waterism-glow-melting-balm',
        slug: 'waterism-glow-melting-balm',
        name: 'WATERISM GLOW MELTING BALM',
        price: 16.00,
        originalPrice: 20.00,
        rating: 4.9,
        reviewCount: 1245,
        description: 'Hydration Meets Radiant Shine. A hydrating lip balm that provides long-lasting moisture, dazzling shine, and a 3D volume effect.',
        fullDescription: 'Achieve soft, plump lips with the TIRTIR Waterism Glow Melting Balm, a hydrating lip balm that provides long-lasting moisture, a dazzling shine, and a 3D volume effect for a radiant, healthy glow. This lightweight balm is perfect for those who want hydrated, glossy lips in one effortless step.',
        keyFeatures: [
            'Deeply Hydrating Balm for All-Day Comfort – Locks in moisture for hours',
            '3D Volume Effect for Plumper Lips – Enhances lips\' natural contours',
            'Dazzling Shine for a Radiant Glow – Glossy finish adds brilliance',
            'Lightweight, Non-Sticky Formula – Silky and smooth for everyday wear',
            'Versatile Use – Wear alone or layer over lip color',
        ],
        howToUse: 'Apply directly to lips as needed. Layer for more intense color and shine. Can be used alone or over your favorite lipstick.',
        ingredients: 'Diisostearyl Malate, Octyldodecanol, Polybutene, Hydrogenated Polyisobutene, Synthetic Wax, Silica Dimethyl Silylate...',
        images: [
            'https://placehold.co/600x750/ce93d8/000?text=Melting+Balm',
            'https://placehold.co/600x750/ba68c8/fff?text=Melting+Balm+2',
            'https://placehold.co/600x750/ab47bc/fff?text=Melting+Balm+3',
            'https://placehold.co/600x750/e1bee7/000?text=Melting+Balm+4',
        ],
        shades: [
            { name: '01 Mauve Rose Pearls', color: '#c48b9f' },
            { name: '02 Pink Berry Pearls', color: '#d4849e' },
            { name: '03 Coral Peach Pearls', color: '#e8a090' },
            { name: '04 Dusty Rose', color: '#b5838d' },
            { name: '05 Rosy Peach', color: '#dba39a' },
            { name: '06 Soft Pink', color: '#e8b4bc' },
        ],
        category: 'makeup',
        subcategory: 'lip',
    },

    // ========================================
    // WATERISM GLOW TINT
    // ========================================
    {
        id: 'waterism-glow-tint',
        slug: 'waterism-glow-tint',
        name: 'WATERISM GLOW TINT',
        price: 18.00,
        originalPrice: 24.00,
        rating: 4.8,
        reviewCount: 2341,
        description: 'Hydrating Color Meets 12-Hour Moisture. Perfect blend of hydration and shine with a plumping effect.',
        fullDescription: 'Experience the perfect blend of hydration and shine with the TIRTIR Waterism Glow Tint. This hydrating lip tint delivers a plumping effect, dazzling shine, and up to 12 hours of continuous moisture. With 9 natural shades to enhance your beauty, it\'s the ultimate accessory for lips that look and feel irresistibly soft, smooth, and radiant.',
        keyFeatures: [
            'Hydrating Lip Tint with Long-Lasting Moisture – 12 hours of hydration',
            'Plumping Effect for Fuller Lips – Enhances natural volume',
            'Dazzling Shine with 9 Natural Shades – Radiant finish for all skin tones',
            'Lightweight, Non-Sticky Formula – Smooth, even color application',
            'Perfect for On-the-Go Touch-Ups – Compact and convenient',
        ],
        howToUse: 'Apply directly from the applicator to the center of your lips and blend outward. Build color as desired.',
        ingredients: 'Polybutene, Diisostearyl Malate, Hydrogenated Polyisobutene, Octyldodecanol, Ethylhexyl Palmitate, Silica Dimethyl Silylate...',
        images: [
            'https://placehold.co/600x750/ef9a9a/000?text=Glow+Tint',
            'https://placehold.co/600x750/e57373/fff?text=Glow+Tint+2',
            'https://placehold.co/600x750/ef5350/fff?text=Glow+Tint+3',
            'https://placehold.co/600x750/ffcdd2/000?text=Glow+Tint+4',
        ],
        shades: [
            { name: '01 Mauve Rose Pearls', color: '#c48b9f' },
            { name: '02 Pink Berry', color: '#d4627d' },
            { name: '03 Cherry Red', color: '#c23b4c' },
            { name: '04 Coral Pink', color: '#e88b8b' },
            { name: '05 Orange Coral', color: '#e8775e' },
            { name: '06 Rose Wood', color: '#a86060' },
            { name: '07 Fig Brown', color: '#8b5a5a' },
            { name: '08 Plum Berry', color: '#8e4a5e' },
            { name: '09 Brick Red', color: '#a84040' },
        ],
        category: 'makeup',
        subcategory: 'lip',
    },

    // ========================================
    // MINI WATERISM GLOW TINT
    // ========================================
    {
        id: 'mini-waterism-glow-tint',
        slug: 'mini-waterism-glow-tint',
        name: 'MINI WATERISM GLOW TINT',
        price: 10.00,
        originalPrice: 14.00,
        rating: 4.9,
        reviewCount: 3892,
        description: '12 hours of continuous moisture, plumping effect, and radiant shine. Available in 30 natural shades.',
        fullDescription: 'The TIRTIR Mini Waterism Glow Tint is a hydrating lip tint that delivers 12 hours of continuous moisture, a plumping effect, and a radiant shine. Available in 30 natural shades, it enhances your natural beauty and comes in a convenient mini size, perfect for travel or on-the-go touch-ups!',
        keyFeatures: [
            '12-Hour Continuous Moisture – Long-lasting hydration',
            'Plumping Effect – Fuller, more youthful-looking lips',
            'Radiant Shine – Beautiful glossy finish',
            '30 Natural Shades – Perfect color for every skin tone',
            'Mini Size – Perfect for travel and on-the-go',
        ],
        howToUse: 'Apply directly from the applicator to the center of your lips and blend outward. Build color as desired.',
        ingredients: 'Polybutene, Diisostearyl Malate, Hydrogenated Polyisobutene, Octyldodecanol, Ethylhexyl Palmitate...',
        images: [
            'https://placehold.co/600x750/f48fb1/000?text=Mini+Tint',
            'https://placehold.co/600x750/f06292/fff?text=Mini+Tint+2',
            'https://placehold.co/600x750/ec407a/fff?text=Mini+Tint+3',
            'https://placehold.co/600x750/fce4ec/000?text=Mini+Tint+4',
        ],
        shades: [
            { name: '01 Mauve Rose', color: '#c48b9f' },
            { name: '02 Pink Berry', color: '#d4627d' },
            { name: '03 Cherry Red', color: '#c23b4c' },
            { name: '04 Coral Pink', color: '#e88b8b' },
            { name: '05 Soft Peach', color: '#f0a090' },
            { name: '06 Rose Nude', color: '#c9a090' },
            { name: '07 Dusty Rose', color: '#b5838d' },
            { name: '08 Plum', color: '#8e4a5e' },
        ],
        category: 'makeup',
        subcategory: 'lip',
    },

    // ========================================
    // WATER MELLOW LIP BALM
    // ========================================
    {
        id: 'water-mellow-lip-balm',
        slug: 'water-mellow-lip-balm',
        name: 'WATER MELLOW LIP BALM',
        price: 14.00,
        originalPrice: 18.00,
        rating: 4.7,
        reviewCount: 987,
        description: 'Hydrate, Shine, and Enhance Your Natural Beauty. Luxurious hydrating balm with watercolor-like tint.',
        fullDescription: 'Transform your lip care routine with the TIRTIR Water Mellow Lip Balm, a luxurious, hydrating balm that delivers a watercolor-like tint with a glossy, non-sticky finish. Designed to keep your lips soft, smooth, and nourished, this balm is the ultimate everyday essential for achieving radiant, natural-looking lips with a touch of shine.',
        keyFeatures: [
            'Watercolor-Like Color – Enhances natural lip color with soft, transparent hues',
            'Glossy, Non-Sticky Finish – Weightless and smooth feel',
            'Soft, Buttery Texture – Melts effortlessly at body temperature',
            'Daily Intense Hydration – Keeps lips hydrated, plump, and comfortable',
            'Perfect for Everyday Use – Combines lip care and beauty',
        ],
        howToUse: 'Apply directly to your lips as needed throughout the day for hydration and a touch of natural color. Layer for added shine and intensity.',
        ingredients: 'Diisostearyl Malate, Polybutene, Octyldodecanol, Hydrogenated Polyisobutene, Synthetic Wax, Ethylhexyl Palmitate...',
        images: [
            'https://placehold.co/600x750/81d4fa/000?text=Mellow+Balm',
            'https://placehold.co/600x750/4fc3f7/000?text=Mellow+Balm+2',
            'https://placehold.co/600x750/29b6f6/fff?text=Mellow+Balm+3',
            'https://placehold.co/600x750/b3e5fc/000?text=Mellow+Balm+4',
        ],
        shades: [
            { name: '01 Icy Blue', color: '#a8d4e6' },
            { name: '02 Soft Pink', color: '#f4c2c2' },
            { name: '03 Coral', color: '#f08080' },
            { name: '04 Peach', color: '#ffdab9' },
            { name: '05 Rose', color: '#e8b4bc' },
        ],
        category: 'makeup',
        subcategory: 'lip',
    },

    // ========================================
    // HYDRO BOOST ENZYME CLEANSING BALM
    // ========================================
    {
        id: 'hydro-boost-enzyme-cleansing-balm',
        slug: 'hydro-boost-enzyme-cleansing-balm',
        name: 'HYDRO BOOST ENZYME CLEANSING BALM',
        price: 28.00,
        originalPrice: 35.00,
        rating: 4.8,
        reviewCount: 1567,
        description: 'Deep Cleansing, Hydration, and Brightening in One Step. A luxurious, mineral oil-free cleansing balm.',
        fullDescription: 'Achieve clean, hydrated, and radiant skin with the TIRTIR Hydro Boost Enzyme Cleansing Balm, a luxurious, mineral oil-free cleansing balm that effortlessly removes makeup, impurities, and sunscreen. Infused with the patented Rice Enziotics Complex and active enzymes, this balm gently exfoliates, hydrates, and brightens for a smooth, poreless complexion.',
        keyFeatures: [
            'Powerful Cleansing Action – Removes 99.21% of waterproof makeup and 99.1% of sunscreen',
            'Hydrating and Brightening Formula – Enriched with Rice Extract, Niacinamide, and Rice Bran Oil',
            'Gentle Exfoliation – Patented Rice Enziotics Complex clears dead skin cells',
            'Restores Balance – Five Probiotics support healthy skin microbiome',
            'Improves Skin Texture – Reduces blackheads by 15.18% and whiteheads by 38.51%',
            'Hypoallergenic – Suitable for sensitive skin',
        ],
        howToUse: 'Scoop a small amount onto dry skin and massage gently. Add water to emulsify the balm into a milky texture, then rinse thoroughly.',
        ingredients: 'Cetyl Ethylhexanoate, Triethylhexanoin, C12-15 Alkyl Benzoate, Water, Polyglyceryl-10 Dioleate, Niacinamide, Rice Extract, Rice Bran Oil, Oryzanol...',
        images: [
            'https://placehold.co/600x750/a5d6a7/000?text=Cleansing+Balm',
            'https://placehold.co/600x750/81c784/000?text=Cleansing+Balm+2',
            'https://placehold.co/600x750/66bb6a/fff?text=Cleansing+Balm+3',
            'https://placehold.co/600x750/c8e6c9/000?text=Cleansing+Balm+4',
        ],
        sizes: [
            { name: '120ml', price: 28.00 },
        ],
        category: 'skincare',
        subcategory: 'cleanse-tone',
    },

    // ========================================
    // MILK SKIN TONER
    // ========================================
    {
        id: 'milk-skin-toner',
        slug: 'milk-skin-toner',
        name: 'MILK SKIN TONER',
        price: 24.00,
        originalPrice: 30.00,
        rating: 4.9,
        reviewCount: 2341,
        description: 'Deep Hydration for Radiant, Healthy Skin. A moisturizing toner with 2% Niacinamide.',
        fullDescription: 'Discover the power of TIRTIR Milk Skin Toner, a moisturizing toner designed to hydrate, brighten, and strengthen your skin. Infused with 2% Niacinamide, Rice Bran Extract, Ceramide, and Panthenol, this vegan formula delivers long-lasting hydration while enhancing your skin\'s natural glow and fortifying its protective barrier.',
        keyFeatures: [
            'Deeply Hydrating Toner – Intense, long-lasting moisture for soft, smooth skin',
            'Brightens and Evens Skin Tone – 2% Niacinamide and Rice Bran Extract',
            'Strengthens the Skin Barrier – Ceramide and Panthenol protection',
            'Soothes and Calms Irritation – Cica and Witch Hazel reduce redness',
            'Vegan and Suitable for All Skin Types – Cruelty-free formula',
        ],
        howToUse: 'After cleansing, pour a small amount onto a cotton pad or your palms and gently pat it into your skin. Follow with your favorite moisturizer for best results.',
        ingredients: 'Aqua/Water/Eau, Glycerin, Butylene Glycol, Niacinamide, Anthemis Nobilis (Chamomile) Flower Extract, Oryza Sativa (Rice) Bran Extract, Ceramide NP, Panthenol...',
        images: [
            'https://placehold.co/600x750/fff9c4/000?text=Milk+Toner',
            'https://placehold.co/600x750/fff59d/000?text=Milk+Toner+2',
            'https://placehold.co/600x750/ffee58/000?text=Milk+Toner+3',
            'https://placehold.co/600x750/fffde7/000?text=Milk+Toner+4',
        ],
        sizes: [
            { name: '150ml', price: 24.00 },
        ],
        category: 'skincare',
        subcategory: 'cleanse-tone',
    },

    // ========================================
    // MATCHA SKIN TONER
    // ========================================
    {
        id: 'matcha-skin-toner',
        slug: 'matcha-skin-toner',
        name: 'MATCHA SKIN TONER',
        price: 26.00,
        originalPrice: 32.00,
        rating: 4.7,
        reviewCount: 1892,
        description: 'Matcha Latte for Your Skin. Soothe and hydrate with 10,000 ppm Matcha-PDRN and Soymilk Complex.',
        fullDescription: 'Soothe and hydrate with the TIRTIR Matcha Calming Toner—infused with 10,000 ppm Matcha-PDRN and a Soymilk Complex for deep nourishment and moisture balance. This mildly acidic, non-irritating formula calms redness, restores skin\'s natural pH, and absorbs quickly with Micro Dipping Tech for an even, refreshed complexion.',
        keyFeatures: [
            'Redness Relief – Matcha-PDRN and patented Green Herb Protector calm irritation',
            'Balanced & Gentle – pH 6.0 skin-friendly formula strengthens skin barrier',
            'Moisture Complex – Soymilk Complex and Lactobacillus Ferment for lasting hydration',
            'Micro Dipping Tech – Ultra-fine particles for deeper, more even absorption',
            'Sebum & Cooling Care – DE-Sebum Controller regulates excess oil',
        ],
        howToUse: 'After cleansing, apply an appropriate amount to your skin using hands or a cotton pad. Gently pat in until absorbed, then follow with serum or moisturizer.',
        ingredients: 'Water, Glycerin, Butylene Glycol, Matcha Extract, Lactobacillus Ferment, Soy Milk Protein, Ceramide NP, Centella Asiatica Extract...',
        images: [
            'https://placehold.co/600x750/c5e1a5/000?text=Matcha+Toner',
            'https://placehold.co/600x750/aed581/000?text=Matcha+Toner+2',
            'https://placehold.co/600x750/9ccc65/fff?text=Matcha+Toner+3',
            'https://placehold.co/600x750/dcedc8/000?text=Matcha+Toner+4',
        ],
        category: 'skincare',
        subcategory: 'cleanse-tone',
    },

    // ========================================
    // MILK CREAMY FOAM CLEANSER
    // ========================================
    {
        id: 'milk-creamy-foam-cleanser',
        slug: 'milk-creamy-foam-cleanser',
        name: 'MILK CREAMY FOAM CLEANSER',
        price: 18.00,
        originalPrice: 24.00,
        rating: 4.8,
        reviewCount: 1234,
        description: 'Achieve a Deep, Hydrating Cleanse. A unique 3-step cream cheese mask-to-foam cleanser.',
        fullDescription: 'Discover the TIRTIR Milk Creamy Foam Cleanser, a unique 3-step cream cheese mask-to-foam cleanser designed to deliver a thorough yet gentle cleanse with a hydrating, milky finish. This innovative formula, whipped 5,000 times, transforms your cleansing routine into a luxurious, sensorial experience.',
        keyFeatures: [
            '3-Step Cream Cheese Transformation – Fluffy cream to cheese to rich milk foam',
            'Gentle Exfoliation & Hydration – 10% naturally derived cellulose',
            'Skin-Friendly Formula – Mildly acidic pH of 6.0, 91% natural ingredients',
            'Proven Efficacy – Improves makeup cleansing, blackheads, and skin texture',
            'Zero Tightness – Leaves skin hydrated, soft, and comfortable',
        ],
        howToUse: 'Apply to damp skin, massage gently to create foam. Leave on for 30 seconds for mask effect, then rinse thoroughly with lukewarm water.',
        ingredients: 'Water, Glycerin, Potassium Cocoyl Glycinate, Stearic Acid, Lauric Acid, Myristic Acid, Potassium Hydroxide, Cellulose, Milk Protein...',
        images: [
            'https://placehold.co/600x750/ffe0b2/000?text=Foam+Cleanser',
            'https://placehold.co/600x750/ffcc80/000?text=Foam+Cleanser+2',
            'https://placehold.co/600x750/ffb74d/000?text=Foam+Cleanser+3',
            'https://placehold.co/600x750/fff3e0/000?text=Foam+Cleanser+4',
        ],
        category: 'skincare',
        subcategory: 'cleanse-tone',
    },

    // ========================================
    // CERAMIC CREAM
    // ========================================
    {
        id: 'ceramic-cream',
        slug: 'ceramic-cream',
        name: 'CERAMIC CREAM',
        price: 32.00,
        originalPrice: 40.00,
        rating: 4.9,
        reviewCount: 2876,
        description: 'Deep Hydration for Ultra-Smooth, Radiant Skin. A rich, nourishing moisturizer with natural ceramides.',
        fullDescription: 'Transform your skin with TIRTIR Ceramic Cream, a rich, nourishing moisturizer formulated to deeply hydrate, smooth, and lock in your skincare routine. Packed with natural ceramides, peptides, and Centella Asiatica extract, this luxurious cream delivers long-lasting hydration and a glowing, dolphin-like finish for healthy, radiant skin.',
        keyFeatures: [
            'Rich Hydration with Natural Ceramides – Strengthens skin barrier and locks in moisture',
            'Smooth and Radiant Skin – Collagen, niacinamide, and peptides improve elasticity',
            'Nourishing Ingredients – Shea butter and avocado oil for intense hydration',
            'Calms and Soothes Irritation – Centella Asiatica extract reduces redness',
            'Clean Beauty Formula – Free from parabens, sulfates, artificial fragrance',
        ],
        howToUse: 'After cleansing and applying serums or treatments, take a small amount of cream and gently massage it into your face and neck. Use it morning and night as the final step.',
        ingredients: 'Water, Glycerin, Butylene Glycol, Caprylic/Capric Triglyceride, Cetearyl Alcohol, Ceramide NP, Centella Asiatica Extract, Niacinamide, Collagen...',
        images: [
            'https://placehold.co/600x750/fff8e1/000?text=Ceramic+Cream',
            'https://placehold.co/600x750/ffecb3/000?text=Ceramic+Cream+2',
            'https://placehold.co/600x750/ffe082/000?text=Ceramic+Cream+3',
            'https://placehold.co/600x750/fffde7/000?text=Ceramic+Cream+4',
        ],
        sizes: [
            { name: '50ml / 1.69 fl.oz.', price: 32.00 },
        ],
        category: 'skincare',
        subcategory: 'moisturize-sunscreen',
    },

    // ========================================
    // MATCHA CALMING CREAM
    // ========================================
    {
        id: 'matcha-calming-cream',
        slug: 'matcha-calming-cream',
        name: 'MATCHA CALMING CREAM',
        price: 34.00,
        originalPrice: 42.00,
        rating: 4.8,
        reviewCount: 1543,
        description: 'Soothing Strength, All Day Long. A bouncy pudding-textured moisturizer with 10,000 ppm Matcha-PDRN.',
        fullDescription: 'The TIRTIR Matcha Calming Cream is a bouncy pudding-textured moisturizer that wraps the skin in soothing care while boosting firmness and elasticity. Infused with 10,000 ppm Matcha-PDRN, vegan collagen, and 13 peptides, it calms redness, strengthens the skin barrier, and delivers 24-hour hydration.',
        keyFeatures: [
            '24-Hour Redness Relief – Clinically tested to calm redness and irritation',
            'Matcha-PDRN 10,000 ppm – Protects against external stressors while soothing',
            'Bouncy Pudding Texture – Locks in moisture and firming care without heaviness',
            'Firming Core Solution – Vegan collagen and 13-peptide complex restore elasticity',
            'Barrier Support – Phytomucin 5 Complex reinforces natural defenses',
        ],
        howToUse: 'After cleansing and toning, apply an appropriate amount to the face and gently pat until absorbed. Use morning and night.',
        ingredients: 'Water, Glycerin, Butylene Glycol, Matcha Extract, Vegan Collagen, Peptide Complex, Centella Asiatica Extract, Ceramide NP...',
        images: [
            'https://placehold.co/600x750/c8e6c9/000?text=Matcha+Cream',
            'https://placehold.co/600x750/a5d6a7/000?text=Matcha+Cream+2',
            'https://placehold.co/600x750/81c784/fff?text=Matcha+Cream+3',
            'https://placehold.co/600x750/dcedc8/000?text=Matcha+Cream+4',
        ],
        category: 'skincare',
        subcategory: 'moisturize-sunscreen',
    },

    // ========================================
    // HYDRO UV SHIELD SUNSCREEN
    // ========================================
    {
        id: 'hydro-uv-shield-sunscreen',
        slug: 'hydro-uv-shield-sunscreen',
        name: 'HYDRO UV SHIELD SUNSCREEN',
        price: 22.00,
        originalPrice: 28.00,
        rating: 4.7,
        reviewCount: 1987,
        description: 'Ultimate Sun Protection with Hydration and Care. Lightweight SPF50+ sunscreen.',
        fullDescription: 'Shield your skin from harmful UV rays while keeping it hydrated and refreshed with the TIRTIR Hydro UV Shield Sunscreen. This lightweight, SPF50+ sunscreen combines powerful sun defense with the benefits of a skincare routine, leaving your skin plump, soothed, and free from any white cast.',
        keyFeatures: [
            'SPF50+ Protection – Broad-spectrum protection against UVA and UVB rays',
            'Hydrating Formula – Hyaluronic Acid and Phyto-Collagen for skin elasticity',
            'Soothing Aloe Vera and Panthenol – Calms and refreshes irritated skin',
            'Lightweight, Non-Greasy Texture – Absorbs quickly without residue',
            'White-Cast Free – Blends seamlessly into all skin tones',
        ],
        howToUse: 'Apply generously to face and neck as the last step of your morning skincare routine. Reapply every 2-3 hours for optimal protection.',
        ingredients: 'Water, Dipropylene Glycol, Methyl Methacrylate Crosspolymer, Hyaluronic Acid, Hydrolyzed Collagen, Aloe Barbadensis Leaf Extract, Panthenol...',
        images: [
            'https://placehold.co/600x750/e3f2fd/000?text=Sunscreen',
            'https://placehold.co/600x750/bbdefb/000?text=Sunscreen+2',
            'https://placehold.co/600x750/90caf9/000?text=Sunscreen+3',
            'https://placehold.co/600x750/e1f5fe/000?text=Sunscreen+4',
        ],
        category: 'skincare',
        subcategory: 'moisturize-sunscreen',
    },

    // ========================================
    // MATCHA CALMING DUO SET
    // ========================================
    {
        id: 'matcha-calming-duo-set',
        slug: 'matcha-calming-duo-set',
        name: 'MATCHA CALMING DUO SET',
        price: 68.00,
        originalPrice: 85.00,
        rating: 4.9,
        reviewCount: 876,
        description: 'A calming, glow-boosting ritual inspired by your morning matcha. Duo set for dewy skin.',
        fullDescription: 'A calming, glow-boosting ritual inspired by your morning matcha. This duo combines the Matcha Toner and Matcha Cream to soothe stressed skin, top up hydration, and leave your complexion comfortably dewy — never greasy. Gentle enough for daily use, powerful enough to keep your skin looking well-rested.',
        keyFeatures: [
            'Complete Skincare Duo – Matcha Toner and Matcha Cream',
            'Calming Care – Soothes stressed and sensitive skin',
            'Glow-Boosting Hydration – Leaves complexion dewy, not greasy',
            'Daily Use Formula – Gentle enough for everyday skincare',
            'Value Set – Premium products at a special bundle price',
        ],
        howToUse: 'Start with Matcha Toner after cleansing, then finish with Matcha Cream for complete hydration and protection.',
        ingredients: 'Full ingredient list available for each individual product in the set.',
        images: [
            'https://placehold.co/600x750/dcedc8/000?text=Matcha+Duo',
            'https://placehold.co/600x750/c5e1a5/000?text=Matcha+Duo+2',
            'https://placehold.co/600x750/aed581/000?text=Matcha+Duo+3',
            'https://placehold.co/600x750/e8f5e9/000?text=Matcha+Duo+4',
        ],
        category: 'skincare',
        subcategory: 'moisturize-sunscreen',
    },

    // ========================================
    // SOS SERUM
    // ========================================
    {
        id: 'sos-serum',
        slug: 'sos-serum',
        name: 'SOS SERUM',
        price: 28.00,
        originalPrice: 35.00,
        rating: 4.8,
        reviewCount: 1876,
        description: 'Rescue and Revive Your Skin. A powerful hydrating and anti-aging serum for troubled skin.',
        fullDescription: 'Say goodbye to dull, dry, and irritated skin with the TIRTIR SOS Serum, a powerful hydrating and anti-aging serum designed to calm, soothe, and rejuvenate troubled skin. Infused with a blend of natural ingredients, this lightweight serum absorbs quickly to deliver deep hydration, reduce redness, and restore a balanced, glowing complexion.',
        keyFeatures: [
            'Deep Hydration and Skin Repair – Polyglutamic acid and Niacinamide',
            'Calms Redness and Irritation – Centella Asiatica, Chamomile, and Allantoin',
            'Targets Breakouts and Acne – Tea Tree Oil antiseptic benefits',
            'Brightens and Evens Skin Tone – Licorice root and Niacinamide',
            'Vegan and Free from Harsh Ingredients – No parabens, sulfates, alcohol',
            'Lightweight, Fast-Absorbing Formula – Non-greasy gel texture',
        ],
        howToUse: 'After cleansing and toning, apply 2-3 drops to your face and gently pat it in until absorbed. Follow with your favorite moisturizer.',
        ingredients: 'Water, Butylene Glycol, Glycerin, Niacinamide, Polyglutamic Acid, Centella Asiatica Extract, Chamomile Extract, Tea Tree Oil, Allantoin...',
        images: [
            'https://placehold.co/600x750/b3e5fc/000?text=SOS+Serum',
            'https://placehold.co/600x750/81d4fa/000?text=SOS+Serum+2',
            'https://placehold.co/600x750/4fc3f7/000?text=SOS+Serum+3',
            'https://placehold.co/600x750/e1f5fe/000?text=SOS+Serum+4',
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },

    // ========================================
    // CERAMIC MILK AMPOULE
    // ========================================
    {
        id: 'ceramic-milk-ampoule',
        slug: 'ceramic-milk-ampoule',
        name: 'CERAMIC MILK AMPOULE',
        price: 24.00,
        originalPrice: 30.00,
        rating: 4.9,
        reviewCount: 2134,
        description: 'Nourish and Hydrate for Radiant, Replenished Skin. A luxurious 3-in-1 hydrating serum.',
        fullDescription: 'Pamper your skin with the TIRTIR Ceramic Milk Ampoule, a luxurious, hydrating serum enriched with high-nutrient ingredients like Vegan Milk, Squalane, and Rice Bran Oil. Designed to deeply replenish and fortify your skin\'s barrier, this 3-in-1 powerhouse serum leaves your complexion radiant, soft, and glowing with health.',
        keyFeatures: [
            '3-in-1 Hydrating Serum – Nourishment, hydration, and barrier protection',
            'Vegan Milk for Complete Skin Nutrition – Lactobacillus and Soymilk fermentation',
            'Rich in Natural Oils – Rice Bran Oil and Coconut Oil',
            'Squalane for Long-Lasting Hydration – Locks in moisture',
            'Lightweight, Silky Texture – No greasy residue',
        ],
        howToUse: 'After cleansing and toning, apply a few drops to your face and gently pat it into your skin until fully absorbed. Follow with moisturizer.',
        ingredients: 'Water, Squalane, Glycerin, Rice Bran Oil, Coconut Oil, Lactobacillus Ferment, Soy Protein, Ceramide NP...',
        images: [
            'https://placehold.co/600x750/fff3e0/000?text=Milk+Ampoule',
            'https://placehold.co/600x750/ffe0b2/000?text=Milk+Ampoule+2',
            'https://placehold.co/600x750/ffcc80/000?text=Milk+Ampoule+3',
            'https://placehold.co/600x750/fff8e1/000?text=Milk+Ampoule+4',
        ],
        sizes: [
            { name: '10ml / 0.33 fl.oz.', price: 24.00 },
            { name: '40ml / 1.35 fl.oz.', price: 42.00 },
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },

    // ========================================
    // ORGANIC JOJOBA OIL (Placeholder)
    // ========================================
    {
        id: 'organic-jojoba-oil',
        slug: 'organic-jojoba-oil',
        name: 'ORGANIC JOJOBA OIL',
        price: 22.00,
        originalPrice: 28.00,
        rating: 4.7,
        reviewCount: 543,
        description: 'Pure, organic jojoba oil for deep skin nourishment. Placeholder - details to be updated.',
        fullDescription: 'Pure, organic jojoba oil that deeply nourishes and hydrates the skin. Jojoba oil closely resembles the skin\'s natural sebum, making it an excellent moisturizer for all skin types. Perfect for face, body, and hair care.',
        keyFeatures: [
            '100% Pure Organic Jojoba Oil',
            'Deeply Nourishes and Moisturizes',
            'Suitable for All Skin Types',
            'Multi-Purpose – Face, Body, and Hair',
            'Non-Comedogenic Formula',
        ],
        howToUse: 'Apply a few drops to clean skin and massage gently. Can be used alone or mixed with moisturizer.',
        ingredients: 'Simmondsia Chinensis (Jojoba) Seed Oil',
        images: [
            'https://placehold.co/600x750/dcedc8/000?text=Jojoba+Oil',
            'https://placehold.co/600x750/c8e6c9/000?text=Jojoba+Oil+2',
            'https://placehold.co/600x750/a5d6a7/000?text=Jojoba+Oil+3',
            'https://placehold.co/600x750/e8f5e9/000?text=Jojoba+Oil+4',
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },

    // ========================================
    // COLLAGEN LIFTING EYE CREAM
    // ========================================
    {
        id: 'collagen-lifting-eye-cream',
        slug: 'collagen-lifting-eye-cream',
        name: 'COLLAGEN LIFTING EYE CREAM',
        price: 32.00,
        originalPrice: 40.00,
        rating: 4.8,
        reviewCount: 1456,
        description: 'Lift, Brighten, and Rejuvenate Your Eyes. A revitalizing eye treatment with 10,000ppm collagen.',
        fullDescription: 'Achieve youthful, radiant eyes with the TIRTIR Collagen Lifting Eye Cream, a revitalizing eye treatment that firms, hydrates, and brightens the delicate skin around the eyes. Infused with 10,000ppm plant-derived collagen complex, peptides, and niacinamide, this advanced eye cream targets fine lines, wrinkles, and puffiness for smoother, firmer skin.',
        keyFeatures: [
            'High-Performance Anti-Aging – 10,000ppm collagen and 5 peptides',
            'Brightening and Hydrating – Niacinamide and avocado oil',
            'Soothing and Rejuvenating – Adenosine boosts collagen production',
            'Innovative Metal Ball Applicator – Precise and hygienic application',
            'Clinically Proven Results – Visible reduction in wrinkles in 2 weeks',
        ],
        howToUse: 'Using the metal ball applicator, apply a small amount around the eye area and gently massage in circular motions until absorbed.',
        ingredients: 'Water, Glycerin, Butylene Glycol, Collagen Complex, Niacinamide, Peptides, Adenosine, Avocado Oil...',
        images: [
            'https://placehold.co/600x750/e1bee7/000?text=Eye+Cream',
            'https://placehold.co/600x750/ce93d8/000?text=Eye+Cream+2',
            'https://placehold.co/600x750/ba68c8/fff?text=Eye+Cream+3',
            'https://placehold.co/600x750/f3e5f5/000?text=Eye+Cream+4',
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },

    // ========================================
    // COLLAGEN CORE GLOW MASK (Placeholder)
    // ========================================
    {
        id: 'collagen-core-glow-mask',
        slug: 'collagen-core-glow-mask',
        name: 'COLLAGEN CORE GLOW MASK',
        price: 28.00,
        originalPrice: 35.00,
        rating: 4.6,
        reviewCount: 432,
        description: 'Intensive collagen mask for glowing skin. Placeholder - details to be updated.',
        fullDescription: 'An intensive collagen-infused mask that delivers deep hydration and a radiant glow. Formulated with plant-derived collagen complex to boost skin elasticity and firmness while providing a luxurious pampering experience.',
        keyFeatures: [
            'Intensive Collagen Treatment',
            'Deep Hydration and Nourishment',
            'Boosts Skin Elasticity',
            'Radiant Glow Effect',
            'Luxurious Pampering Experience',
        ],
        howToUse: 'After cleansing, apply mask and leave on for 15-20 minutes. Remove and pat remaining essence into skin.',
        ingredients: 'Placeholder ingredient list - to be updated.',
        images: [
            'https://placehold.co/600x750/ffccbc/000?text=Glow+Mask',
            'https://placehold.co/600x750/ffab91/000?text=Glow+Mask+2',
            'https://placehold.co/600x750/ff8a65/fff?text=Glow+Mask+3',
            'https://placehold.co/600x750/fbe9e7/000?text=Glow+Mask+4',
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },

    // ========================================
    // DERMATIR PURE ROSEMARY CALMING MASK (Placeholder)
    // ========================================
    {
        id: 'dermatir-pure-rosemary-calming-mask',
        slug: 'dermatir-pure-rosemary-calming-mask',
        name: 'DERMATIR PURE ROSEMARY CALMING MASK',
        price: 26.00,
        originalPrice: 32.00,
        rating: 4.7,
        reviewCount: 387,
        description: 'Calming rosemary-infused mask for sensitive skin. Placeholder - details to be updated.',
        fullDescription: 'A pure rosemary-infused calming mask designed for sensitive and irritated skin. The soothing formula helps to reduce redness, calm inflammation, and restore skin balance while providing a refreshing aromatic experience.',
        keyFeatures: [
            'Pure Rosemary Extract',
            'Calms Sensitive and Irritated Skin',
            'Reduces Redness and Inflammation',
            'Restores Skin Balance',
            'Refreshing Aromatherapy Experience',
        ],
        howToUse: 'After cleansing, apply an even layer to face and leave on for 10-15 minutes. Rinse off with lukewarm water.',
        ingredients: 'Placeholder ingredient list - to be updated.',
        images: [
            'https://placehold.co/600x750/c8e6c9/000?text=Rosemary+Mask',
            'https://placehold.co/600x750/a5d6a7/000?text=Rosemary+Mask+2',
            'https://placehold.co/600x750/81c784/fff?text=Rosemary+Mask+3',
            'https://placehold.co/600x750/e8f5e9/000?text=Rosemary+Mask+4',
        ],
        category: 'skincare',
        subcategory: 'treatments',
    },
];

// Helper function to find product by slug
export function getProductBySlug(slug: string): ProductData | undefined {
    return PRODUCTS.find(p => p.slug === slug);
}

// Helper function to get products by category
export function getProductsByCategory(category: string): ProductData[] {
    return PRODUCTS.filter(p => p.category === category);
}
