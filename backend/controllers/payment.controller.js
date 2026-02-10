const axios = require('axios'); 
const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const paymentConfig = require('../config/payment.config');
const Order = require('../models/order.model')

// Hàm sort object bắt buộc của VNPay để tạo chữ ký đúng
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

exports.createPaymentUrl = async (req, res, next) => {
    try {
        const { orderId, amount, paymentMethod, bankCode, language = 'vn' } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ message: "Missing orderId or amount" });
        }

        let paymentUrl = '';

        switch (paymentMethod) {
            case 'VNPAY':
                paymentUrl = createVNPayUrl(req, orderId, amount, bankCode, language);
                break;
            case 'CARD':
                // Ép kiểu sang thẻ quốc tế
                paymentUrl = createVNPayUrl(req, orderId, amount, 'INTCARD', language);
                break;
            case 'MOMO':
                // Gọi hàm xử lý MoMo mới đã fix lỗi
                paymentUrl = await createMomoUrl(orderId, amount);
                break;
            default:
                return res.status(400).json({ message: "Invalid payment method" });
        }

        res.status(200).json({ paymentUrl });

    } catch (error) {
        console.error("Payment Controller Error:", error);
        // Trả lỗi chi tiết về Postman để dễ debug
        res.status(500).json({ 
            message: error.message || "Lỗi tạo thanh toán",
            detail: error.response?.data || "No details"
        });
    }
};

// --- LOGIC VNPAY ---
function createVNPayUrl(req, orderId, amount, bankCode, language) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = paymentConfig.vnpay.tmnCode;
    let secretKey = paymentConfig.vnpay.hashSecret;
    let vnpUrl = paymentConfig.vnpay.url;
    let returnUrl = paymentConfig.vnpay.returnUrl;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = language;
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; // Mã đơn hàng
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay tính đơn vị đồng (x100)
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    return vnpUrl;
}

// GET /api/payments/vnpay-return
exports.vnpayReturn = async (req, res, next) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode = paymentConfig.vnpay.tmnCode;
    let secretKey = paymentConfig.vnpay.hashSecret;

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        // Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];
        
        // Redirect về Frontend (Angular)
        if (rspCode === '00') {
             // Cập nhật trạng thái đơn hàng = PAID tại đây hoặc trong IPN
             await Order.findByIdAndUpdate(orderId, { 
                 paymentStatus: 'paid', 
                 paymentMethod: 'VNPAY' 
             });
             
             // Redirect về trang Success của Frontend
             res.redirect(`http://localhost:4200/order-confirmation/${orderId}?status=success`);
        } else {
             // Redirect về trang Failed/Checkout của Frontend
             res.redirect(`http://localhost:4200/checkout?status=failed&orderId=${orderId}`);
        }
    } else {
        res.redirect(`http://localhost:4200/checkout?status=error_signature`);
    }
};

// POST /api/payments/vnpay-ipn
exports.vnpayIPN = async (req, res, next) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = paymentConfig.vnpay.hashSecret;
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        // Tìm đơn hàng trong DB
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Kiểm tra số tiền (quan trọng)
        // if (order.totalAmount * 100 !== parseInt(vnp_Params['vnp_Amount'])) ...

        // Kiểm tra trạng thái đơn hàng hiện tại (chống update chồng chéo)
        if (order.paymentStatus !== 'paid') {
            if (rspCode === '00') {
                // Thành công
                order.paymentStatus = 'paid';
                order.paymentInfo = vnp_Params; // Lưu lại log VNPay
                await order.save();
                res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
                // Thất bại
                // order.paymentStatus = 'failed';
                // await order.save();
                res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
        } else {
            res.status(200).json({ RspCode: '02', Message: 'This order has been updated to the payment status' });
        }
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }
};

// GET /api/orders/:id/payment-status
exports.checkPaymentStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        
        res.json({ 
            status: order.paymentStatus, 
            method: order.paymentMethod 
        });
    } catch (err) {
        next(err);
    }
};

async function createMomoUrl(orderId, amount) {
    // Config Test Cứng (Dùng luôn để test)
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
    
    // Redirect về Frontend
    //const returnUrl = "http://localhost:4200/order-confirmation/" + orderId;
    const returnUrl = "http://localhost:5001/api/payments/momo-return";
    const ipnUrl = "http://localhost:5001/api/payments/momo-ipn"; // Localhost k nhận dc IPN thật nhưng kệ nó

    const requestId = partnerCode + new Date().getTime();
    const orderInfo = "Thanh toan don hang " + orderId;
    const requestType = "captureWallet";
    const extraData = "";
    
    // FIX QUAN TRỌNG: Chuyển amount sang string
    const amountStr = amount.toString(); 

    // Tạo chữ ký
    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // Body gửi sang MoMo
    const requestBody = {
        partnerCode,
        partnerName: "TirTir Store",
        storeId: "MomoTestStore",
        requestId,
        amount: amountStr, // Gửi string
        orderId,
        orderInfo,
        redirectUrl: returnUrl,
        ipnUrl,
        lang: 'vi',
        requestType,
        autoCapture: true,
        extraData,
        signature
    };

    // Gọi API
    const response = await axios.post(endpoint, requestBody);
    return response.data.payUrl;
}

// GET /api/payments/momo-return
exports.momoReturn = async (req, res, next) => {
    try {
        const { resultCode, orderId } = req.query;
        // resultCode = 0 là thành công
        
        if (resultCode == '0') {
             // Cập nhật DB
             await Order.findByIdAndUpdate(orderId, { 
                 paymentStatus: 'paid', 
                 paymentMethod: 'MOMO' 
             });
             res.redirect(`http://localhost:4200/order-confirmation/${orderId}?status=success`);
        } else {
             res.redirect(`http://localhost:4200/checkout?status=failed&orderId=${orderId}`);
        }
    } catch (error) {
        next(error);
    }
};

// POST /api/payments/momo-ipn
exports.momoIPN = async (req, res, next) => {
    // MoMo gọi vào đây để báo kết quả (Server-to-Server)
    try {
        const { resultCode, orderId } = req.body; // MoMo gửi body JSON
        
        if (resultCode == '0') {
            await Order.findByIdAndUpdate(orderId, { 
                 paymentStatus: 'paid',
                 paymentInfo: req.body 
            });
        }
        res.status(204).send(); // Trả về 204 No Content để MoMo biết đã nhận
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
};