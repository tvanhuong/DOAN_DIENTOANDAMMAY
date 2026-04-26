// File: js/main.js

// 1. Nhập các công cụ từ thư viện Firebase
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { signOut, onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// 2. Kéo db và auth từ trạm tổng firebase.js sang
import { db, auth } from "./firebase.js";

let currentUserEmail = "";

// ==========================================
// 1. XỬ LÝ ĐĂNG NHẬP & PHÂN QUYỀN
// ==========================================
const btnDangNhap = document.getElementById("btn-dang-nhap");
const btnDangKy = document.getElementById("btn-dang-ky");
const btnDangXuat = document.getElementById("btn-dang-xuat");
const txtChao = document.getElementById("loi-chao");

if(btnDangXuat) btnDangXuat.onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserEmail = user.email;
        if(txtChao) txtChao.innerHTML = `Chào, <b class="text-success">${user.email}</b>`;
        if(btnDangNhap) btnDangNhap.style.display = "none";
        if(btnDangKy) btnDangKy.style.display = "none";
        if(btnDangXuat) btnDangXuat.style.display = "inline-block";

        const menuLogin = document.getElementById("menu-login");
        const menuSignup = document.getElementById("menu-signup");
        const menuLichSu = document.getElementById("menu-lich-su");
        const menuHoSo = document.getElementById("menu-ho-so");
        const tenKhach = document.getElementById("tenKhach");

        if(menuLogin) menuLogin.classList.add("d-none");
        if(menuSignup) menuSignup.classList.add("d-none");
        if(menuLichSu) menuLichSu.classList.remove("d-none");
        if(menuHoSo) menuHoSo.classList.remove("d-none"); // Hiện menu hồ sơ
        if(tenKhach) tenKhach.value = user.email;

        // Kiểm tra quyền Admin
        const docSnap = await getDoc(doc(db, "tai_khoan", user.uid));
        if (docSnap.exists() && docSnap.data().quyen_han === "admin") {
            const menuAdmin = document.getElementById("menu-admin");
            if(menuAdmin) menuAdmin.classList.remove("d-none");
        }
    } else {
        currentUserEmail = "";
        if(txtChao) txtChao.innerHTML = "Khách vãng lai";
        if(btnDangNhap) btnDangNhap.style.display = "inline-block";
        if(btnDangKy) btnDangKy.style.display = "inline-block";
        if(btnDangXuat) btnDangXuat.style.display = "none";
        if(document.getElementById("tenKhach")) document.getElementById("tenKhach").value = "";

        const menuLogin = document.getElementById("menu-login");
        const menuSignup = document.getElementById("menu-signup");
        const menuAdmin = document.getElementById("menu-admin");
        const menuLichSu = document.getElementById("menu-lich-su");
        const menuHoSo = document.getElementById("menu-ho-so");

        if(menuLogin) menuLogin.classList.remove("d-none");
        if(menuSignup) menuSignup.classList.remove("d-none");
        if(menuAdmin) menuAdmin.classList.add("d-none");
        if(menuLichSu) menuLichSu.classList.add("d-none");
        if(menuHoSo) menuHoSo.classList.add("d-none");
    }
});

// ==========================================
// 2. CHUYỂN ĐỔI GIỮA CÁC TRANG (Giao diện)
// ==========================================
const khuVucSanPham = document.getElementById("khu-vuc-san-pham");
const khuVucLichSu = document.getElementById("khu-vuc-lich-su");
const khuVucHoSo = document.getElementById("khu-vuc-ho-so");

function moTrangChu() {
    if(khuVucSanPham) khuVucSanPham.classList.remove("d-none");
    if(document.getElementById("khu-vuc-danh-gia")) document.getElementById("khu-vuc-danh-gia").classList.remove("d-none"); 
    if(khuVucLichSu) khuVucLichSu.classList.add("d-none");
    if (khuVucHoSo) khuVucHoSo.classList.add("d-none");
    
    const sidebarMenu = bootstrap.Offcanvas.getInstance(document.getElementById('sidebar'));
    if (sidebarMenu) sidebarMenu.hide();
}

