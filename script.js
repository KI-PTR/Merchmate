/*
 * MerchMate
 * Sistem Pre-order Custom
 * Keychain: pilih warna + pilihan desain
 * Pin Button: pilihan desain
 * Desain: Random / Desain Sendiri
 * Google Apps Script + Google Sheets + Cloudinary
 */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwzLUwFmB83ITjUzoBsPlHZbqNj12ifcEX45xgfHxyaxXl8IFEWjYpE8W9tjIdLaNirLw/exec";

const CLOUDINARY_CLOUD_NAME = "otq4xbw2";
const CLOUDINARY_UPLOAD_PRESET = "merchmate_upload";

// ==========================================
// DATA PRODUK
// ==========================================

const products = [
    {
        id: "KYC",
        name: "Keychain Akrilik Custom",
        category: "Keychain",
        price: 16000,
        description: "Keychain akrilik custom sesuai desainmu",
        tag: "PERSONALIZE YOUR STYLE",
        bg: "#e0f5ee",
        image: "image/Keychain.png",
        colors: ["Dotty OrchidSky", "Dotty SkyPink", "Rainbow Soft", "Lemon Gummy"]
    },
    {
        id: "PIN",
        name: "Pin Button Custom",
        category: "Pin",
        price: 5000,
        description: "Pin button custom sesuai desainmu",
        tag: "YOUR STYLE, YOUR PIN",
        bg: "#fff0c9",
        image: "image/Pin.png"
    }
];

// ==========================================
// VARIABEL GLOBAL
// ==========================================

const cart = new Map();
const $ = s => document.querySelector(s);

let filter = "all";
let toastTimer;

let selectedProduct = null;
let selectedColor = null;
let selectedDesignType = "random";
let selectedDesignFile = null;
let selectedDesignData = null;

// ==========================================
// WARNA PRODUK
// ==========================================

const colorHex = {
    "Dotty OrchidSky": "#B77BC1",
    "Dotty SkyPink": "#A7D8F0",
    "Rainbow Soft": "#E8B2C1",
    "Lemon Gummy": "#F3D77B"
};

// ==========================================
// FORMAT HARGA
// ==========================================

function money(n) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(n);
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// ==========================================
// GAMBAR PRODUK
// ==========================================

function svgArt(image, name = "Foto Produk") {
    return `
        <img
            src="${image}"
            alt="${escapeHTML(name)}"
            onerror="this.style.display='none'"
        >
    `;
}

// ==========================================
// RENDER PRODUK
// ==========================================

function renderProducts() {
    const list = products.filter(
        p => filter === "all" || p.category === filter
    );

    $("#productGrid").innerHTML = list.map(p => `
        <article class="product-card">
            <div class="product-image" style="background:${p.bg}">
                <span class="product-tag">${escapeHTML(p.tag)}</span>
                ${svgArt(p.image, p.name)}
            </div>

            <div class="product-info">
                <span class="category">${escapeHTML(p.category)}</span>
                <h3>${escapeHTML(p.name)}</h3>
                <p class="desc">${escapeHTML(p.description)}</p>

                <div class="product-bottom">
                    <span class="price">${money(p.price)}</span>

                    <button
                        class="add"
                        data-add="${p.id}"
                        aria-label="Pesan ${escapeHTML(p.name)}"
                    >+</button>
                </div>
            </div>
        </article>
    `).join("");
}

// ==========================================
// POPUP CUSTOM ORDER
// ==========================================

