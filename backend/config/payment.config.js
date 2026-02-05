module.exports = {
  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || "YOUR_TMN_CODE",
    hashSecret: process.env.VNP_HASH_SECRET || "YOUR_HASH_SECRET",
    url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    returnUrl: "http://localhost:5000/api/payments/vnpay-return", // Endpoint backend xử lý return
  },
  // Có thể thêm momo, zalopay config ở đây sau này
};