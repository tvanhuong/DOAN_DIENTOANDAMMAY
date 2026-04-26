// File: js/admin.js
// 1. Nhập các công cụ từ Firestore và Auth (KHÔNG có initializeApp nữa)
import { collection, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// 2. Kéo db và auth từ file firebase.js sang (Nhớ có dấu ./)
import { db, auth } from "./firebase.js";

// 3. KIỂM TRA BẢO MẬT ADMIN
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docSnap = await getDoc(doc(db, "tai_khoan", user.uid));
        if (docSnap.exists() && docSnap.data().quyen_han === "admin") {
            document.getElementById("loading-screen").style.display = "none";
            document.getElementById("admin-content").style.display = "flex";
            taiDanhSachHoa();
            taiDanhSachDonHang();
        } else {
            alert("Cảnh báo: Bạn không có quyền truy cập trang Quản Trị!");
            window.location.href = "index.html";
        }
    } else {
        window.location.href = "login.html";
    }
});

window.danhSachHoaKho = {};

// 4. HÀM TẢI DANH SÁCH HOA
async function taiDanhSachHoa() {
    try {
        const querySnapshot = await getDocs(collection(db, "san_pham"));
        let html = "";
        window.danhSachHoaKho = {};

        querySnapshot.forEach((docItem) => {
            const hoa = docItem.data();
            window.danhSachHoaKho[docItem.id] = hoa;

            html += `
                <tr>
                    <td class="fw-bold text-success">${hoa.ten_hoa}</td>
                    <td class="text-warning fw-bold">${hoa.gia_ban.toLocaleString()}</td>
                    <td>${hoa.so_luong_con}</td>
                    <td>${hoa.mo_ta}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning fw-bold me-1 shadow-sm" onclick="window.moModalSuaHoa('${docItem.id}')">Sửa ✏️</button>
                        <button class="btn btn-sm btn-danger fw-bold shadow-sm" onclick="window.xoaHoa('${docItem.id}', '${hoa.ten_hoa}')">Xóa 🗑️</button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("bang-san-pham").innerHTML = html;
    } catch (error) {
        console.log("Lỗi tải hoa:", error);
    }
}

// 5. HÀM TẢI DANH SÁCH ĐƠN HÀNG
async function taiDanhSachDonHang() {
    try {
        const querySnapshot = await getDocs(collection(db, "don_hang"));
        let html = "";
        let tongDon = 0;
        let tongHoa = 0;
        let tongDoanhThu = 0;

        querySnapshot.forEach((docItem) => {
            const don = docItem.data();
            const trangThai = don.trang_thai || "Đang xử lý ⏳";

            tongDon++;
            if (!trangThai.includes("Đang xử lý")) {
                tongHoa += Number(don.so_luong);
                tongDoanhThu += Number(don.tong_tien);
            }

            const linkGps = don.link_vi_tri
                ? `<a href="${don.link_vi_tri}" target="_blank" class="btn btn-sm btn-outline-danger fw-bold mt-1">🗺️ Chỉ đường</a>`
                : `<small class="text-muted d-block mt-1">Không có GPS</small>`;

            let nutThaoTac = "";
            if (trangThai.includes("Đang xử lý")) {
                nutThaoTac = `<button class="btn btn-sm btn-primary fw-bold shadow-sm" onclick="window.xacNhanDon('${docItem.id}')">Xác nhận ✅</button>`;
            } else {
                nutThaoTac = `<span class="badge bg-success px-3 py-2">Đã Chốt</span>`;
            }

            html += `
                <tr>
                    <td>${don.ngay_dat}</td>
                    <td>
                        <b class="text-primary">${don.ten_nguoi_nhan || 'Chưa nhập tên'}</b><br>
                        <small class="text-muted">${don.email_khach}</small>
                    </td>
                    <td class="text-danger fw-bold">${don.so_dien_thoai}</td>
                    <td class="fw-bold text-dark">${don.ten_hoa}</td> 
                    <td class="text-center fw-bold">${don.so_luong}</td> 
                    <td class="text-success fw-bold">${don.tong_tien.toLocaleString()} đ</td>
                    <td>${don.dia_chi}<br>${linkGps}</td>
                    <td class="fw-bold text-info">${trangThai}</td>
                    <td class="text-center">${nutThaoTac}</td>
                </tr>
            `;
        });

        document.getElementById("stat-tong-don").innerText = tongDon;
        document.getElementById("stat-tong-hoa").innerText = tongHoa;
        document.getElementById("stat-tong-tien").innerText = tongDoanhThu.toLocaleString() + " đ";
        document.getElementById("bang-don-hang").innerHTML = html;
    } catch (error) {
        console.log("Lỗi tải đơn hàng:", error);
    }
}

// 6. CÁC HÀM XỬ LÝ SỰ KIỆN (THÊM, SỬA, XÓA, XÁC NHẬN)
const IMGBB_API_KEY = "b1c79b6d22de031f3ac6cf2b0b1c4f8a";

document.getElementById("btnLuuHoa").addEventListener("click", async () => {
    const ten = document.getElementById("tenHoa").value;
    const gia = Number(document.getElementById("giaBan").value);
    const sl = Number(document.getElementById("soLuong").value);
    const mota = document.getElementById("moTa").value;
    const fileInput = document.getElementById("hinhAnh");
    const fileAnh = fileInput.files[0];

    if (!ten || !gia || !sl || !fileAnh) {
        alert("Em nhớ điền đủ thông tin và chọn hình ảnh nhé!");
        return;
    }

    try {
        const btn = document.getElementById("btnLuuHoa");
        const statusText = document.getElementById("uploadStatus");
        btn.disabled = true;
        statusText.style.display = "block";
        statusText.innerHTML = `<div class="spinner-border spinner-border-sm"></div> Đang đẩy ảnh sang ImgBB 🚀...`;

        const formData = new FormData();
        formData.append("image", fileAnh);
        formData.append("key", IMGBB_API_KEY);

        const response = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
        const data = await response.json();

        if (!data.success) throw new Error("ImgBB từ chối nhận ảnh!");

        const linkAnhLuuTrenMay = data.data.display_url;
        statusText.innerHTML = `<div class="spinner-border spinner-border-sm"></div> Đang lưu dữ liệu vào Firebase 📝...`;

        await addDoc(collection(db, "san_pham"), {
            ten_hoa: ten, gia_ban: gia, so_luong_con: sl, mo_ta: mota, hinh_anh: linkAnhLuuTrenMay
        });

        alert("Đã thêm hoa thành công rực rỡ!");

        document.getElementById("tenHoa").value = "";
        document.getElementById("giaBan").value = "";
        document.getElementById("soLuong").value = "";
        document.getElementById("moTa").value = "";
        fileInput.value = "";
        statusText.style.display = "none";
        btn.innerText = "Đẩy Lên Mây ☁️";
        btn.disabled = false;
        bootstrap.Modal.getInstance(document.getElementById('modalThemHoa')).hide();
        taiDanhSachHoa();

    } catch (error) {
        alert("Lỗi tải ảnh: " + error.message);
        document.getElementById("btnLuuHoa").disabled = false;
        document.getElementById("btnLuuHoa").innerText = "Đẩy Lên Mây ☁️";
        document.getElementById("uploadStatus").style.display = "none";
    }
});

window.xoaHoa = async (idDocument, tenHoa) => {
    if (confirm(`Em có chắc chắn muốn xóa "${tenHoa}" khỏi vườn không?`)) {
        try {
            await deleteDoc(doc(db, "san_pham", idDocument));
            alert("Đã xóa thành công!");
            taiDanhSachHoa();
        } catch (error) {
            alert("Lỗi khi xóa: " + error.message);
        }
    }
};

window.xacNhanDon = async (idDocument) => {
    if (confirm("Xác nhận chốt đơn hàng này và chuẩn bị đi giao?")) {
        try {
            await updateDoc(doc(db, "don_hang", idDocument), {
                trang_thai: "Đã xác nhận ✅, đang giao 🚚"
            });
            alert("Chốt đơn thành công! Trạng thái đã được cập nhật cho khách hàng.");
            taiDanhSachDonHang();
        } catch (error) {
            alert("Lỗi khi xác nhận đơn: " + error.message);
        }
    }
};

window.moModalSuaHoa = (idDocument) => {
    const hoa = window.danhSachHoaKho[idDocument];
    document.getElementById("idHoaEdit").value = idDocument;
    document.getElementById("tenHoaEdit").value = hoa.ten_hoa;
    document.getElementById("giaBanEdit").value = hoa.gia_ban;
    document.getElementById("soLuongEdit").value = hoa.so_luong_con;
    document.getElementById("moTaEdit").value = hoa.mo_ta;
    document.getElementById("hinhAnhEdit").value = "";
    new bootstrap.Modal(document.getElementById('modalSuaHoa')).show();
};

document.getElementById("btnLuuSuaHoa").addEventListener("click", async () => {
    const idHoa = document.getElementById("idHoaEdit").value;
    const ten = document.getElementById("tenHoaEdit").value;
    const gia = Number(document.getElementById("giaBanEdit").value);
    const sl = Number(document.getElementById("soLuongEdit").value);
    const mota = document.getElementById("moTaEdit").value;
    const fileInput = document.getElementById("hinhAnhEdit");
    const fileAnh = fileInput.files[0];

    if (!ten || !gia || !sl) {
        alert("Em điền thiếu thông tin rồi!");
        return;
    }

    try {
        const btn = document.getElementById("btnLuuSuaHoa");
        const statusText = document.getElementById("uploadStatusEdit");
        btn.disabled = true;

        let duLieuMoi = { ten_hoa: ten, gia_ban: gia, so_luong_con: sl, mo_ta: mota };

        if (fileAnh) {
            statusText.style.display = "block";
            statusText.innerHTML = `<div class="spinner-border spinner-border-sm"></div> Đang đẩy ảnh mới sang ImgBB 🚀...`;

            const formData = new FormData();
            formData.append("image", fileAnh);
            formData.append("key", IMGBB_API_KEY);

            const response = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
            const data = await response.json();
            if (data.success) {
                duLieuMoi.hinh_anh = data.data.display_url;
            } else {
                throw new Error("Lỗi tải ảnh mới lên ImgBB!");
            }
        }

        statusText.innerHTML = `<div class="spinner-border spinner-border-sm"></div> Đang lưu dữ liệu cập nhật 📝...`;
        await updateDoc(doc(db, "san_pham", idHoa), duLieuMoi);
        alert("Đã cập nhật hoa thành công!");

        statusText.style.display = "none";
        btn.disabled = false;
        bootstrap.Modal.getInstance(document.getElementById('modalSuaHoa')).hide();
        taiDanhSachHoa();

    } catch (error) {
        alert("Lỗi khi sửa: " + error.message);
        document.getElementById("btnLuuSuaHoa").disabled = false;
        document.getElementById("uploadStatusEdit").style.display = "none";
    }
});
// --- LOGIC QUẢN LÝ VỊ TRÍ GIAO HÀNG (TỰ ĐỘNG GOM ĐƠN) ---
let map; 
let layerMarkers = L.layerGroup(); 

document.getElementById("tab-ban-do").addEventListener("shown.bs.tab", async function () {
    if (!map) {
        map = L.map('map-giao-hang').setView([10.3759, 105.4269], 12); 
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap - Tiệm Bông Thọ'
        }).addTo(map);
        layerMarkers.addTo(map);
    }
    
    layerMarkers.clearLayers();
    const dsToaDoHTML = document.getElementById("danh-sach-toa-do");
    dsToaDoHTML.innerHTML = `<div class="text-center p-3"><div class="spinner-border text-success spinner-border-sm"></div> Đang tính toán tuyến đường...</div>`;

    try {
        const querySnapshot = await getDocs(collection(db, "don_hang"));
        let danhSachDonGps = [];
        
        // 1. Thu thập tất cả các đơn hàng có GPS và chưa giao
        querySnapshot.forEach((docItem) => {
            const don = docItem.data();
            if (don.link_vi_tri && !don.trang_thai.includes("Đã giao")) {
                const toaDo = don.link_vi_tri.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                if (toaDo && toaDo.length >= 3) {
                    let lat = parseFloat(toaDo[1]);
                    let lng = parseFloat(toaDo[2]);
                    if (lat >= -90 && lat <= 90) {
                        danhSachDonGps.push({
                            id: docItem.id,
                            ten: don.ten_nguoi_nhan || "Khách hàng",
                            sdt: don.so_dien_thoai,
                            hoa: don.ten_hoa,
                            sl: Number(don.so_luong), // Ép kiểu số
                            dia_chi: don.dia_chi,
                            lat: lat,
                            lng: lng
                        });
                    }
                }
            }
        });

        // 2. THUẬT TOÁN TỰ ĐỘNG GOM CHUYẾN XE (Tối đa 10 chậu/chuyến)
        let cacChuyenXe = [];
        let donChuaPhanBo = [...danhSachDonGps]; // Copy danh sách

        while(donChuaPhanBo.length > 0) {
            // Lấy đơn đầu tiên làm điểm mốc cho chuyến xe mới
            let donMoc = donChuaPhanBo.shift(); 
            let chuyenXeMoi = {
                tenChuyen: `Chuyến ${cacChuyenXe.length + 1}`,
                tongChau: donMoc.sl,
                latTrungTam: donMoc.lat, // Dùng để Focus bản đồ
                lngTrungTam: donMoc.lng,
                danhSachKhach: [donMoc]
            };

            // Sắp xếp các đơn còn lại theo khoảng cách GẦN NHẤT so với đơn mốc
            donChuaPhanBo.sort((a, b) => {
                let diemMoc = L.latLng(donMoc.lat, donMoc.lng);
                return diemMoc.distanceTo(L.latLng(a.lat, a.lng)) - diemMoc.distanceTo(L.latLng(b.lat, b.lng));
            });

            // Lọc các đơn ở gần nhét vào chuyến xe cho đến khi đầy 10 chậu
            let i = 0;
            while (i < donChuaPhanBo.length && chuyenXeMoi.tongChau < 10) {
                if (chuyenXeMoi.tongChau + donChuaPhanBo[i].sl <= 10) {
                    chuyenXeMoi.tongChau += donChuaPhanBo[i].sl;
                    chuyenXeMoi.danhSachKhach.push(donChuaPhanBo[i]);
                    donChuaPhanBo.splice(i, 1); // Rút đơn này ra khỏi danh sách chờ
                } else {
                    i++; // Chậu to quá không nhét vừa chuyến này, bỏ qua xét người tiếp theo
                }
            }
            cacChuyenXe.push(chuyenXeMoi);
        }

        // 3. HIỂN THỊ DANH SÁCH VÀ CHẤM ĐIỂM LÊN BẢN ĐỒ
        let htmlDanhSach = "";
        
        if (cacChuyenXe.length === 0) {
            dsToaDoHTML.innerHTML = `<div class="text-center text-muted p-3 fst-italic">Chưa có đơn hàng nào cần giao.</div>`;
            return;
        }

        // Bảng màu phân biệt các chuyến xe
        const mauChuyenXe = ["#dc3545", "#198754", "#0d6efd", "#ffc107", "#6f42c1", "#fd7e14"];

        cacChuyenXe.forEach((chuyen, index) => {
            let mauHienTai = mauChuyenXe[index % mauChuyenXe.length]; 
            
            // TẠO LINK GOOGLE MAPS CHỈ ĐƯỜNG CHO CHUYẾN XE NÀY
            let linkGoogleMaps = "";
            if (chuyen.danhSachKhach.length === 1) {
                let khach = chuyen.danhSachKhach[0];
                linkGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${khach.lat},${khach.lng}&travelmode=driving`;
            } else {
                let diemCuoi = chuyen.danhSachKhach[chuyen.danhSachKhach.length - 1];
                let cacDiemDung = chuyen.danhSachKhach.slice(0, -1).map(k => `${k.lat},${k.lng}`).join('|');
                linkGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${diemCuoi.lat},${diemCuoi.lng}&waypoints=${cacDiemDung}&travelmode=driving`;
            }

            // Header của chuyến xe (Có thêm nút Mở Google Maps)
            htmlDanhSach += `
                <div class="list-group-item text-white d-flex justify-content-between align-items-center shadow-sm" style="background-color: ${mauHienTai};">
                    <div style="cursor: pointer; flex-grow: 1;" onclick="window.bayDenViTri(${chuyen.latTrungTam}, ${chuyen.lngTrungTam}, 14)">
                        <b class="fs-6">🚚 ${chuyen.tenChuyen}</b>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-dark rounded-pill shadow-sm">Tổng: ${chuyen.tongChau}/10</span>
                        <a href="${linkGoogleMaps}" target="_blank" class="btn btn-sm btn-light fw-bold text-primary shadow-sm" style="padding: 2px 8px; font-size: 0.8rem;">
                            🗺️ Đi ngay
                        </a>
                    </div>
                </div>
            `;

            // Render từng khách trong chuyến (Giữ nguyên như cũ)
            chuyen.danhSachKhach.forEach(khach => {
                const markerHtmlStyles = `
                    background-color: ${mauHienTai};
                    width: 2rem; height: 2rem;
                    display: block; left: -1.5rem; top: -1.5rem;
                    position: relative; border-radius: 3rem 3rem 0;
                    transform: rotate(45deg); border: 2px solid #FFFFFF; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                `;
                const customIcon = L.divIcon({
                    className: "my-custom-pin",
                    iconAnchor: [0, 24],
                    labelAnchor: [-6, 0],
                    popupAnchor: [0, -36],
                    html: `<span style="${markerHtmlStyles}"></span>`
                });

                const marker = L.marker([khach.lat, khach.lng], {icon: customIcon});
                marker.bindPopup(`
                    <div class="leaflet-popup-content-dist">
                        <span class="badge mb-2 text-white" style="background-color: ${mauHienTai}">${chuyen.tenChuyen}</span><br>
                        <b class="text-success">${khach.ten}</b><br>
                        📞 SĐT: <b>${khach.sdt}</b><br>
                        📦 Đơn: <b>${khach.sl} chậu ${khach.hoa}</b><br>
                        🏠 Địa chỉ: ${khach.dia_chi}
                    </div>
                `);
                layerMarkers.addLayer(marker);
                // TẠO LINK GOOGLE MAPS CHO TỪNG KHÁCH LẺ
                let linkCaNhan = `https://www.google.com/maps/dir/?api=1&destination=${khach.lat},${khach.lng}&travelmode=driving`;

                // CẬP NHẬT GIAO DIỆN CỘT BÊN TRÁI: Thêm nút 📍
                // CẬP NHẬT GIAO DIỆN CỘT BÊN TRÁI: Thêm nút 📍 Chỉ đường và ✅ Xác nhận
                htmlDanhSach += `
                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-start border-4" style="border-left-color: ${mauHienTai} !important;">
                        
                        <div class="ms-2" style="cursor: pointer; flex-grow: 1;" onclick="window.bayDenViTri(${khach.lat}, ${khach.lng}, 18)">
                            <h6 class="mb-1 fw-bold">${khach.ten}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">${khach.dia_chi}</small>
                        </div>
                        
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge rounded-pill shadow-sm" style="background-color: ${mauHienTai}">${khach.sl} chậu</span>
                            <a href="${linkCaNhan}" target="_blank" class="btn btn-sm btn-outline-dark shadow-sm" style="padding: 2px 6px;" title="Chỉ đường đến khách này">📍</a>
                            <a href="javascript:void(0)" class="btn btn-sm btn-outline-success shadow-sm" style="padding: 2px 6px;" title="Xác nhận đã giao xong" onclick="window.xacNhanGiaoXong('${khach.id}')">✅</a>
                        </div>
                        
                    </div>
                `;
            });
                
        });

        dsToaDoHTML.innerHTML = htmlDanhSach;
        setTimeout(() => { map.invalidateSize(); }, 300);

    } catch (error) {
        console.error("Lỗi tải bản đồ:", error);
        dsToaDoHTML.innerHTML = `<div class="text-danger p-3">Lỗi tải dữ liệu.</div>`;
    }
});