function createColorModal() {
    if ($("#colorModal")) return;

    const style = document.createElement("style");

    style.textContent = `
        #colorModal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(30,45,55,.45);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            backdrop-filter: blur(4px);
        }

        #colorModal.show {
            display: flex;
        }

        .color-box {
            background: #fff;
            width: 100%;
            max-width: 390px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 22px;
            padding: 25px;
            position: relative;
            box-shadow: 0 15px 50px rgba(0,0,0,.15);
            animation: colorPop .2s ease;
        }

        @keyframes colorPop {
            from {
                opacity: 0;
                transform: translateY(12px) scale(.97);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .color-close {
            position: absolute;
            right: 17px;
            top: 15px;
            border: none;
            background: #f2f5f6;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 17px;
        }

        .color-box h2 {
            font-size: 21px;
            margin: 0 35px 7px 0;
            color: #334b56;
        }

        .color-subtitle {
            color: #82949d;
            font-size: 13px;
            margin-bottom: 20px;
        }

        .color-preview {
            background: #f1f7f8;
            border-radius: 13px;
            padding: 13px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .color-preview img {
            width: 55px;
            height: 55px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .color-preview strong {
            display: block;
            color: #344d59;
            font-size: 14px;
        }

        .color-preview span {
            display: block;
            color: #82949d;
            font-size: 12px;
            margin-top: 4px;
        }

        .color-label {
            font-size: 13px;
            font-weight: 600;
            color: #526b77;
            margin-bottom: 12px;
        }

        .color-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .color-option {
            border: 2px solid #edf0f1;
            border-radius: 12px;
            background: #fff;
            padding: 10px 4px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 7px;
            color: #607681;
            font-size: 11px;
            transition: .2s;
        }

        .color-option:hover {
            border-color: #83b8cc;
        }

        .color-option.selected {
            border-color: #6dabc1;
            background: #f0f8fb;
            color: #477e94;
            font-weight: 700;
        }

        .color-circle {
            width: 29px;
            height: 29px;
            border-radius: 50%;
            border: 1px solid rgba(0,0,0,.08);
            display: block;
        }

        .design-choice {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 18px;
        }

        .design-option {
            border: 2px solid #edf0f1;
            background: #fff;
            border-radius: 13px;
            padding: 13px 9px;
            text-align: center;
            cursor: pointer;
            color: #607681;
            transition: .2s;
        }

        .design-option:hover {
            border-color: #83b8cc;
        }

        .design-option.selected {
            border-color: #6dabc1;
            background: #f0f8fb;
            color: #477e94;
        }

        .design-option .design-icon {
            display: block;
            font-size: 23px;
            margin-bottom: 6px;
        }

        .design-option strong {
            display: block;
            font-size: 13px;
        }

        .design-option small {
            display: block;
            font-size: 10px;
            margin-top: 5px;
            color: #82949d;
            line-height: 1.4;
        }

        .upload-section {
            display: none;
            margin-top: 5px;
        }

        .upload-section.show {
            display: block;
        }

        .design-upload {
            width: 100%;
            padding: 12px;
            border: 1px dashed #9bbdca;
            border-radius: 12px;
            background: #f7fbfc;
            color: #526b77;
            font-size: 12px;
            cursor: pointer;
        }

        .upload-info {
            font-size: 12px;
            color: #82949d;
            margin-top: 8px;
        }

        #designPreview {
            display: none;
            width: 100%;
            max-height: 180px;
            object-fit: contain;
            margin-top: 12px;
            border-radius: 12px;
            background: #f1f7f8;
        }

        .random-info {
            background: #f1f8f5;
            color: #5d8975;
            border-radius: 11px;
            padding: 12px;
            font-size: 12px;
            line-height: 1.5;
            margin-top: 5px;
        }

        .color-confirm {
            width: 100%;
            border: none;
            border-radius: 12px;
            padding: 13px;
            background: #6dabc1;
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: .2s;
            margin-top: 20px;
        }

        .color-confirm:hover {
            background: #5796ad;
        }

        .color-confirm:disabled {
            background: #bdcbd0;
            cursor: not-allowed;
        }

        @media(max-width:400px) {
            .color-box {
                padding: 20px;
            }

            .color-options {
                gap: 7px;
            }
        }
    `;

    document.head.appendChild(style);

    const modal = document.createElement("div");

    modal.id = "colorModal";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
        <div class="color-box">

            <button
                class="color-close"
                id="closeColorModal"
                aria-label="Tutup"
            >&times;</button>

            <h2>Custom Your Product ♡</h2>

            <p class="color-subtitle">
                Pilih warna dan jenis desain produkmu.
            </p>

            <div class="color-preview">
                <div id="colorProductArt"></div>

                <div>
                    <strong id="colorProductName"></strong>
                    <span id="colorProductPrice"></span>
                </div>
            </div>

            <div id="colorSection">
                <div class="color-label">Pilih warna keychain</div>
                <div class="color-options" id="colorOptions"></div>
            </div>

            <div class="color-label">Pilih jenis desain</div>

            <div class="design-choice">
                <button type="button"
                    class="design-option selected"
                    data-design-type="random">
                    <span class="design-icon">🎲</span>
                    <strong>Random</strong>
                    <small>Desain dipilih oleh MerchMate</small>
                </button>

                <button type="button"
                    class="design-option"
                    data-design-type="custom">
                    <span class="design-icon">🎨</span>
                    <strong>Desain Sendiri</strong>
                    <small>Upload gambar desain pilihanmu</small>
                </button>
            </div>

            <div id="randomInfo" class="random-info">
                ♡ Desain akan dipilih secara acak oleh MerchMate.
                Kamu tidak perlu mengunggah gambar.
            </div>

            <div id="uploadSection" class="upload-section">
                <div class="color-label">Upload gambar desain kamu</div>

                <input
                    type="file"
                    id="designUpload"
                    class="design-upload"
                    accept="image/png,image/jpeg,image/webp"
                >

                <p class="upload-info" id="uploadInfo">
                    Format JPG, PNG, atau WEBP. Maksimal 5 MB.
                </p>

                <img id="designPreview" alt="Preview desain">
            </div>

            <button class="color-confirm" id="confirmColor" disabled>
                Tambahkan ke keranjang ♡
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    $("#closeColorModal").addEventListener("click", closeColorPicker);

    modal.addEventListener("click", e => {
        if (e.target === modal) closeColorPicker();
    });

    $("#colorOptions").addEventListener("click", e => {
        const option = e.target.closest("[data-color]");
        if (!option) return;

        selectedColor = option.dataset.color;
        renderColorOptions();
        updateConfirmButton();
    });

    modal.querySelectorAll("[data-design-type]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDesignType = button.dataset.designType;

            selectedDesignFile = null;
            selectedDesignData = null;

            $("#designUpload").value = "";
            $("#designPreview").src = "";
            $("#designPreview").style.display = "none";

            $("#uploadInfo").textContent =
                "Format JPG, PNG, atau WEBP. Maksimal 5 MB.";

            modal.querySelectorAll("[data-design-type]").forEach(option => {
                option.classList.toggle(
                    "selected",
                    option.dataset.designType === selectedDesignType
                );
            });

            $("#uploadSection").classList.toggle(
                "show",
                selectedDesignType === "custom"
            );

            $("#randomInfo").style.display =
                selectedDesignType === "random" ? "block" : "none";

            updateConfirmButton();
        });
    });

    // UPLOAD GAMBAR KE CLOUDINARY

    $("#designUpload").addEventListener("change", async e => {
        const file = e.target.files[0];

        selectedDesignFile = null;
        selectedDesignData = null;

        $("#designPreview").style.display = "none";
        updateConfirmButton();

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            toast("Gunakan format JPG, PNG, atau WEBP.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast("Ukuran gambar maksimal 5 MB.");
            e.target.value = "";
            return;
        }

        try {
            $("#uploadInfo").textContent = "Mengunggah gambar ke Cloudinary...";

            const imageUrl = await uploadDesignImage(file);

            if (selectedDesignType !== "custom") return;

            selectedDesignData = imageUrl;
            selectedDesignFile = file;

            $("#designPreview").src = imageUrl;
            $("#designPreview").style.display = "block";

            $("#uploadInfo").textContent = "Berhasil diunggah: " + file.name;

            updateConfirmButton();

        } catch (error) {
            console.error("Cloudinary upload error:", error);

            toast(error.message || "Gagal mengunggah gambar.");

            $("#uploadInfo").textContent = "Upload gagal. Silakan coba lagi.";

            e.target.value = "";
            selectedDesignFile = null;
            selectedDesignData = null;

            updateConfirmButton();
        }
    });

    // KONFIRMASI PRODUK

    $("#confirmColor").addEventListener("click", () => {
        if (!selectedProduct) return;

        if (selectedProduct.colors && !selectedColor) {
            toast("Pilih warna keychain terlebih dahulu.");
            return;
        }

        let design;

        if (selectedDesignType === "random") {
            design = {
                id: createDesignId(),
                type: "random",
                name: "Desain Random",
                data: null
            };
        } else {
            if (!selectedDesignData || !selectedDesignFile) {
                toast("Upload gambar desain terlebih dahulu.");
                return;
            }

            design = {
                id: createDesignId(),
                type: "custom",
                name: selectedDesignFile.name,
                data: selectedDesignData
            };
        }

        add(selectedProduct.id, selectedColor, design);
        closeColorPicker();
    });
}

