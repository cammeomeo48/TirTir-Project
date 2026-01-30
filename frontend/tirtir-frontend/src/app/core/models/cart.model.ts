export interface CartItem {
    product: {
        _id: string;
        Name: string;
        Price: number;
        Thumbnail_Images: string;
    };
    quantity: number;
    shade?: string;
    _id?: string;
}

export interface Cart {
    _id: string;
    user: string;
    items: CartItem[];
    totalPrice: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
    shade?: string;
}

export interface UpdateCartItemRequest {
    productId: string;
    quantity: number;
    shade?: string;
}
