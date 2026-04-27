// File: js/auth.js

// 1. Kéo các công cụ Đăng nhập/Đăng ký từ Firebase
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// 2. Kéo db và auth từ "nhà máy tổng" sang
import { auth, db } from "./firebase.js";

const provider = new GoogleAuthProvider();

// Xử lý trang đăng nhập (login.html)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const btn = loginForm.querySelector('button[type="submit"]');
        
        try {
            btn.innerText = "Đang kiểm tra...";
            btn.disabled = true;

            await signInWithEmailAndPassword(auth, email, password);
            alert('Đăng nhập thành công! Chào mừng trở lại.');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Lỗi đăng nhập: Kiểm tra lại email hoặc mật khẩu nhé!');
            btn.innerText = "Đăng Nhập";
            btn.disabled = false;
        }
    });

    // Đăng nhập bằng Google
    document.getElementById('btnGoogleLogin').onclick = async () => {
        try {
            await signInWithPopup(auth, provider);
            alert('Đăng nhập bằng Google thành công!');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Lỗi đăng nhập Google: ' + error.message);
        }
    };
}

// Xử lý trang đăng ký (signup.html)
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp nha!');
            return;
        }

        const btn = signupForm.querySelector('button[type="submit"]');

        try {
            btn.innerText = "Đang tạo tài khoản...";
            btn.disabled = true;

            // 1. Tạo tài khoản trên Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 2. Cập nhật tên hiển thị
            await updateProfile(userCredential.user, { displayName: name });

            // 3. Lưu xuống Database (cấp quyền 'user')
            await setDoc(doc(db, "tai_khoan", userCredential.user.uid), {
                ho_ten: name,
                email: email,
                quyen_han: "user"
            });

            alert('Đăng ký thành công! Vào sắm hoa thôi nào!');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Lỗi đăng ký: ' + error.message);
            btn.innerText = "Đăng Ký";
            btn.disabled = false;
        }
    });
}