// ==========================================
// ID DESAIN
// ==========================================

function createDesignId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random().toString(36).slice(2);
}

// ==========================================
// UPLOAD GAMBAR KE CLOUDINARY
// ==========================================

async function uploadDesignImage(file) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Konfigurasi Cloudinary belum lengkap.");
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Gunakan format JPG, PNG, atau WEBP.");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Ukuran gambar maksimal 5 MB.");
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("Respons Cloudinary tidak dapat dibaca.");
    }

    if (!response.ok || !result.secure_url) {
        throw new Error(
            result?.error?.message || "Gagal mengunggah gambar ke Cloudinary."
        );
    }

    return result.secure_url;
}

// ==========================================
// VALIDASI TOMBOL KONFIRMASI
// ==========================================

function updateConfirmButton() {
    if (!selectedProduct) return;

    const hasColor = selectedProduct.colors
        ? Boolean(selectedColor)
        : true;

    const hasDesign = selectedDesignType === "random"
        ? true
        : Boolean(selectedDesignData && selectedDesignFile);

    $("#confirmColor").disabled = !(hasColor && hasDesign);
}

// ==========================================
// MEMBUKA POPUP CUSTOM
// ==========================================

function openColorPicker(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    selectedProduct = product;
    selectedColor = null;
    selectedDesignType = "random";
    selectedDesignFile = null;
    selectedDesignData = null;

    createColorModal();

    $("#colorProductName").textContent = product.name;
    $("#colorProductPrice").textContent = money(product.price);

    $("#colorProductArt").innerHTML = svgArt(
        product.image,
        product.name
    );

    $("#colorSection").style.display =
        product.colors ? "block" : "none";

    $("#colorOptions").innerHTML = "";

    document.querySelectorAll("[data-design-type]").forEach(option => {
        option.classList.toggle(
            "selected",
            option.dataset.designType === "random"
        );
    });

    $("#uploadSection").classList.remove("show");
    $("#randomInfo").style.display = "block";

    $("#designUpload").value = "";
    $("#designPreview").src = "";
    $("#designPreview").style.display = "none";

    $("#uploadInfo").textContent =
        "Format JPG, PNG, atau WEBP. Maksimal 5 MB.";

    renderColorOptions();
    updateConfirmButton();

    $("#colorModal").classList.add("show");
    $("#colorModal").setAttribute("aria-hidden", "false");

    document.body.classList.add("no-scroll");
}

