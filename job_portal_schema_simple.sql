CREATE SCHEMA IF NOT EXISTS job_portal;
SET search_path TO job_portal, public;

-- ENUM TYPES
CREATE TYPE user_role_enum AS ENUM ('CANDIDATE', 'HR', 'ADMIN');
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE company_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE member_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');
CREATE TYPE application_status_enum AS ENUM ('APPLIED','VIEWED','SUITABLE','UNSUITABLE');
CREATE TYPE job_status_enum AS ENUM ('ACTIVE','HIDDEN','CLOSED');
CREATE TYPE job_type_enum AS ENUM ('FULL_TIME','PART_TIME','INTERNSHIP','REMOTE');
CREATE TYPE notification_type_enum AS ENUM ('APPLICATION_STATUS','NEW_MESSAGE','SYSTEM_ALERT');

-- USERS
CREATE TABLE users (
    id              		BIGSERIAL PRIMARY KEY,
    email           		TEXT NOT NULL UNIQUE,
    password_hash  			TEXT NOT NULL,
    full_name       		TEXT NOT NULL,
    phone           		TEXT,
    dob             		DATE,
    avatar_url      		TEXT,
    role            		user_role_enum NOT NULL,
    status          		user_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at      		TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      		TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
	email_verified  		BOOLEAN NOT NULL DEFAULT FALSE,
	verification_code 		TEXT,
	verification_expiry 	TIMESTAMP 
);

-- COMPANIES
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    address         TEXT,
    tax_code        TEXT,
    website         TEXT,
    description     TEXT,
    status          company_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- COMPANY MEMBERS
CREATE TABLE company_members (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    status          member_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

-- CVS
CREATE TABLE cvs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    file_url        TEXT NOT NULL,
	skills			TEXT[],
	rank			TEXT[],
	key_word		TEXT[],
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- JOBS
CREATE TABLE jobs (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    location        TEXT,
    type            job_type_enum,
    status          job_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_url          TEXT NOT NULL,
    cover_letter    TEXT,
    status          application_status_enum NOT NULL DEFAULT 'APPLIED',
    applied_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, candidate_id)
);

-- CONVERSATIONS
CREATE TABLE conversations (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, candidate_id)
);

-- MESSAGES
CREATE TABLE messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type_enum NOT NULL,
    content         TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 1. USERS
INSERT INTO users (email, password_hash, full_name, phone, dob, avatar_url, role, status)
VALUES
('nguyenvana@example.com', 'hashedpass123', 'Nguyễn Văn A', '0901234567', '1995-05-10', 'https://randomuser.me/api/portraits/men/32.jpg', 'CANDIDATE', 'ACTIVE'),
('tranthib@example.com', 'hashedpass456', 'Trần Thị B', '0912345678', '1998-09-20', 'https://randomuser.me/api/portraits/women/45.jpg', 'CANDIDATE', 'ACTIVE'),
('hr1@techcorp.vn', 'hashedpass789', 'Phạm Quốc C', '0907654321', '1990-03-15', 'https://randomuser.me/api/portraits/men/56.jpg', 'HR', 'ACTIVE'),
('hr2@techcorp.vn', 'hashedpass101', 'Lê Thị D', '0934567890', '1992-12-01', 'https://randomuser.me/api/portraits/women/23.jpg', 'HR', 'ACTIVE'),
('admin@jobportal.vn', 'hashedpass202', 'Admin System', NULL, NULL, NULL, 'ADMIN', 'ACTIVE');

-- 2. COMPANIES
INSERT INTO companies (name, address, tax_code, website, description, status)
VALUES
('TechCorp Việt Nam', 'Tầng 10, Tòa nhà ABC, Quận 1, TP.HCM', '0312345678', 'https://techcorp.vn', 'Công ty phần mềm chuyên về giải pháp AI và Cloud', 'APPROVED'),
('GreenFoods', 'Số 25, Đường XYZ, Quận Thanh Xuân, Hà Nội', '0108765432', 'https://greenfoods.vn', 'Công ty thực phẩm sạch và hữu cơ hàng đầu Việt Nam', 'PENDING');

-- 3. COMPANY MEMBERS
INSERT INTO company_members (company_id, user_id, is_admin, status)
VALUES
(1, 3, TRUE, 'APPROVED'),   -- HR1 là admin công ty TechCorp
(1, 4, FALSE, 'APPROVED');  -- HR2 là thành viên công ty TechCorp

-- 4. CVS (hồ sơ ứng viên)
INSERT INTO cvs (user_id, title, file_url, skills, rank, key_word, is_public)
VALUES
(1, 'CV Nguyễn Văn A - Java Developer', 'https://cdn.jobportal.vn/cv/nguyenvana_java.pdf', ARRAY['Java', 'Spring Boot', 'PostgreSQL'], ARRAY['Middle'], ARRAY['backend', 'java', 'spring'], TRUE),
(2, 'CV Trần Thị B - Digital Marketer', 'https://cdn.jobportal.vn/cv/tranthib_marketing.pdf', ARRAY['SEO', 'Google Ads', 'Content Marketing'], ARRAY['Senior'], ARRAY['marketing', 'seo', 'ads'], TRUE);

-- 5. JOBS
INSERT INTO jobs (company_id, title, description, location, type, status)
VALUES
(1, 'Java Backend Developer', 'Phát triển API backend sử dụng Spring Boot, PostgreSQL.', 'TP.HCM', 'FULL_TIME', 'ACTIVE'),
(1, 'Frontend Developer (ReactJS)', 'Xây dựng giao diện web hiện đại bằng ReactJS, Tailwind CSS.', 'TP.HCM', 'FULL_TIME', 'ACTIVE');

-- 6. APPLICATIONS
INSERT INTO applications (job_id, candidate_id, cv_url, cover_letter, status)
VALUES
(1, 1, 'https://cdn.jobportal.vn/applications/2025/nguyenvana_java_backend.pdf', 'Tôi mong muốn được làm việc tại TechCorp và phát triển kỹ năng backend.', 'APPLIED'),
(2, 2, 'https://cdn.jobportal.vn/applications/2025/tranthib_frontend.pdf', 'Kinh nghiệm marketing và hiểu biết về UI/UX sẽ giúp tôi đóng góp cho sản phẩm.', 'VIEWED');

-- 7. CONVERSATIONS
INSERT INTO conversations (company_id, candidate_id)
VALUES
(1, 1),
(1, 2);

-- 8. MESSAGES
INSERT INTO messages (conversation_id, sender_id, content)
VALUES
(1, 3, 'Chào bạn A, hồ sơ của bạn rất ấn tượng. Chúng tôi muốn hẹn phỏng vấn vào tuần sau.'),
(1, 1, 'Cảm ơn anh/chị. Tôi rất mong chờ buổi phỏng vấn.'),
(2, 4, 'Xin chào chị B, chị có thể chia sẻ thêm kinh nghiệm ReactJS của mình không?'),
(2, 2, 'Tôi từng tham gia một số dự án frontend cho các startup công nghệ.');

-- 9. NOTIFICATIONS
INSERT INTO notifications (user_id, type, content, is_read)
VALUES
(1, 'APPLICATION_STATUS', 'Hồ sơ ứng tuyển vào vị trí Java Backend Developer đã được xem.', FALSE),
(2, 'NEW_MESSAGE', 'Bạn có tin nhắn mới từ HR của TechCorp.', FALSE);
