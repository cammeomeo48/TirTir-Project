exports.getMenus = async (req, res) => {
    try {
        // Static menu structure as requested
        const menu = [
            {
                label: 'Shop All',
                routerLink: '/shop',
                _order: 1
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
                            { label: 'Cushion', routerLink: '/shop', queryParams: { isSkincare: false, categorySlug: 'cushion' } },
                            { label: 'Primer', routerLink: '/shop', queryParams: { isSkincare: false, categorySlug: 'primer' } },
                            { label: 'Setting Spray', routerLink: '/shop', queryParams: { isSkincare: false, categorySlug: 'setting-spray' } }
                        ]
                    },
                    {
                        label: 'Lip',
                        routerLink: '/shop',
                        queryParams: { isSkincare: false },
                        children: [
                            { label: 'Tint', routerLink: '/shop', queryParams: { isSkincare: false, categorySlug: 'tint' } },
                            { label: 'Balm', routerLink: '/shop', queryParams: { isSkincare: false, categorySlug: 'balm' } }
                        ]
                    }
                ]
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
                            { label: 'Toner', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'toner' } },
                            { label: 'Cleanser', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'cleanser' } }
                        ]
                    },
                    {
                        label: 'Treatments',
                        routerLink: '/shop',
                        queryParams: { isSkincare: true },
                        children: [
                            { label: 'Serum', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'serum' } },
                            { label: 'Ampoule', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'ampoule' } },
                            { label: 'Essence', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'essence' } },
                            { label: 'Eye Cream', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'eye-cream' } },
                            { label: 'Mask', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'mask' } }
                        ]
                    },
                    {
                        label: 'Moisturize & Sun',
                        routerLink: '/shop',
                        queryParams: { isSkincare: true },
                        children: [
                            { label: 'Cream', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'cream' } },
                            { label: 'Sunscreen', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'sunscreen' } },
                            { label: 'Gift Set', routerLink: '/shop', queryParams: { isSkincare: true, categorySlug: 'gift-set' } }
                        ]
                    }
                ]
            },
            {
                label: 'Virtual Services',
                routerLink: '/virtual-services',
                _order: 4
            },
            {
                label: 'Contact',
                routerLink: '/contact',
                _order: 5
            },
            {
                label: 'About',
                routerLink: '/about',
                _order: 6
            }
        ];

        res.json(menu);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