// ==========================================
// RENDER PILIHAN WARNA
// ==========================================

function renderColorOptions() {
    if (!selectedProduct) return;

    if (!selectedProduct.colors) {
        $("#colorOptions").innerHTML = "";
        return;
    }

    $("#colorOptions").innerHTML =
        selectedProduct.colors.map(color => `
            <button
                type="button"
                class="color-option ${
                    selectedColor === color ? "selected" : ""
                }"
                data-color="${color}"
                aria-pressed="${selectedColor === color}"
            >
                <span
                    class="color-circle"
                    style="background:${colorHex[color] || "#ddd"}"
                ></span>
                ${color}
            </button>
        `).join("");
}

// ==========================================
// TUTUP POPUP
// ==========================================

function closeColorPicker() {
    const modal = $("#colorModal");
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("no-scroll");

    selectedProduct = null;
    selectedColor = null;
    selectedDesignType = "random";
    selectedDesignFile = null;
    selectedDesignData = null;
}

// ==========================================
// NOTIFIKASI TOAST
// ==========================================

function toast(msg) {
    $("#toast").textContent = msg;
    $("#toast").classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => $("#toast").classList.remove("show"),
        2400
    );
}

// ==========================================
// KERANJANG BELANJA
// ==========================================

function getCartKey(id, color, designId) {
    return `${id}::${color || "default"}::${designId}`;
}

