const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');
const UPLOAD_FOLDER = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_FOLDER)){
    fs.mkdirSync(UPLOAD_FOLDER);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.get('/api/products', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.send([]);
        res.send(JSON.parse(data || '[]'));
    });
});

app.post('/api/products', upload.single('kepFile'), (req, res) => {
    const { nev, ar, leiras } = req.body;
    let kepUrl = '';

    if (req.file) {
        kepUrl = '/uploads/' + req.file.filename;
    } else {
        kepUrl = 'img/default.jpg'; 
    }

    const newProduct = {
        id: Date.now(),
        nev,
        ar,
        leiras,
        kepUrl
    };
    
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        let products = data ? JSON.parse(data) : [];
        products.push(newProduct);

        fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.send({ message: 'OK', product: newProduct });
        });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const idToDelete = parseInt(req.params.id);
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');
        let products = JSON.parse(data);

        const productToDelete = products.find(p => p.id === idToDelete);

        if (productToDelete && productToDelete.kepUrl && !productToDelete.kepUrl.includes('default.jpg')) {
            const filename = productToDelete.kepUrl.split('/').pop();
            const filePath = path.join(UPLOAD_FOLDER, filename);
            
            fs.unlink(filePath, (err) => {
                if (err) console.error(err);
            });
        }

        products = products.filter(p => p.id !== idToDelete);
        
        fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), (err) => {
            res.send({ message: 'OK' });
        });
    });
});

app.post('/api/order', async (req, res) => {
    const { nev, email, telefon, cim, megjegyzes, kosar } = req.body;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'leventehorvath0426@gmail.com',
            pass: 'kcdh qgsc fjfj dvbm'
        }
    });

    const tetelLista = kosar.map(item => `<li>${item.nev} - ${item.ar} Ft</li>`).join('');
    const vegosszeg = kosar.reduce((sum, item) => sum + parseInt(item.ar), 0);

    let mailOptions = {
        from: '"Avon Webshop" <leventehorvath0426@gmail.com>',
        to: 'leventehorvath0426@gmail.com',
        subject: `Új rendelés: ${nev}`,
        html: `
            <h2>Új megrendelés</h2>
            <p><strong>Név:</strong> ${nev}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${telefon}</p>
            <p><strong>Cím:</strong> ${cim}</p>
            <p><strong>Megjegyzés:</strong> ${megjegyzes}</p>
            <hr>
            <ul>${tetelLista}</ul>
            <h3>Végösszeg: ${vegosszeg} Ft</h3>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send({ message: 'OK' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});