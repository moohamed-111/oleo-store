const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد تخزين مؤقت للصور المرفوعة (إيصال التحويل)
const upload = multer({ storage: multer.memoryStorage() });

let orders = [];

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'm.alsdhani@gmail.com',
        pass: 'wksjpmcykhokqkqj'
    }
});

// إظهار صفحة المتجر عند فتح الرابط الرئيسي
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/api/orders', upload.single('receipt'), async (req, res) => {
    try {
        const { customerName, phone, address, quantity, notes, paymentMethod } = req.body;
        const receiptFile = req.file;

        const newOrder = {
            id: orders.length + 1,
            customerName,
            phone,
            address,
            quantity,
            notes: notes || 'لا توجد ملاحظات',
            paymentMethod: paymentMethod === 'bank' ? 'تحويل بنكي' : 'دفع عند الاستلام',
            createdAt: new Date()
        };
        orders.push(newOrder);

        console.log("📦 طلب جديد وصل:", newOrder);

        let mailHtml = `
            <h2>🚨 طلب جديد في متجر Oleo</h2>
            <p><strong>اسم العميل:</strong> ${customerName}</p>
            <p><strong>رقم الجوال:</strong> ${phone}</p>
            <p><strong>العنوان:</strong> ${address}</p>
            <p><strong>الكمية:</strong> ${quantity} علب</p>
            <p><strong>الإجمالي:</strong> ${quantity * 20} ر.س</p>
            <p><strong>ملاحظات العميل:</strong> ${newOrder.notes}</p>
            <p><strong>طريقة الدفع:</strong> ${newOrder.paymentMethod}</p>
        `;

        const mailOptions = {
            from: 'm.alsdhani@gmail.com',
            to: 'm.alsdhani@gmail.com',
            subject: `🚨 طلب جديد: ${customerName} (${newOrder.paymentMethod})`,
            html: mailHtml
        };

        if (receiptFile) {
            mailOptions.attachments = [
                {
                    filename: receiptFile.originalname || 'receipt.jpg',
                    content: receiptFile.buffer
                }
            ];
        }

        await transporter.sendMail(mailOptions);
        console.log('📧 تم إرسال التنبيه والإيصال إلى بريدك بنجاح!');

        res.status(201).json({ message: "تم إرسال الطلب بنجاح!", order: newOrder });
    } catch (error) {
        console.error('❌ خطأ أثناء المعالجة:', error);
        res.status(500).json({ message: "حدث خطأ في النظام" });
    }
});

app.get('/api/orders', (req, res) => {
    res.json(orders);
});

app.listen(PORT, () => {
    console.log(`السيرفر شغال بنجاح على الرابط: http://localhost:${PORT}`);
});