function add(id, color = null, design = null) {
    const p = products.find(x => x.id === id);

    if (!p || !design) return;

    if (p.colors && !p.colors.includes(color)) return;

    const key = getCartKey(id, color, design.id);

    const item = cart.get(key) || {
        product: p,
        color: color,
        design: design,
        quantity: 0
    };

    item.quantity++;

    cart.set(key, item);

    renderCart();
    toast(`${p.name} masuk ke keranjang ♡`);
}

// ==========================================
// JUMLAH ITEM
// ==========================================

function count() {
    return [...cart.values()].reduce(
        (s, x) => s + x.quantity,
        0
    );
}

// ==========================================
// TOTAL HARGA
// ==========================================

function total() {
    return [...cart.values()].reduce(
        (s, x) => s + x.product.price * x.quantity,
        0
    );
}

// ==========================================
// RENDER KERANJANG
// ==========================================

function renderCart() {
    const items = [...cart.entries()];

    $("#cartCount").textContent = count();

    $("#cartItems").innerHTML = items.map(([key, item]) => {
        const p = item.product;
        const q = item.quantity;

        return `
            <div class="cart-row">

                <div class="thumb" style="background:${p.bg}">
                    ${svgArt(p.image, p.name)}
                </div>

                <div>
                    <h3>${escapeHTML(p.name)}</h3>

                    <div class="cart-price">
                        ${money(p.price * q)}
                    </div>

                    <div style="font-size:12px;color:#82949d;margin:4px 0">
                        ${item.color ? `
                            Warna: <strong>${escapeHTML(item.color)}</strong>
                        ` : ""}
                    </div>

                    <div style="font-size:12px;color:#82949d;margin:4px 0 8px">
                        Desain:
                        <strong>${escapeHTML(item.design.name)}</strong>
                    </div>

                    <div class="qty">
                        <button
                            data-change="${key}"
                            data-delta="-1"
                            aria-label="Kurangi"
                        >−</button>

                        <span>${q}</span>

                        <button
                            data-change="${key}"
                            data-delta="1"
                            aria-label="Tambah"
                        >+</button>
                    </div>
                </div>

                <button
                    class="remove"
                    data-remove="${key}"
                    aria-label="Hapus"
                >✕</button>

            </div>
        `;
    }).join("");

    $("#cartTotal").textContent = money(total());

    $("#emptyCart").classList.toggle(
        "show",
        items.length === 0
    );

    $("#cartFooter").classList.toggle(
        "hidden",
        items.length === 0
    );

    $("#checkoutItems").textContent = `${count()} item`;
    $("#checkoutTotal").textContent = money(total());
}

// ==========================================
// PANEL KERANJANG
// ==========================================

function openCart() {
    $("#cartDrawer").classList.add("open");
    $("#overlay").classList.add("open");

    $("#cartDrawer").setAttribute("aria-hidden", "false");

    document.body.classList.add("no-scroll");
}

function closeCart() {
    $("#cartDrawer").classList.remove("open");
    $("#overlay").classList.remove("open");

    $("#cartDrawer").setAttribute("aria-hidden", "true");

    document.body.classList.remove("no-scroll");
}

function openCheckout() {
    if (!cart.size) {
        toast("Keranjang masih kosong, yuk pilih produk dulu!");
        return;
    }

    closeCart();

    $("#formError").textContent = "";
    $("#checkoutModal").classList.add("open");

    document.body.classList.add("no-scroll");
}

function closeCheckout() {
    $("#checkoutModal").classList.remove("open");
    document.body.classList.remove("no-scroll");
}

// ==========================================
// EVENT LISTENER PRODUK
// ==========================================

