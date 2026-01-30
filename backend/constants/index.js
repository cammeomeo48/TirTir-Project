const ORDER_STATUS = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
};

const PAYMENT_METHOD = {
    COD: 'COD',
    BANK_TRANSFER: 'BANK_TRANSFER'
};

const ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

module.exports = {
    ORDER_STATUS,
    PAYMENT_METHOD,
    ROLES
};