async function moLichSu() {
    if(khuVucSanPham) khuVucSanPham.classList.add("d-none");
    if(document.getElementById("khu-vuc-danh-gia")) document.getElementById("khu-vuc-danh-gia").classList.add("d-none"); 
    if(khuVucLichSu) khuVucLichSu.classList.remove("d-none");
    if (khuVucHoSo) khuVucHoSo.classList.add("d-none");

    const sidebarMenu = bootstrap.Offcanvas.getInstance(document.getElementById('sidebar'));
    if (sidebarMenu) sidebarMenu.hide();

    const loadingLichSu = document.getElementById("loading-lich-su");
    const bangLichSu = document.getElementById("bang-lich-su");

    if(loadingLichSu) loadingLichSu.classList.remove("d-none");
    if(bangLichSu) bangLichSu.innerHTML = "";

    try {
        const q = query(collection(db, "don_hang"), where("email_khach", "==", currentUserEmail));
        const querySnapshot = await getDocs(q);
        let content = "";

        if (querySnapshot.empty) {
            content = `<tr><td colspan="5" class="text-center text-muted">Bạn chưa đặt chậu hoa nào.</td></tr>`;
        } else {
            querySnapshot.forEach((donHangDoc) => {
                const don = donHangDoc.data();
                content += `
                <tr>
                    <td>${don.ngay_dat}</td>
                    <td class="fw-bold">${don.ten_hoa}</td>
                    <td>${don.so_luong}</td>
                    <td class="text-warning fw-bold">${don.tong_tien.toLocaleString()} đ</td>
                    <td><span class="badge bg-info text-dark">${don.trang_thai}</span></td>
                </tr>
            `;
            });
        }
        if(bangLichSu) bangLichSu.innerHTML = content;
    } catch (error) {
        console.error("Lỗi lấy lịch sử:", error);
    }
    if(loadingLichSu) loadingLichSu.classList.add("d-none");
}

if(document.getElementById("menu-trang-chu")) document.getElementById("menu-trang-chu").onclick = moTrangChu;
if(document.getElementById("btn-logo")) document.getElementById("btn-logo").onclick = (e) => { e.preventDefault(); moTrangChu(); };
if(document.getElementById("btn-xem-lich-su")) document.getElementById("btn-xem-lich-su").onclick = moLichSu;

if(document.getElementById("btn-xem-ho-so")) {
    document.getElementById("btn-xem-ho-so").onclick = () => {
        if(khuVucSanPham) khuVucSanPham.classList.add("d-none");
        if(document.getElementById("khu-vuc-danh-gia")) document.getElementById("khu-vuc-danh-gia").classList.add("d-none");
        if(khuVucLichSu) khuVucLichSu.classList.add("d-none");
        if(khuVucHoSo) khuVucHoSo.classList.remove("d-none");

        const sidebarMenu = bootstrap.Offcanvas.getInstance(document.getElementById('sidebar'));
        if (sidebarMenu) sidebarMenu.hide();
        
        taiThongTinHoSo(); 
    };
}

// Xử lý lấy tọa độ GPS
const btnLayViTri = document.getElementById("btnLayViTri");
if(btnLayViTri) {
    btnLayViTri.onclick = () => {
        if (navigator.geolocation) {
            btnLayViTri.innerText = "Chờ tí...";
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const linkMap = `https://www.google.com/maps?q=${lat},${lng}`;
                document.getElementById("linkViTri").value = linkMap;
                btnLayViTri.innerText = "Xong ✅";
                btnLayViTri.classList.replace("btn-outline-primary", "btn-success");
            }, (error) => {
                alert("Lỗi: Không lấy được vị trí. Bạn hãy bật định vị trên máy và thử lại nhé!");
                btnLayViTri.innerText = "Thử lại 📍";
            });
        } else {
            alert("Trình duyệt này không hỗ trợ lấy vị trí GPS.");
        }
    };
}

// ==========================================
// 3. TẢI DỮ LIỆU TỪ FIRESTORE VÀ HIỂN THỊ
// ==========================================
window.khoHoaToanCuc = [];

async function taiDanhSachHoa() {
    const loadingHoa = document.getElementById("loading-hoa");
    const danhSachHoa = document.getElementById("danh-sach-hoa");
    
    if(!danhSachHoa) return; // Nếu không có khung hiển thị thì bỏ qua

    try {
        if(loadingHoa) loadingHoa.style.display = "block";
        danhSachHoa.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "san_pham"));
        window.khoHoaToanCuc = [];

        querySnapshot.forEach((docItem) => {
            let hoa = docItem.data();
            hoa.id = docItem.id;
            window.khoHoaToanCuc.push(hoa);
        });

        hienThiHoa(window.khoHoaToanCuc);
        if(loadingHoa) loadingHoa.style.display = "none";

    } catch (error) {
        if(loadingHoa) loadingHoa.style.display = "none";
        danhSachHoa.innerHTML = '<div class="col-12 alert alert-danger text-center">Lỗi tải dữ liệu mây!</div>';
    }
}