$("#productGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-add]");

    if (b) openColorPicker(b.dataset.add);
});

// ==========================================
// FILTER KATEGORI
// ==========================================

document.querySelectorAll(".filter").forEach(b => {
    b.addEventListener("click", () => {
        filter = b.dataset.filter;

        document.querySelectorAll(".filter").forEach(x => {
            x.classList.toggle("active", x === b);
        });

        renderProducts();
    });
});

// ==========================================
// UBAH JUMLAH / HAPUS KERANJANG
// ==========================================

$("#cartItems").addEventListener("click", e => {
    const change = e.target.closest("[data-change]");
    const remove = e.target.closest("[data-remove]");

    if (remove) {
        cart.delete(remove.dataset.remove);
    }

    if (change) {
        const key = change.dataset.change;
        const item = cart.get(key);

        if (item) {
            item.quantity += Number(change.dataset.delta);

            if (item.quantity <= 0) {
                cart.delete(key);
            }
        }
    }

    renderCart();
});

// ==========================================
// BUKA DAN TUTUP KERANJANG
// ==========================================

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);

// ==========================================
// KEMBALI MEMILIH PRODUK
// ==========================================

$("#browseProducts").addEventListener("click", () => {
    closeCart();

    $("#products").scrollIntoView({
        behavior: "smooth"
    });
});

// ==========================================
// BUKA DAN TUTUP CHECKOUT
// ==========================================

$("#goCheckout").addEventListener("click", openCheckout);
$("#closeCheckout").addEventListener("click", closeCheckout);

$("#checkoutModal").addEventListener("click", e => {
    if (e.target === $("#checkoutModal")) {
        closeCheckout();
    }
});

// ==========================================
// TOMBOL ESCAPE
// ==========================================

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeCart();
        closeCheckout();
        closeReceipt();
        closeColorPicker();
    }
});

// ==========================================
// VALIDASI NOMOR WHATSAPP
// ==========================================

function validPhone(s) {
    return /^[+]?[\d\s().-]{8,20}$/.test(s.trim());
}

// ==========================================
// KIRIM PRE-ORDER
// ==========================================

async function submitOrder(e) {
    e.preventDefault();

    const form = e.currentTarget;

    const name = $("#customerName").value.trim();
    const phone = $("#customerPhone").value.trim();
    const customerClass = $("#customerClass").value.trim();
    const note = $("#customerNote").value.trim();

    const err = $("#formError");

    err.textContent = "";

    if (!name || !phone) {
        err.textContent = "Nama dan nomor WhatsApp wajib diisi.";
        return;
    }

    if (!validPhone(phone)) {
        err.textContent = "Periksa kembali format nomor WhatsApp kamu.";
        return;
    }

    if (!cart.size) {
        closeCheckout();
        toast("Keranjangmu kosong.");
        return;
    }

    const order = {
        orderId: "MM-" + Date.now().toString().slice(-9),

        createdAt: new Date().toISOString(),

        name,
        phone,
        customerClass,
        note,

        items: [...cart.values()].map(item => ({
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,

            color: item.color || "-",

            designType: item.design.type,
            designName: item.design.name,

            // URL Cloudinary, bukan Base64.
            designImage: item.design.type === "custom"
                ? item.design.data
                : null,

            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity
        })),

        total: total(),

        paymentStatus: "Belum dibayar — bayar saat barang tersedia",
        orderStatus: "Pre-order diterima"
    };

    const btn = $("#submitOrder");

    btn.disabled = true;
    btn.textContent = "Mengirim pesanan...";

    try {
        if (!GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/")) {
            throw new Error("URL Apps Script tidak valid.");
        }

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(order)
        });

        closeCheckout();

        cart.clear();
        renderCart();

        form.reset();

        showReceipt(order);

    } catch (error) {
        console.error(error);

        err.textContent =
            "Pesanan gagal dikirim. Periksa koneksi internet dan URL Apps Script.";

    } finally {
        btn.disabled = false;
        btn.textContent = "Kirim pre-order ♡";
    }
}

