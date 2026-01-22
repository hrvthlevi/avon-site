let cart = JSON.parse(localStorage.getItem('avon-cart')) || [];

async function loadProducts() {
    const container = document.getElementById('termek-kontener');
    if (!container) return;

    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        container.innerHTML = '';

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image"><img src="${p.kepUrl}" alt="${p.nev}"></div>
                <h3>${p.nev}</h3>
                <p>${p.leiras || ''}</p>
                <div class="product-bottom">
                    <span>${p.ar} Ft</span>
                    <br>
                    <button onclick="addToCart(${p.id}, '${p.nev}', ${p.ar})">Kosárba</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
    }
}

window.addToCart = (id, nev, ar) => {
    cart.push({ id, nev, ar });
    updateCartStorage();
    alert('Bekerült a kosárba!');
};

function updateCartStorage() {
    localStorage.setItem('avon-cart', JSON.stringify(cart));
}

function renderCartPage() {
    const tbody = document.getElementById('cart-items-body');
    const totalSpan = document.getElementById('cart-total');
    if (!tbody) return;

    tbody.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Üres a kosár</td></tr>';
        totalSpan.innerText = '0';
        return;
    }

    cart.forEach((item, index) => {
        total += parseInt(item.ar);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nev}</td>
            <td>${item.ar} Ft</td>
            <td><button onclick="removeFromCart(${index})" style="color:red;border:none;background:none;cursor:pointer;">X</button></td>
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
        alert('Rendelés elküldve!');
        cart = [];
        updateCartStorage();
        window.location.href = 'index.html';
    } else {
        alert('Hiba történt.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    renderCartPage();
    const orderForm = document.getElementById('orderForm');
    if(orderForm) orderForm.addEventListener('submit', submitOrder);
});
