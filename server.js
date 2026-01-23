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
    const { nev, ar, akciosAr, leiras } = req.body;
    let kepUrl = '';

    if (req.file) {
        kepUrl = '/uploads/' + req.file.filename;
    } else {
        kepUrl = 'img/default.jpg'; 
    }

    const newProduct = {
        id: Date.now(),
        nev,
        ar: parseInt(ar),
        akciosAr: akciosAr ? parseInt(akciosAr) : null,
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

app.put('/api/products/:id', upload.single('kepFile'), (req, res) => {
    const idToUpdate = parseInt(req.params.id);
    const { nev, ar, akciosAr, leiras } = req.body;

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');
        let products = JSON.parse(data);

        const productIndex = products.findIndex(p => p.id === idToUpdate);
        if (productIndex === -1) return res.status(404).send('Not Found');

        const oldProduct = products[productIndex];
        let newKepUrl = oldProduct.kepUrl;

        if (req.file) {
            newKepUrl = '/uploads/' + req.file.filename;
            if (oldProduct.kepUrl && !oldProduct.kepUrl.includes('default.jpg')) {
                const oldPath = path.join(__dirname, oldProduct.kepUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlink(oldPath, (err) => { if(err) console.error(err); });
                }
            }
        }

        products[productIndex] = {
            ...oldProduct,
            nev,
            ar: parseInt(ar),
            akciosAr: akciosAr ? parseInt(akciosAr) : null,
            leiras,
            kepUrl: newKepUrl
        };

        fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.send({ message: 'OK', product: products[productIndex] });
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
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => { if (err) console.error(err); });
            }
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

    const tetelLista = kosar.map(item => {
        let ar = (item.akciosAr && item.akciosAr < item.ar) ? item.akciosAr : item.ar;
        return `<li>${item.nev} - ${ar} Ft</li>`;
    }).join('');

    const vegosszeg = kosar.reduce((sum, item) => {
        let ar = (item.akciosAr && item.akciosAr < item.ar) ? item.akciosAr : item.ar;
        return sum + parseInt(ar);
    }, 0);

    let mailToAdmin = {
        from: '"Beauty by Angéla" <leventehorvath0426@gmail.com>',
        to: 'leventehorvath0426@gmail.com',
        subject: `Új rendelés érkezett: ${nev}`,
        html: `
            <h2>Új megrendelés érkezett!</h2>
            <h3>Vásárló adatai:</h3>
            <p><strong>Név:</strong> ${nev}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${telefon}</p>
            <p><strong>Cím:</strong> ${cim}</p>
            <p><strong>Megjegyzés:</strong> ${megjegyzes}</p>
            <hr>
            <h3>Rendelés tartalma:</h3>
            <ul>${tetelLista}</ul>
            <h3>Végösszeg: ${vegosszeg} Ft</h3>
        `
    };

    let mailToCustomer = {
        from: '"Beauty by Angéla" <leventehorvath0426@gmail.com>',
        to: email,
        subject: `Rendelés visszaigazolása - Beauty by Angéla`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d63384;">Kedves ${nev}!</h2>
                <p>Köszönjük a rendelésedet! Sikeresen rögzítettük rendszerünkben.</p>
                <p>Hamarosan felveszem veled a kapcsolatot a megadott elérhetőségeken a szállítás/átvétel egyeztetése miatt.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Rendelésed összesítője:</h3>
                    <ul>${tetelLista}</ul>
                    <p><strong>Fizetendő végösszeg: ${vegosszeg} Ft</strong></p>
                </div>

                <p>Üdvözlettel,<br>
                <strong>Noszály Angéla</strong><br>
                Beauty by Angéla</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailToAdmin);
        await transporter.sendMail(mailToCustomer);
        res.send({ message: 'OK' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