// ==========================================
// INISIALISASI WEBSITE
// ==========================================

createColorModal();

$("#checkoutForm").addEventListener("submit", submitOrder);

$("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();

// ==========================================
// STRUK PRE-ORDER MERCHMATE
// ==========================================

function createReceiptModal() {
    if ($("#receiptModal")) return;

    const style = document.createElement("style");
    style.id = "receiptStyle";

    style.textContent = `
        #receiptModal {
            position: fixed;
            inset: 0;
            z-index: 10050;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(30, 45, 55, .55);
            backdrop-filter: blur(5px);
            overflow-y: auto;
        }

        #receiptModal.show {
            display: flex;
        }

        .receipt-card {
            width: 100%;
            max-width: 470px;
            max-height: 92vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 18px;
            background: #fff;
            color: #405965;
            box-shadow: 0 18px 55px rgba(0,0,0,.2);
            font-family: inherit;
        }

        .receipt-brand {
            text-align: center;
            padding-bottom: 17px;
            border-bottom: 1px dashed #b8cbd2;
        }

        .receipt-brand img {
            width: 54px;
            height: 54px;
            object-fit: contain;
            margin-bottom: 5px;
        }

        .receipt-brand h2 {
            margin: 0;
            color: #477e94;
            font-size: 23px;
        }

        .receipt-brand p {
            margin: 5px 0 0;
            color: #82949d;
            font-size: 11px;
            letter-spacing: 1.5px;
        }

        .receipt-status {
            margin: 17px 0;
            padding: 12px;
            border-radius: 11px;
            background: #edf8f3;
            color: #438267;
            text-align: center;
            font-size: 13px;
            font-weight: 700;
        }

        .receipt-status small {
            display: block;
            margin-top: 4px;
            font-weight: 400;
        }

        .receipt-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 17px;
            font-size: 12px;
        }

        .receipt-meta span,
        .receipt-customer span {
            display: block;
            margin-bottom: 4px;
            color: #91a2a9;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .5px;
        }

        .receipt-meta strong,
        .receipt-customer strong {
            overflow-wrap: anywhere;
            color: #405965;
        }

        .receipt-customer {
            padding: 13px;
            margin-bottom: 17px;
            border-radius: 11px;
            background: #f4f9fb;
            font-size: 12px;
            line-height: 1.6;
        }

        .receipt-items-title {
            margin: 0 0 10px;
            font-size: 13px;
        }

        .receipt-item {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 0;
            border-bottom: 1px dashed #dce6e9;
            font-size: 12px;
        }

        .receipt-item-info {
            min-width: 0;
        }

        .receipt-item-info strong {
            display: block;
            color: #405965;
        }

        .receipt-item-info small {
            display: block;
            margin-top: 4px;
            color: #82949d;
            line-height: 1.5;
        }

        .receipt-item-price {
            flex-shrink: 0;
            font-weight: 700;
            color: #477e94;
        }

        .receipt-total {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 16px 0;
            margin-top: 3px;
            border-bottom: 1px dashed #b8cbd2;
            font-size: 14px;
            font-weight: 700;
        }

        .receipt-total strong {
            color: #477e94;
            font-size: 18px;
        }

        .receipt-payment {
            margin-top: 15px;
            padding: 12px;
            border-radius: 10px;
            background: #fff8e8;
            color: #8b7443;
            font-size: 11px;
            line-height: 1.6;
        }

        .receipt-footer {
            margin-top: 17px;
            text-align: center;
            color: #91a2a9;
            font-size: 11px;
            line-height: 1.6;
        }

        .receipt-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .receipt-actions button {
            flex: 1;
            border: 0;
            border-radius: 10px;
            padding: 12px;
            cursor: pointer;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
        }

        #printReceipt {
            background: #6dabc1;
            color: white;
        }

        #closeReceipt {
            background: #edf3f5;
            color: #607681;
        }

        @media (max-width: 420px) {
            .receipt-card {
                padding: 19px;
            }
        }

        @media print {
            @page {
                margin: 12mm;
            }

            body * {
                visibility: hidden !important;
            }

            #receiptModal,
            #receiptModal * {
                visibility: visible !important;
            }

            #receiptModal {
                position: absolute !important;
                inset: 0 !important;
                display: block !important;
                padding: 0 !important;
                overflow: visible !important;
                background: white !important;
                backdrop-filter: none !important;
            }

            .receipt-card {
                width: 100% !important;
                max-width: none !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
            }

            .receipt-actions {
                display: none !important;
            }
        }
    `;

    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "receiptModal";

    modal.innerHTML = `
        <div class="receipt-card"
             role="dialog"
             aria-modal="true"
             aria-label="Struk pre-order">

            <div id="receiptContent"></div>

            <div class="receipt-actions">
                <button type="button" id="closeReceipt">
                    Tutup
                </button>

                <button type="button" id="printReceipt">
                    Cetak / Simpan PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    $("#closeReceipt").addEventListener("click", closeReceipt);

    $("#printReceipt").addEventListener("click", () => {
        window.print();
    });

    modal.addEventListener("click", e => {
        if (e.target === modal) closeReceipt();
    });
}

function showReceipt(order) {
    createReceiptModal();

    const orderDate = new Date(order.createdAt);

    const formattedDate = orderDate.toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short"
    });

    const itemRows = order.items.map(item => `
        <div class="receipt-item">
            <div class="receipt-item-info">
                <strong>${escapeHTML(item.name)}</strong>

                <small>
                    ${
                        item.color && item.color !== "-"
                        ? `Warna: ${escapeHTML(item.color)} · `
                        : ""
                    }

                    Desain:
                    ${escapeHTML(
                        item.designType === "custom"
                        ? "Desain Sendiri"
                        : "Random"
                    )}

                    <br>

                    ${item.quantity} × ${money(item.price)}
                </small>
            </div>

            <div class="receipt-item-price">
                ${money(item.subtotal)}
            </div>
        </div>
    `).join("");

    $("#receiptContent").innerHTML = `
        <div class="receipt-brand">
            <img
                src="image/logo.png"
                alt="Logo MerchMate"
                onerror="this.style.display='none'"
            >

            <h2>MerchMate</h2>
            <p>YOUR STYLE, YOUR STORY</p>
        </div>

        <div class="receipt-status">
            ✓ PRE-ORDER BERHASIL DIKIRIM

            <small>
                Terima kasih sudah memesan di MerchMate!
            </small>
        </div>

        <div class="receipt-meta">
            <div>
                <span>ID Pesanan</span>
                <strong>${escapeHTML(order.orderId)}</strong>
            </div>

            <div>
                <span>Tanggal Pesan</span>
                <strong>${escapeHTML(formattedDate)}</strong>
            </div>
        </div>

        <div class="receipt-customer">
            <span>Informasi Pelanggan</span>

            <strong>${escapeHTML(order.name)}</strong>
            <br>

            WhatsApp: ${escapeHTML(order.phone)}
            <br>

            ${
                order.customerClass
                ? `Kelas/Kelompok: ${escapeHTML(order.customerClass)}<br>`
                : ""
            }

            ${
                order.note
                ? `Catatan: ${escapeHTML(order.note)}`
                : ""
            }
        </div>

        <h3 class="receipt-items-title">
            Rincian Pesanan
        </h3>

        ${itemRows}

        <div class="receipt-total">
            <span>Total Pesanan</span>
            <strong>${money(order.total)}</strong>
        </div>

        <div class="receipt-payment">
            <strong>Status Pembayaran: Belum Dibayar</strong>
            <br>

            Pembayaran dilakukan saat barang tersedia
            sesuai konfirmasi dari kelompok MerchMate.
        </div>

        <div class="receipt-footer">
            Simpan struk ini sebagai bukti pemesanan.
            <br>

            Terima kasih telah mendukung MerchMate ♡
        </div>
    `;

    $("#receiptModal").classList.add("show");
    document.body.classList.add("no-scroll");
}

function closeReceipt() {
    const modal = $("#receiptModal");

    if (modal) {
        modal.classList.remove("show");
    }

    document.body.classList.remove("no-scroll");
}