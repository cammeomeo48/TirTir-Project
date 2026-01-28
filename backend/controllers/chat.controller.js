const { spawn } = require('child_process');
const path = require('path');

exports.chatWithBot = (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: "Vui lòng nhập nội dung tin nhắn." });
    }

    // Đường dẫn đến file python
    const scriptPath = path.join(__dirname, '..', 'chatbot', 'chatbot.py');

    // Gọi Python process
    // Lưu ý: Đảm bảo máy chủ đã cài python và lệnh 'python' hoạt động
    const pythonProcess = spawn('python', [scriptPath, message]);

    let dataString = '';

    // Nhận dữ liệu từ Python in ra (stdout)
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // Nhận lỗi (stderr)
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    // Khi Python chạy xong
    pythonProcess.on('close', (code) => {
        try {
            // Parse chuỗi JSON từ Python gửi về
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (error) {
            console.error("Parse Error:", error, "Raw Data:", dataString);
            res.status(500).json({ 
                message: "Lỗi xử lý AI, vui lòng thử lại sau.", 
                debug: dataString 
            });
        }
    });
};