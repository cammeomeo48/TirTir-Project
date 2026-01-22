export const MENU_ITEMS = [
  {
    label: 'Shop All',
    routerLink: '/shop',
  },
  {
    label: 'Makeup',
    routerLink: '/shop',
    queryParams: { isSkincare: false },
    children: [
      {
        label: 'Face',
        routerLink: '/shop',
        queryParams: { isSkincare: false },
        children: [
          {
            label: 'Mask Fit Red Cushion',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'cushion' },
          },
          {
            label: 'Mask Fit All-Cover Cushion',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'cushion' },
          },
          {
            label: 'Mask Fit Aura Cushion',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'cushion' },
          },
          {
            label: 'Mask Fit Tone Up Essence',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'primer' },
          },
          {
            label: 'Mask Fit Make Up Fixer',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'setting-spray' },
          },
        ],
      },
      {
        label: 'Lip',
        routerLink: '/shop',
        queryParams: { isSkincare: false },
        children: [
          {
            label: 'Waterism Glow Tint',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'tint' },
          },
          {
            label: 'Mini Waterism Glow Tint',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'tint' },
          },
          {
            label: 'Waterism Glow Melting Balm',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'balm' },
          },
          {
            label: 'Water Mellow Lip Balm',
            routerLink: '/shop',
            queryParams: { isSkincare: false, categorySlug: 'balm' },
          },
        ],
      },
    ],
  },
  {
    label: 'Skincare',
    routerLink: '/shop',
    queryParams: { isSkincare: true },
    children: [
      {
        label: 'Cleanse & Tone',
        routerLink: '/shop',
        queryParams: { isSkincare: true },
        children: [
          {
            label: 'Hydro Boost Enzyme Cleansing Balm',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'cleanser' },
          },
          {
            label: 'Milk Creamy Foam Cleanser',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'cleanser' },
          },
          {
            label: 'Milk Skin Toner',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'toner' },
          },
          {
            label: 'Matcha Skin Toner',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'toner' },
          },
        ],
      },
      {
        label: 'Treatments',
        routerLink: '/shop',
        queryParams: { isSkincare: true },
        children: [
          {
            label: 'SOS Serum',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'serum' },
          },
          {
            label: 'Ceramic Milk Ampoule',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'ampoule' },
          },
          {
            label: 'Organic Jojoba Oil',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'facial-oil' },
          },
          {
            label: 'Collagen Lifting Eye Cream',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'eye-cream' },
          },
          {
            label: 'Collagen Core Glow Mask',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'mask' },
          },
          {
            label: 'Dermatir Pure Rosemary Calming Mask',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'mask' },
          },
        ],
      },
      {
        label: 'Moisturize & Sun',
        routerLink: '/shop',
        queryParams: { isSkincare: true },
        children: [
          {
            label: 'Ceramic Cream',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'cream' },
          },
          {
            label: 'Matcha Calming Cream',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'cream' },
          },
          {
            label: 'Hydro UV Shield Sunscreen',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'sunscreen' },
          },
          {
            label: 'Matcha Calming Duo Set',
            routerLink: '/shop',
            queryParams: { isSkincare: true, categorySlug: 'gift-set' },
          },
        ],
      },
    ],
  },
  {
    label: 'Virtual Services',
    routerLink: '/virtual-services',
  },
  {
    label: 'Contact',
    routerLink: '/contact',
  },
  {
    label: 'About',
    routerLink: '/about',
  },
];