function hienThiHoa(danhSach) {
    let content = "";
    const danhSachHoa = document.getElementById("danh-sach-hoa");
    if(!danhSachHoa) return;

    if (danhSach.length === 0) {
        content = `<div class="col-12 text-center py-5"><h5 class="text-muted">Không tìm thấy chậu hoa nào phù hợp 😢</h5></div>`;
    } else {
        danhSach.forEach((hoa) => {
            const anhHoa = hoa.hinh_anh || "https://placehold.co/600x400?text=Chua+Co+Anh";
            content += `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                    <img src="${anhHoa}" class="card-img-top" alt="${hoa.ten_hoa}" style="height: 250px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h4 class="card-title text-success fw-bold">${hoa.ten_hoa}</h4>
                        <h5 class="card-subtitle mb-3 text-warning fw-bold">${hoa.gia_ban.toLocaleString()} VNĐ</h5>
                        <p class="card-text text-muted small mb-1"><i class="bi bi-geo-alt-fill"></i> Còn lại: <b>${hoa.so_luong_con}</b> chậu</p>
                        <p class="card-text text-secondary mb-4">${hoa.mo_ta}</p>
                        <button class="btn btn-success mt-auto fw-bold w-100 rounded-pill py-2" onclick="window.moModalDatHang('${hoa.id}', '${hoa.ten_hoa}', ${hoa.gia_ban}, ${hoa.so_luong_con})">
                            🛒 Đặt Mua Ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
        });
    }
    danhSachHoa.innerHTML = content;
}

// Chức năng Tìm Kiếm & Lọc
const oTimKiem = document.getElementById("oTimKiem");
const boLocGia = document.getElementById("boLocGia");

if(oTimKiem && boLocGia) {
    oTimKiem.addEventListener("input", locDuLieu);
    boLocGia.addEventListener("change", locDuLieu);
}

function locDuLieu() {
    const tuKhoa = document.getElementById("oTimKiem").value.toLowerCase();
    const mucGia = document.getElementById("boLocGia").value;

    const danhSachDaLoc = window.khoHoaToanCuc.filter((hoa) => {
        const tenHoa = hoa.ten_hoa.toLowerCase();
        const thoaManTen = tenHoa.includes(tuKhoa);

        let thoaManGia = true;
        if (mucGia === "duoi_50") thoaManGia = hoa.gia_ban < 50000;
        else if (mucGia === "50_den_100") thoaManGia = hoa.gia_ban >= 50000 && hoa.gia_ban <= 100000;
        else if (mucGia === "tren_100") thoaManGia = hoa.gia_ban > 100000;

        return thoaManTen && thoaManGia;
    });
    hienThiHoa(danhSachDaLoc);
}

// ==========================================
// 4. XỬ LÝ ĐẶT HÀNG
// ==========================================
window.moModalDatHang = (idHoa, tenHoa, giaHoa, soLuongTon) => {
    if (!auth.currentUser) {
        alert("Bạn cần Đăng nhập để có thể đặt hoa nhé!");
        window.location.href = "login.html";
        return;
    }
    document.getElementById("idHoaDatMua").value = idHoa;
    document.getElementById("tenHoaDatMua").innerText = tenHoa;
    document.getElementById("giaHoaDatMua").value = giaHoa;
    document.getElementById("soLuongTonKho").value = soLuongTon;

    new bootstrap.Modal(document.getElementById('modalDatHang')).show();
};

const btnChotDon = document.getElementById("btnChotDon");
if(btnChotDon) {
    btnChotDon.addEventListener("click", async () => {
        const tenThat = document.getElementById("tenKhachThat").value;
        localStorage.setItem("ten_vua_mua", tenThat);
        const linkMap = document.getElementById("linkViTri").value;

        const emailTk = document.getElementById("tenKhach").value;
        const sdt = document.getElementById("sdtKhach").value;
        const sl = Number(document.getElementById("soLuongDat").value);
        const diachi = document.getElementById("diaChiKhach").value;

        const idHoa = document.getElementById("idHoaDatMua").value;
        const tenHoa = document.getElementById("tenHoaDatMua").innerText;
        const giaHoa = Number(document.getElementById("giaHoaDatMua").value);
        const soLuongTon = Number(document.getElementById("soLuongTonKho").value);

        if (!tenThat || !sdt || !sl || !diachi) {
            alert("Vui lòng điền đầy đủ Tên người nhận, SĐT và Địa chỉ nhé!");
            return;
        }

        if (sl > soLuongTon) {
            alert(`Kho chỉ còn ${soLuongTon} chậu thôi Mini ơi!`);
            return;
        }

        try {
            btnChotDon.innerText = "Đang xử lý...";
            btnChotDon.disabled = true;
            const tongTien = sl * giaHoa;

            await addDoc(collection(db, "don_hang"), {
                email_khach: emailTk,
                ten_nguoi_nhan: tenThat, 
                link_vi_tri: linkMap,    
                so_dien_thoai: sdt,
                ten_hoa: tenHoa,
                so_luong: sl,
                tong_tien: tongTien,
                dia_chi: diachi,
                trang_thai: "Đang xử lý ⏳",
                ngay_dat: new Date().toLocaleString()
            });

            await updateDoc(doc(db, "san_pham", idHoa), {
                so_luong_con: soLuongTon - sl
            });
            alert("Ting ting! 🎉 Chốt đơn thành công rực rỡ! Tiệm sẽ gọi cho bạn sớm nhé!");
            bootstrap.Modal.getInstance(document.getElementById('modalDatHang')).hide();

            document.getElementById("tenKhachThat").value = "";
            document.getElementById("linkViTri").value = "";
            document.getElementById("btnLayViTri").innerText = "📍 Lấy vị trí";
            document.getElementById("btnLayViTri").classList.replace("btn-success", "btn-outline-primary");

            btnChotDon.innerText = "Chốt Đơn 🚀";
            btnChotDon.disabled = false;
            taiDanhSachHoa();
            moLichSu();

        } catch (error) {
            console.error(error);
            alert("Lỗi rồi: " + error.message);
            btnChotDon.disabled = false;
        }
    });
}

// ==========================================
// 5. ĐÁNH GIÁ CỦA KHÁCH HÀNG
// ==========================================
async function taiDanhGia() {
    const dsDanhGia = document.getElementById("danh-sach-danh-gia");
    if(!dsDanhGia) return;

    try {
        const querySnapshot = await getDocs(collection(db, "danh_gia"));
        let htmlDanhGia = "";

        if (querySnapshot.empty) {
            htmlDanhGia = `<div class="text-center text-muted fst-italic">Chưa có đánh giá nào. Hãy là người đầu tiên nhé!</div>`;
        } else {
            querySnapshot.forEach((docItem) => {
                const dg = docItem.data();
                const ngoiSao = "⭐".repeat(dg.so_sao);
                htmlDanhGia += `
                    <div class="bg-light p-3 rounded-3 mb-3 shadow-sm border-start border-warning border-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong class="text-success">${dg.ten_khach}</strong>
                            <span class="badge bg-white border border-warning text-warning fs-6">${ngoiSao}</span>
                        </div>
                        <p class="mb-1 text-secondary">${dg.noi_dung}</p>
                        <small class="text-muted fst-italic" style="font-size: 0.75rem;">Gửi lúc: ${dg.ngay_tao}</small>
                    </div>
                `;
            });
        }
        dsDanhGia.innerHTML = htmlDanhGia;
    } catch (error) {
        console.error("Lỗi tải đánh giá:", error);
        dsDanhGia.innerHTML = `<div class="text-danger">Lỗi tải dữ liệu.</div>`;
    }
}

function capNhatTenDanhGia() {
    const hienTen = document.getElementById("hienTenTuDong");
    if(!hienTen) return;

    const tenDaLuu = localStorage.getItem("ten_vua_mua");
    if (tenDaLuu) {
        hienTen.innerText = tenDaLuu;
    } else if (currentUserEmail) {
        hienTen.innerText = currentUserEmail.split('@')[0];
    }
}

const btnGuiDanhGia = document.getElementById("btnGuiDanhGia");
if(btnGuiDanhGia) {
    btnGuiDanhGia.addEventListener("click", async () => {
        const ten = localStorage.getItem("ten_vua_mua") || (currentUserEmail ? currentUserEmail.split('@')[0] : "Khách vãng lai");
        const sao = Number(document.getElementById("soSaoDanhGia").value);
        const noidung = document.getElementById("noiDungDanhGia").value;

        if (!noidung) {
            alert("Bạn ơi, nhớ chia sẻ vài lời cảm nhận trước khi gửi nhé!");
            return;
        }

        try {
            btnGuiDanhGia.innerText = "Đang gửi...";
            btnGuiDanhGia.disabled = true;

            await addDoc(collection(db, "danh_gia"), {
                ten_khach: ten,
                so_sao: sao,
                noi_dung: noidung,
                ngay_tao: new Date().toLocaleString()
            });

            alert("Cảm ơn bạn đã để lại góp ý tuyệt vời!");
            document.getElementById("noiDungDanhGia").value = "";
            btnGuiDanhGia.innerText = "Gửi Đánh Giá 🚀";
            btnGuiDanhGia.disabled = false;
            taiDanhGia();

        } catch (error) {
            alert("Lỗi khi gửi đánh giá: " + error.message);
            btnGuiDanhGia.disabled = false;
        }
    });
}

// ==========================================
// 6. QUẢN LÝ HỒ SƠ & ĐỔI MẬT KHẨU
// ==========================================
async function taiThongTinHoSo() {
    const user = auth.currentUser;
    if(!user) return;

    try {
        const docSnap = await getDoc(doc(db, "tai_khoan", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            if(document.getElementById("hsTen")) document.getElementById("hsTen").value = data.ho_ten || "";
            if(document.getElementById("hsSdt")) document.getElementById("hsSdt").value = data.sdt || "";
            if(document.getElementById("hsDiaChi")) document.getElementById("hsDiaChi").value = data.dia_chi || "";
        }
    } catch (error) {
        console.log("Chưa có dữ liệu hồ sơ.");
    }
}

const btnLuuHoSo = document.getElementById("btnLuuHoSo");
if(btnLuuHoSo) {
    btnLuuHoSo.addEventListener("click", async () => {
        const user = auth.currentUser;
        if(!user) return;

        const ten = document.getElementById("hsTen").value;
        const sdt = document.getElementById("hsSdt").value;
        const diachi = document.getElementById("hsDiaChi").value;

        try {
            btnLuuHoSo.innerText = "Đang lưu...";
            await setDoc(doc(db, "tai_khoan", user.uid), {
                ho_ten: ten,
                sdt: sdt,
                dia_chi: diachi
            }, { merge: true });

            if(ten) localStorage.setItem("ten_vua_mua", ten);
            alert("Lưu thông tin thành công!");
            btnLuuHoSo.innerText = "Lưu Thông Tin 💾";
            capNhatTenDanhGia(); 
        } catch (error) {
            alert("Lỗi lưu hồ sơ: " + error.message);
            btnLuuHoSo.innerText = "Lưu Thông Tin 💾";
        }
    });
}

const btnDoiMatKhau = document.getElementById("btnDoiMatKhau");
if(btnDoiMatKhau) {
    btnDoiMatKhau.addEventListener("click", async () => {
        const user = auth.currentUser;
        if(!user) return;

        const mkCu = document.getElementById("mkCu").value;
        const mkMoi = document.getElementById("mkMoi").value;
        const mkMoi2 = document.getElementById("mkMoi2").value;

        if (!mkCu || !mkMoi || !mkMoi2) {
            alert("Vui lòng điền đủ các ô mật khẩu!");
            return;
        }
        if (mkMoi !== mkMoi2) {
            alert("Hai ô mật khẩu mới không khớp nhau!");
            return;
        }
        if (mkMoi.length < 6) {
            alert("Mật khẩu mới phải từ 6 ký tự trở lên nha Mini!");
            return;
        }

        try {
            btnDoiMatKhau.innerText = "Đang kiểm tra...";
            const credential = EmailAuthProvider.credential(user.email, mkCu);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, mkMoi);

            alert("Đổi mật khẩu thành công! Giữ kỹ nha.");
            document.getElementById("mkCu").value = "";
            document.getElementById("mkMoi").value = "";
            document.getElementById("mkMoi2").value = "";
            btnDoiMatKhau.innerText = "Đổi Mật Khẩu 🔐";

        } catch (error) {
            if (error.code === 'auth/invalid-credential') alert("Mật khẩu cũ không đúng! Vui lòng nhớ lại xem.");
            else alert("Lỗi đổi mật khẩu: " + error.message);
            btnDoiMatKhau.innerText = "Đổi Mật Khẩu 🔐";
        }
    });
}

// Khởi chạy khi tải trang
taiDanhGia();
taiDanhSachHoa();
capNhatTenDanhGia();