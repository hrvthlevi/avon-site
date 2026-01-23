const API_URL = '/api/products';

const form = document.getElementById('addProductForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nev', document.getElementById('nev').value);
        formData.append('ar', document.getElementById('ar').value);
        formData.append('akciosAr', document.getElementById('akciosAr').value);
        formData.append('leiras', document.getElementById('leiras').value);
        formData.append('kepFile', document.getElementById('kepFile').files[0]);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Termék feltöltve!');
            form.reset();
            loadAdminList();
        } else {
            alert('Hiba történt.');
        }
    });
}

async function loadAdminList() {
    const listContainer = document.getElementById('adminProductList');
    if (!listContainer) return;

    const response = await fetch(API_URL);
    const products = await response.json();

    listContainer.innerHTML = '';
    products.sort((a, b) => b.id - a.id);

    products.forEach(p => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #eee';
        div.style.padding = '10px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        let arKijelzes = `${p.ar} Ft`;
        if(p.akciosAr && p.akciosAr < p.ar) {
            arKijelzes = `<s style="color:red; margin-right:5px;">${p.ar} Ft</s> <b>${p.akciosAr} Ft</b>`;
        }

        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${p.kepUrl}" style="width:50px;height:50px;object-fit:cover;margin-right:10px;border-radius:4px;">
                <div>
                    <strong>${p.nev}</strong><br>
                    ${arKijelzes}
                </div>
            </div>
            <div>
                <button class="btn btn-warning btn-sm me-2" 
                    onclick="openEditModal('${p.id}', '${p.nev}', '${p.ar}', '${p.akciosAr || ''}', '${p.leiras || ''}')">
                    Szerk.
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Törlés</button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

window.deleteProduct = async (id) => {
    if (!confirm('Biztosan törlöd?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadAdminList();
};

window.openEditModal = (id, nev, ar, akciosAr, leiras) => {
    document.getElementById('editId').value = id;
    document.getElementById('editNev').value = nev;
    document.getElementById('editAr').value = ar;
    document.getElementById('editAkciosAr').value = akciosAr === 'undefined' || akciosAr === 'null' ? '' : akciosAr;
    document.getElementById('editLeiras').value = leiras === 'undefined' ? '' : leiras;

    const modalElement = document.getElementById('editModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
};

const editForm = document.getElementById('editProductForm');
if(editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const formData = new FormData();
        formData.append('nev', document.getElementById('editNev').value);
        formData.append('ar', document.getElementById('editAr').value);
        formData.append('akciosAr', document.getElementById('editAkciosAr').value);
        formData.append('leiras', document.getElementById('editLeiras').value);
        
        const fileInput = document.getElementById('editKepFile');
        if (fileInput.files[0]) {
            formData.append('kepFile', fileInput.files[0]);
        }

        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (res.ok) {
            alert('Sikeres módosítás!');
            location.reload();
        } else {
            alert('Hiba történt!');
        }
    });
}

loadAdminList();
