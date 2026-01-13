# Jobsday — Nền tảng tuyển dụng & README chi tiết

Chào mừng bạn đến với Jobsday — nền tảng tuyển dụng và quản lý việc làm. Đây là README đầy đủ, cấu trúc rõ ràng, được viết theo phong cách giống mẫu "Mini E-Commerce" bạn cung cấp. Tài liệu hướng dẫn chi tiết cho người mới, bao gồm: mô tả, yêu cầu, cấu trúc dự án, cài đặt, chạy local, kiểm thử, triển khai và đóng góp.

Tóm tắt nhanh:

- `jobsday_backend/` — Spring Boot (Java) REST API: controllers, services, repositories, JWT auth, email, WebSocket chat.
- `jobsday_frontend/` — Angular SPA: components, services, guards, interceptors.

---

## 📋 Mục lục

- [Mô tả dự án](#-mô-tả-dự-án)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn chạy Local](#-hướng-dẫn-chạy-local)
- [Test API với Postman / cURL](#-test-api-với-postman--curl)
- [API Documentation (tổng quan)](#-api-documentation)
- [Database Schema](#-database-schema)
- [Triển khai & Docker](#-triển-khai--docker)
- [Quy trình đóng góp](#-quy-trình-đóng-góp)
- [Khắc phục sự cố thường gặp](#-khắc-phục-sự-cố-thường-gặp)
- [Liên hệ](#-liên-hệ)

---

## 🌟 Mô tả dự án

Jobsday là nền tảng tuyển dụng giúp nhà tuyển dụng và ứng viên tương tác hiệu quả. Hệ thống hỗ trợ đăng tin, ứng tuyển, quản lý công ty, trò chuyện realtime, thông báo và phân tích cơ bản.

Tính năng chính:

- Đăng ký, đăng nhập, phân quyền (`CANDIDATE`, `COMPANY`, `ADMIN`).
- Tạo & quản lý công việc, tìm kiếm và lọc.
- Ứng tuyển, theo dõi trạng thái hồ sơ.
- Chat thời gian thực giữa ứng viên và nhà tuyển dụng.
- Thông báo, email tự động (xác nhận, nhắc lịch).
- Báo cáo & thống kê cơ bản về tuyển dụng.

---

## 🔧 Công nghệ sử dụng

### Backend

| Công nghệ | Phiên bản | Mục đích |
|----------|-----------|----------|
| Java | 17+ | Runtime
| Spring Boot | 2.7+/3.x | Framework REST API
| Maven | - | Build & dependency management
| MySQL | 8.x | Database
| JWT | - | Authentication
| Spring Security | - | Auth & Authorization
| WebSocket (STOMP) | - | Realtime chat

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|----------|-----------|----------|
| Angular | 12+ | SPA framework
| TypeScript | 4+ | Language
| RxJS | - | Reactive programming

### DevOps / Tools

| Công nghệ | Mục đích |
|----------|----------|
| Docker | Containerization
| Nginx | Reverse proxy / serving frontend
| GitHub Actions | CI (tuỳ chọn)

---

## 📁 Kiến trúc hệ thống (tổng quan)

Luồng cơ bản:

1. Người dùng truy cập frontend (Angular).
2. Frontend gọi các API của backend (Spring Boot) qua `apiUrl`.
3. Backend xử lý logic, truy vấn MySQL.
4. Chat realtime qua WebSocket kết nối backend.
5. Email/Notification do backend gửi qua SMTP hoặc dịch vụ bên ngoài.

Optional deployment: backend chạy trên VM/EC2 hoặc container; frontend phục vụ lên S3/Nginx.

---

## 🗂️ Cấu trúc dự án

```
Jobsday/
├── jobsday_backend/
│   ├── mvnw, mvnw.cmd
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/... (controllers, services, repositories, models, security)
│           └── resources/
│               ├── application.properties
│               └── env_secrets.properties (local, not committed)
├── jobsday_frontend/
│   ├── angular.json
│   └── src/
│       └── app/
│           ├── components/
│           ├── services/
│           ├── guards/
│           └── models/
├── job_portal_schema_simple.sql
├── Componnent.drawio
└── usecasereal.drawio
```

---

## ✅ Yêu cầu hệ thống

- Java 17+
- Maven (dùng `mvnw` / `mvnw.cmd` có sẵn)
- Node.js 16+ và npm
- Angular CLI (tuỳ chọn)
- MySQL 8+

---

## 🚀 Hướng dẫn chạy Local (chi tiết cho người mới)

Trước khi bắt đầu, đảm bảo bạn đã cài đặt Java, Node.js và MySQL.

### Bước 1 — Clone repository

```bash
git clone <repo-url>
cd Jobsday
```

### Bước 2 — Thiết lập Database

1. Khởi động MySQL.
2. Tạo database `jobsday` và user:

```sql
CREATE DATABASE jobsday CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jobsday_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON jobsday.* TO 'jobsday_user'@'localhost';
FLUSH PRIVILEGES;
```

3. Import schema:

```bash
mysql -u jobsday_user -p jobsday < job_portal_schema_simple.sql
```

### Bước 3 — Cấu hình Backend

```bash
cd jobsday_backend
```

1. Tạo file `src/main/resources/env_secrets.properties` (không commit) theo ví dụ:

```
spring.datasource.url=jdbc:mysql://localhost:3306/jobsday
spring.datasource.username=jobsday_user
spring.datasource.password=yourpassword
jobsday.jwt.secret=your_jwt_secret_here
spring.mail.host=smtp.gmail.com
spring.mail.username=youremail@gmail.com
spring.mail.password=your_email_password
```

2. Build & chạy local:

```bash
./mvnw clean install   # Windows: mvnw.cmd clean install
./mvnw spring-boot:run # Windows: mvnw.cmd spring-boot:run
```

Backend mặc định lắng nghe tại `http://localhost:8080`.

### Bước 4 — Cấu hình & chạy Frontend

```bash
cd ../jobsday_frontend
npm install
npx ng serve --open
```

Frontend mặc định mở tại `http://localhost:4200`.

Lưu ý: nếu frontend không gọi được API do CORS, đảm bảo backend đã bật CORS cho origin `http://localhost:4200` hoặc dùng proxy dev.

---

## 🧪 Test API với Postman / cURL

Bạn có thể tạo Postman collection tương tự mẫu Mini E-Commerce. Dưới đây là các lệnh cURL mẫu:

```bash
# Health check
curl http://localhost:8080/api/health/ping

# Đăng ký
curl -X POST http://localhost:8080/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Test","email":"test@example.com","password":"123456"}'

# Đăng nhập
curl -X POST http://localhost:8080/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"identifier":"test@example.com","password":"123456"}'

# Lấy danh sách công việc
curl http://localhost:8080/api/jobs
```

Nếu bạn muốn, tôi sẽ tạo Postman collection và đính kèm vào repo.

---

## 📡 API Documentation (tổng quan)

Base URL (dev): `http://localhost:8080/api`

Authentication endpoints:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập, trả access token |
| GET | `/auth/profile` | Lấy profile (yêu cầu Bearer token) |

Jobs / Applications:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/jobs` | Lấy danh sách công việc |
| GET | `/jobs/:id` | Chi tiết công việc |
| POST | `/jobs` | Tạo công việc (COMPANY/ADMIN) |
| POST | `/jobs/:id/apply` | Ứng tuyển (CANDIDATE) |

Response format (chuẩn của dự án):

```json
{ "success": true|false, "message": "...", "data": {...} }
```

---

## 🗄️ Database Schema (tổng quan)

Xem `job_portal_schema_simple.sql` trong repo để biết chi tiết bảng và mối quan hệ. Một số bảng chính:

- `users` (id, name, email, password, role,...)
- `companies` (id, name, description,...)
- `jobs` (id, company_id, title, description, skills, status,...)
- `applications` (id, job_id, user_id, status, resume_url,...)

---

## 🐳 Triển khai & Docker (mẫu nhanh)

Bạn có thể chạy toàn bộ stack bằng `docker-compose` (không có file mặc định trong repo). Một ví dụ `docker-compose.yml` gồm MySQL, backend và frontend có thể được thêm nếu bạn muốn — tôi có thể tạo file này cho bạn.

### Build production

Backend:

```bash
cd jobsday_backend
./mvnw clean package
cd target
java -jar jobsday_backend-0.0.1-SNAPSHOT.jar
```

Frontend:

```bash
cd jobsday_frontend
npm run build -- --prod
```

Phục vụ static files với Nginx hoặc S3 + CloudFront cho production.

---

## 🧭 Quy trình đóng góp

1. Fork repository
2. Tạo branch: `feature/your-feature` hoặc `fix/issue-123`
3. Viết code, thêm test
4. Commit & push
5. Tạo Pull Request mô tả thay đổi và cách test

Lưu ý: không commit `env_secrets.properties` hoặc bất kỳ secret nào.

---

## 🔧 Khắc phục sự cố thường gặp

- Backend không khởi động: kiểm tra logs, port 8080 có bị chiếm không, và biến môi trường DB.
- Lỗi kết nối DB: kiểm tra `spring.datasource.url` và quyền user.
- Frontend không gọi được API: kiểm tra `environment.apiUrl`, CORS và proxy.
- Email không gửi được: kiểm tra SMTP credentials và provider (Gmail có thể yêu cầu App Password).

---

## 📞 Liên hệ

- Email: your_email@example.com
- Tạo issue trên GitHub để báo lỗi hoặc yêu cầu tính năng.

---

Muốn tôi tiếp theo tự động thêm mục nào vào `README.md`?

- A) Postman collection & ví dụ cURL đầy đủ
- B) `docker-compose.yml` mẫu để chạy DB + backend + frontend
- C) Hướng dẫn deploy lên Heroku / AWS / Docker Compose
- D) Danh sách API chi tiết (endpoints + request/response ví dụ)

Chọn 1 hoặc nhiều mục (ví dụ: A + B).
---

**Mục lục**
1. Yêu cầu & chuẩn bị
2. Cấu trúc dự án (chi tiết)
3. Thiết lập database và dữ liệu mẫu
4. Cấu hình môi trường (backend & frontend)
5. Chạy hệ thống trên máy local (backend, frontend, chat)
6. Kiểm thử & debug cơ bản
7. Triển khai nhanh (build & production)
8. Hướng dẫn phát triển: thêm endpoint, component, style guide
9. Tài liệu kỹ thuật & sơ đồ
10. Quy trình đóng góp
11. Khắc phục sự cố thường gặp
12. Liên hệ

---

1) Yêu cầu & chuẩn bị

- Hệ điều hành: Windows / macOS / Linux
- Java 17+ (JDK)
- Maven (sử dụng wrapper `mvnw` / `mvnw.cmd` có sẵn)
- Node.js 16+ và npm
- Angular CLI (tuỳ chọn nếu bạn muốn dùng `ng` CLI): `npm i -g @angular/cli`
- MySQL (hoặc MariaDB). Bạn có thể dùng Docker nếu muốn.

Trước khi bắt đầu, tạo một cơ sở dữ liệu trống (ví dụ `jobsday`) và user tương ứng.

Ví dụ MySQL tạo DB (trong MySQL shell hoặc client):

```sql
CREATE DATABASE jobsday CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jobsday_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON jobsday.* TO 'jobsday_user'@'localhost';
FLUSH PRIVILEGES;
```

2) Cấu trúc dự án (chi tiết giúp người mới)

- jobsday_backend/
	- `pom.xml` — Maven config
	- `mvnw`, `mvnw.cmd` — Maven wrapper
	- `src/main/java/com/...` — mã nguồn Java
		- `controller` — lớp xử lý HTTP (REST endpoints)
		- `service` — logic nghiệp vụ
		- `repository` — tương tác DB (Spring Data JPA)
		- `model` / `entity` — các entity JPA
		- `security` — cấu hình JWT, filter, user details
		- `websocket` — cấu hình chat qua STOMP/WebSocket
	- `src/main/resources`:
		- `application.properties` — cấu hình mặc định (không chứa secrets)
		- `env_secrets.properties` — file local chứa mật khẩu, tokens (KHÔNG commit)

- jobsday_frontend/
	- `angular.json`, `package.json` — cấu hình dự án Angular
	- `src/app/` — components, services, guards, interceptors, models
	- `src/environments/` — `environment.ts` và `environment.prod.ts` (thay đổi `apiUrl`)

- Tài liệu & thiết kế: `Componnent.drawio`, `usecasereal.drawio`, `job_portal_schema_simple.sql`

3) Thiết lập database và dữ liệu mẫu

- Import schema: chạy file `job_portal_schema_simple.sql` vào database `jobsday`.
- (Tùy chọn) Thêm dữ liệu mẫu — nếu repo có script seed, chạy; nếu không, bạn có thể tự tạo vài bản ghi (users, companies, jobs) để test.

4) Cấu hình môi trường (chi tiết)

- Backend: mở `src/main/resources/application.properties` để xem các khóa cần thiết, sau đó tạo `src/main/resources/env_secrets.properties` (không commit file này) với nội dung ví dụ:

```
spring.datasource.url=jdbc:mysql://localhost:3306/jobsday
spring.datasource.username=jobsday_user
spring.datasource.password=yourpassword
jobsday.jwt.secret=very_long_random_secret_here
spring.mail.host=smtp.gmail.com
spring.mail.username=youremail@gmail.com
spring.mail.password=your_email_password
```

Giải thích các mục chính:
- `spring.datasource.*`: cấu hình kết nối DB
- `jobsday.jwt.secret`: chuỗi bí mật để ký JWT — giữ an toàn
- `spring.mail.*`: dùng để gửi email (xác nhận, thông báo)

- Frontend: chỉnh `src/environments/environment.ts` (dev) và `src/environments/environment.prod.ts` (prod) để `apiUrl` trỏ đến backend:

```ts
export const environment = {
	production: false,
	apiUrl: 'http://localhost:8080/api'
};
```

5) Chạy hệ thống trên máy local

Step A — Backend (Windows):

```bash
cd jobsday_backend
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

- Sau khi chạy, backend mặc định lắng nghe `http://localhost:8080` (endpoint chính thường bắt đầu với `/api`).

Step B — Frontend:

```bash
cd jobsday_frontend
npm install
npx ng serve --open
```

- Frontend mở tại `http://localhost:4200` và sẽ gọi API theo `environment.apiUrl`.

Step C — Chat (WebSocket)

- Nếu backend hỗ trợ WebSocket/STOMP, frontend sẽ kết nối tới endpoint WebSocket (ví dụ `/ws`). Khi backend đang chạy, mở giao diện chat để kiểm tra realtime.

6) Kiểm thử & debug cơ bản

- Backend tests: nếu repo có test, chạy:

```bash
cd jobsday_backend
mvnw.cmd test
```

- Frontend tests: (Angular)

```bash
cd jobsday_frontend
npm test
```

- Debugging tips:
	- Kiểm tra logs ở console khi chạy `mvnw spring-boot:run`.
	- Nếu kết nối DB lỗi, kiểm tra `spring.datasource.url` và user/password.
	- Kiểm tra CORS: nếu frontend không gọi được API, backend cần cấu hình CORS hoặc proxy dev.

7) Build & triển khai (tóm tắt)

- Build backend Jar:

```bash
cd jobsday_backend
mvnw.cmd clean package
cd target
java -jar jobsday_backend-0.0.1-SNAPSHOT.jar
```

- Build frontend production:

```bash
cd jobsday_frontend
npm run build -- --prod
```

- Phục vụ frontend production bằng Nginx hoặc host static files.

- Gợi ý Docker: bạn có thể tạo `Dockerfile` cho backend và frontend, sau đó dùng `docker-compose` để chạy DB + backend + frontend.

8) Hướng dẫn phát triển (thêm endpoint / component)

- Thêm endpoint Backend (tóm tắt):
	1. Tạo `Entity` nếu cần (trong `model`/`entity`).
	2. Tạo `Repository` (extends `JpaRepository`).
	3. Tạo `Service` xử lý logic.
	4. Tạo `Controller` expose REST API (annotate `@RestController`, `@RequestMapping`).
	5. Thêm unit/integration test nếu có.

- Thêm component Frontend (tóm tắt):
	1. `ng generate component my-component` hoặc tạo thủ công.
	2. Tạo `Service` để gọi API (sử dụng `HttpClient`).
	3. Đăng ký route nếu cần.

9) Tài liệu kỹ thuật & sơ đồ

- Database schema: `job_portal_schema_simple.sql` — import để có cấu trúc bảng.
- Diagrams: `Componnent.drawio` (kiến trúc), `usecasereal.drawio` (use cases).
- Backend helper: xem `jobsday_backend/HELP.md` nếu có hướng dẫn bổ sung.

10) Quy trình đóng góp

1. Fork repository
2. Tạo branch: `feature/xxx` hoặc `fix/issue-123`
3. Viết code, viết test nếu có
4. Commit với nội dung rõ ràng
5. Tạo Pull Request, mô tả mục đích và cách kiểm thử

Lưu ý: không commit file chứa secrets (`env_secrets.properties`).

11) Khắc phục sự cố thường gặp

- Lỗi kết nối DB: kiểm tra URL, user/password, DB đã tồn tại chưa.
- 401/403 khi gọi API: kiểm tra JWT token, clock skew, cấu hình security.
- Frontend không fetch được API: kiểm tra `apiUrl`, CORS, proxy.
- Email không gửi được: kiểm tra `spring.mail.*` và provider (Gmail yêu cầu App Password hoặc OAuth).

12) Liên hệ

- Email liên hệ: dndat1122@example.com
- Mở issue trên Github để báo lỗi hoặc yêu cầu tính năng.

---