// HÀM BAY ĐẾN VỊ TRÍ 
window.bayDenViTri = (lat, lng, mucZoom) => {
    if (map) {
        map.flyTo([lat, lng], mucZoom, { animate: true, duration: 1.5 });
    }
};
// HÀM XÁC NHẬN GIAO HÀNG THÀNH CÔNG TỪ BẢN ĐỒ
window.xacNhanGiaoXong = async (idDocument) => {
    if(confirm("Khách đã nhận được hoa và thanh toán đầy đủ rồi đúng không em?")) {
        try {
            // 1. Cập nhật trạng thái trên Firebase
            await updateDoc(doc(db, "don_hang", idDocument), {
                trang_thai: "Đã giao thành công 🎉"
            });
            
            alert("Tuyệt vời! Chốt thêm một đơn giao thành công! 💸");
            
            // 2. Làm mới lại danh sách trên Bản đồ (Xóa khách đã giao khỏi màn hình)
            document.getElementById("tab-ban-do").dispatchEvent(new Event("shown.bs.tab"));
            
            // 3. Làm mới bảng Quản lý đơn hàng tổng (nếu hàm này đang tồn tại)
            if (typeof window.taiDanhSachDonHang === 'function') {
                window.taiDanhSachDonHang();
            }
            
        } catch (error) {
            alert("Lỗi khi cập nhật trạng thái: " + error.message);
        }
    }
};