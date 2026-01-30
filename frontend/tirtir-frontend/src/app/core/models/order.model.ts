export interface OrderItem {
    product: string;
    name: string;
    quantity: number;
    price: number;
    shade?: string;
    image?: string;
}

export interface ShippingAddress {
    fullName: string;
    phone: string;
    address: string;
    city: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'COD' | 'BANK_TRANSFER';

export interface Order {
    _id: string;
    user: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrderRequest {
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
    message: string;
    orderId: string;
}
