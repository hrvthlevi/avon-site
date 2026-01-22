const API_URL = '/api/products';

const form = document.getElementById('addProductForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nev', document.getElementById('nev').value);
        formData.append('ar', document.getElementById('ar').value);
        formData.append('leiras', document.getElementById('leiras').value);
        formData.append('kepFile', document.getElementById('kepFile').files[0]);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Siker!');
            form.reset();
            loadAdminList();
        } else {
            alert('Hiba!');
        }
    });
}

async function loadAdminList() {
    const listContainer = document.getElementById('adminProductList');
    if (!listContainer) return;

    const response = await fetch(API_URL);
    const products = await response.json();

    listContainer.innerHTML = '';

    products.forEach(p => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #eee';
        div.style.padding = '10px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${p.kepUrl}" style="width:50px;height:50px;object-fit:cover;margin-right:10px;">
                <div><strong>${p.nev}</strong><br>${p.ar} Ft</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Törlés</button>
        `;
        listContainer.appendChild(div);
    });
}

window.deleteProduct = async (id) => {
    if (!confirm('Biztos?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadAdminList();
};

loadAdminList();
