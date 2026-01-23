let cart = JSON.parse(localStorage.getItem('avon-cart')) || [];
let globalProducts = [];

window.showCartModal = () => {
    document.getElementById('cartConfirmModal').style.display = 'block';
};

window.closeCartModal = () => {
    document.getElementById('cartConfirmModal').style.display = 'none';
};

window.openModal = (id) => {
    const p = globalProducts.find(product => product.id === id);
    if (!p) return;

    const modal = document.getElementById('productModal');
    const img = document.getElementById('modalImg');
    const name = document.getElementById('modalName');
    const desc = document.getElementById('modalDesc');
    const priceBox = document.getElementById('modalPrice');
    const btnContainer = document.getElementById('modalBtnContainer');

    img.src = p.kepUrl;
    name.innerText = p.nev;
    
    desc.innerHTML = (p.leiras || 'Nincs leírás.').replace(/\n/g, '<br>');

    let veglegesAr = p.ar;
    if (p.akciosAr && p.akciosAr < p.ar) {
        veglegesAr = p.akciosAr;
        priceBox.innerHTML = `
            <s style="color:#999; font-size:0.8em;">${p.ar} Ft</s>
            <b style="color:#d63384; margin-left:10px;">${p.akciosAr} Ft</b>
        `;
    } else {
        priceBox.innerHTML = `<b>${p.ar} Ft</b>`;
    }

    btnContainer.innerHTML = `
        <button onclick="addToCart(${p.id}, '${p.nev}', ${veglegesAr}, '${p.kepUrl}')" 
                style="background:#d63384; color:white; border:none; padding:10px 20px; border-radius:20px; font-weight:bold; cursor:pointer; width:100%;">
            Kosárba rakom
        </button>
    `;

    modal.style.display = 'block';
};

function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = cart.length;
    }
}

function renderCards(products, container) {
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `<p style="width: 100%; text-align:center;">Jelenleg nincs feltöltött termék.</p>`;
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let arHtml = '';
        if (p.akciosAr && p.akciosAr < p.ar) {
            arHtml = `<s style="color:#999; font-size:0.9em;">${p.ar}</s> <b style="color:#d63384;">${p.akciosAr} Ft</b>`;
        } else {
            arHtml = `<b>${p.ar} Ft</b>`;
        }

        const maxKarakter = 60; 
        const leirasText = p.leiras || '';
        let leirasHTML = leirasText;

        if (leirasText.length > maxKarakter) {
            leirasHTML = `
                ${leirasText}
                <br>
                <span onclick="openModal(${p.id})" class="more-link">Több</span>
            `;
        }

        card.innerHTML = `
            <div class="product-image" onclick="openModal(${p.id})">
                <img src="${p.kepUrl}" alt="${p.nev}">
            </div>
            
            <h3 onclick="openModal(${p.id})">${p.nev}</h3>
            
            <p>${leirasHTML}</p>
            
            <div class="product-bottom">
                <div>${arHtml}</div>
                <button onclick="addToCart(${p.id}, '${p.nev}', ${p.akciosAr || p.ar}, '${p.kepUrl}')">Kosárba</button>
            </div> 
        `;
        container.appendChild(card);
    });
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        let products = await response.json();
        globalProducts = products;
        products.sort((a, b) => b.id - a.id);

        const homeContainer = document.getElementById('kiemelt-termekek');
        if (homeContainer) {
            const latestProducts = products.slice(0, 3);
            renderCards(latestProducts, homeContainer);
        }

        const allContainer = document.getElementById('termek-kontener');
        if (allContainer) {
            renderCards(products, allContainer);
        }
    } catch(err){
        console.error(err);
    }
}

window.addToCart = (id, nev, ar, kepUrl) => {
    if (!kepUrl) kepUrl = 'img/default.jpg';
    
    cart.push({ id, nev, ar, kepUrl });
    updateCartStorage();
    
    const productModal = document.getElementById('productModal');
    if (productModal) productModal.style.display = 'none';
    
    showCartModal();
};

function updateCartStorage() {
    localStorage.setItem('avon-cart', JSON.stringify(cart));
    updateCartCount();
}

function renderCartPage() {
    const tbody = document.getElementById('cart-items-body');
    const totalSpan = document.getElementById('cart-total');
    if (!tbody) return;

    tbody.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">Az ön kosara jelenleg üres.</td></tr>';
        totalSpan.innerText = '0';
        return;
    }

    cart.forEach((item, index) => {
        total += parseInt(item.ar);
        const tr = document.createElement('tr');
        
        const imgSrc = item.kepUrl || 'img/default.jpg';
        
        tr.innerHTML = `
            <td style="width: 80px; text-align: center;">
                <img src="${imgSrc}" class="cart-item-img" alt="${item.nev}">
            </td>
            <td>
                <div style="font-weight:600; font-size: 1.05em;">${item.nev}</div>
            </td>
            <td style="white-space: nowrap; font-weight: 500; color: #d63384;">${item.ar} Ft</td>
            <td style="text-align: right;">
                <button onclick="removeFromCart(${index})" class="delete-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-27.3 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    totalSpan.innerText = total;
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartStorage();
    renderCartPage();
};

async function submitOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return alert('Üres a kosár');

    const orderData = {
        nev: document.getElementById('nev').value,
        email: document.getElementById('email').value,
        telefon: document.getElementById('telefon').value,
        cim: document.getElementById('cim').value,
        megjegyzes: document.getElementById('megjegyzes').value,
        kosar: cart
    };

    const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });

    if (res.ok) {
        cart = [];
        updateCartStorage();
        window.location.href = 'index.html';
    } else {
        alert('Hiba történt.');
    }
}

const logo = document.querySelector('.logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadProducts();
    renderCartPage();
    const orderForm = document.getElementById('orderForm');
    if(orderForm) orderForm.addEventListener('submit', submitOrder);

    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.product-modal').forEach(modal => {
                modal.style.display = "none";
            });
        };
    });
    
    window.onclick = (event) => {
        if (event.target.classList.contains('product-modal')) {
            event.target.style.display = "none";
        }
    };
});

