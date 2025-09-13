
CREATE TYPE user_role_enum AS ENUM ('CANDIDATE', 'HR', 'ADMIN');
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE company_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE member_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');
CREATE TYPE application_status_enum AS ENUM ('APPLIED','VIEWED','SUITABLE','UNSUITABLE');
CREATE TYPE job_status_enum AS ENUM ('ACTIVE','HIDDEN','CLOSED');
CREATE TYPE salary_enum AS ENUM ('DUOI_10_TRIEU', 'TU_10_DEN_15_TRIEU', 'TU_15_DEN_20_TRIEU', 'TU_20_DEN_25_TRIEU', 'TU_25_DEN_30_TRIEU', 'TU_30_DEN_50_TRIEU', 'TREN_50_TRIEU', 'THOA_THUAN');
CREATE TYPE level_enum AS ENUM ('FRESHER', 'INTERN', 'JUNIOR', 'SENIOR');
CREATE TYPE experience_enum AS ENUM ('KHONG_YEU_CAU', 'DUOI_1_NAM', 'MOT_NAM', 'HAI_NAM', 'BA_NAM', 'BON_NAM', 'NAM_NAM', 'TREN_5_NAM');
CREATE TYPE job_type_enum AS ENUM ('IN_OFFICE', 'HYBRID', 'REMOTE');
CREATE TYPE contract_type_enum AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE');
CREATE TYPE notification_type_enum AS ENUM ('APPLICATION_STATUS','NEW_MESSAGE','SYSTEM_ALERT');
CREATE TYPE location_enum AS ENUM ('HANOI','DANANG','HOCHIMINH');

-- =====================
-- USERS
-- =====================
CREATE TABLE users (
    id              		BIGSERIAL PRIMARY KEY,
    email           		TEXT NOT NULL UNIQUE,
    password_hash  			TEXT NOT NULL,
    full_name       		TEXT NOT NULL,
    phone           		CHAR(10),
    dob             		DATE,
    avatar_url      		TEXT,
    role            		user_role_enum NOT NULL,
    status          		user_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at      		TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      		TIMESTAMP NOT NULL DEFAULT NOW(),
	email_verified  		BOOLEAN NOT NULL DEFAULT FALSE,
	verification_code 		TEXT,
	verification_expiry 	TIMESTAMP 
);

-- =====================
-- COMPANIES
-- =====================
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
	location		location_enum NOT NULL,
    address         TEXT NOT NULL,
    tax_code        TEXT,
    website         TEXT,
    description     TEXT,
    status          company_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN search_tsv tsvector;

-- Hàm cập nhật search_tsv cho companies
CREATE OR REPLACE FUNCTION companies_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    to_tsvector('english', coalesce(NEW.name, '')) ||
    to_tsvector('simple', coalesce(NEW.name, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger tự động update khi insert/update
CREATE TRIGGER companies_tsvector_update
BEFORE INSERT OR UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION companies_search_trigger();

-- Chạy update 1 lần cho dữ liệu cũ
UPDATE companies
SET search_tsv = to_tsvector('english', coalesce(name, '')) ||
                 to_tsvector('simple', coalesce(name, ''));

-- Index GIN để search nhanh
CREATE INDEX companies_search_tsv_idx ON companies USING gin(search_tsv);

-- =====================
-- COMPANY MEMBERS
-- =====================
CREATE TABLE company_members (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    status          member_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

-- =====================
-- CVS
-- =====================
CREATE TABLE cvs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    file_url        TEXT NOT NULL,
	level			level_enum,
	key_word		TEXT[],
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- JOBS
-- =====================
CREATE TABLE jobs (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    location        location_enum NOT NULL,
	address 		TEXT NOT NULL,
    description     TEXT NOT NULL,
	requirement		TEXT NOT NULL,
	benefit			TEXT NOT NULL,
	working_time	TEXT NOT NULL,
    job_type        job_type_enum NOT NULL,
	level			level_enum NOT NULL,
	contract_type	contract_type_enum NOT NULL,
	salary			salary_enum NOT NULL,
	experience		experience_enum NOT NULL,
	quantity		INT NOT NULL,
	deadline		DATE NOT NULL,
    status          job_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE jobs ADD COLUMN search_tsv tsvector;

-- Hàm cập nhật search_tsv cho jobs
CREATE OR REPLACE FUNCTION jobs_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    to_tsvector('english', coalesce(NEW.title, '')) ||
    to_tsvector('simple', coalesce(NEW.title, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger tự động update khi insert/update
CREATE TRIGGER jobs_tsvector_update
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION jobs_search_trigger();

-- Chạy update 1 lần cho dữ liệu cũ
UPDATE jobs
SET search_tsv = to_tsvector('english', coalesce(title, '')) ||
                 to_tsvector('simple', coalesce(title, ''));

-- Index GIN để search nhanh
CREATE INDEX jobs_search_tsv_idx ON jobs USING gin(search_tsv);

-- =====================
-- APPLICATIONS
-- =====================
CREATE TABLE applications (
    id              BIGSERIAL PRIMARY KEY,
    job_id          BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	file_name 		TEXT NOT NULL,
    cv_url          TEXT NOT NULL,
	file_type		TEXT NOT NULL,
    cover_letter    TEXT,
    status          application_status_enum NOT NULL DEFAULT 'APPLIED',
    applied_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, candidate_id)
);

-- =====================
-- CONVERSATIONS
-- =====================
CREATE TABLE conversations (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, candidate_id)
);

-- =====================
-- MESSAGES
-- =====================
CREATE TABLE messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- NOTIFICATIONS
-- =====================
CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type_enum NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================
-- SKILLS
-- =====================
CREATE TABLE skills (
    id      BIGSERIAL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE
);

CREATE TABLE company_skills (
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    skill_id    	BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, skill_id)
);

CREATE TABLE job_skills (
    job_id      BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id    BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE cv_skills (
    cv_id       BIGINT NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    skill_id    BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (cv_id, skill_id)
);

-- =====================
-- USERS (10 users)
-- =====================
INSERT INTO users (email, password_hash, full_name, phone, dob, role, email_verified)
VALUES
('candidate1@example.com', 'pwd1', 'Nguyễn Văn A', '0900000001', '1999-01-01', 'CANDIDATE', TRUE),
('candidate2@example.com', 'pwd2', 'Trần Thị B', '0900000002', '1998-02-02', 'CANDIDATE', TRUE),
('candidate3@example.com', 'pwd3', 'Lê Văn C', '0900000003', '1997-03-03', 'CANDIDATE', TRUE),
('candidate4@example.com', 'pwd4', 'Phạm Thị D', '0900000004', '1996-04-04', 'CANDIDATE', TRUE),
('candidate5@example.com', 'pwd5', 'Hoàng Văn E', '0900000005', '1995-05-05', 'CANDIDATE', TRUE),
('hr1@company.com', 'pwd6', 'HR 1', '0900000006', '1985-06-06', 'HR', TRUE),
('hr2@company.com', 'pwd7', 'HR 2', '0900000007', '1986-07-07', 'HR', TRUE),
('hr3@company.com', 'pwd8', 'HR 3', '0900000008', '1987-08-08', 'HR', TRUE),
('hr4@company.com', 'pwd9', 'HR 4', '0900000009', '1988-09-09', 'HR', TRUE),
('admin@jobsday.com', 'pwd10', 'System Admin', NULL, NULL, 'ADMIN', TRUE);

-- =====================
-- COMPANIES (10 companies)
-- =====================
INSERT INTO companies (name, location, address, website, description, status)
VALUES
('FPT Software', 'HANOI', 'Số 17 Duy Tân, Cầu Giấy', 'https://fpt.com.vn', 'Công ty CNTT hàng đầu', 'APPROVED'),
('VNG Corporation', 'HOCHIMINH', '273 Điện Biên Phủ, Bình Thạnh', 'https://vng.com.vn', 'Công ty Internet & Game', 'APPROVED'),
('CMC Corp', 'HANOI', 'Tòa nhà CMC, Duy Tân', 'https://cmc.com.vn', 'Công ty CNTT & Viễn thông', 'APPROVED'),
('VinGroup', 'HOCHIMINH', 'Vinhomes Central Park', 'https://vingroup.net', 'Tập đoàn đa ngành', 'APPROVED'),
('Sun Group', 'DANANG', 'Bà Nà Hills', 'https://sungroup.com.vn', 'Tập đoàn du lịch & giải trí', 'APPROVED'),
('TMA Solutions', 'HOCHIMINH', 'Quận 12', 'https://tmasolutions.com', 'Gia công phần mềm', 'APPROVED'),
('KMS Technology', 'HOCHIMINH', 'Quận 7', 'https://kms-technology.com', 'Outsourcing & sản phẩm', 'APPROVED'),
('Axon Active', 'DANANG', 'Hải Châu', 'https://axonactive.com', 'Công ty phần mềm Thụy Sĩ', 'APPROVED'),
('NashTech', 'HANOI', 'Hoàn Kiếm', 'https://nashtechglobal.com', 'Công ty gia công phần mềm', 'APPROVED'),
('Momo', 'HOCHIMINH', 'Tân Bình', 'https://momo.vn', 'Ví điện tử số 1 VN', 'APPROVED');

-- =====================
-- SKILLS (15 skills)
-- =====================
INSERT INTO skills (name)
VALUES
('Java'),('Spring Boot'),('SQL'),('Python'),('Django'),
('JavaScript'),('React'),('NodeJS'),('Angular'),('VueJS'),
('AWS'),('Docker'),('Kubernetes'),('DevOps'),('Machine Learning');

-- =====================
-- COMPANY SKILLS (3–5 skills mỗi company)
-- =====================
INSERT INTO company_skills (company_id, skill_id) VALUES
(1,1),(1,2),(1,3),(1,11),      -- FPT
(2,6),(2,7),(2,8),(2,12),      -- VNG
(3,1),(3,3),(3,4),(3,5),       -- CMC
(4,6),(4,9),(4,10),(4,13),     -- Vingroup
(5,6),(5,7),(5,9),             -- Sun Group
(6,1),(6,2),(6,3),(6,12),      -- TMA
(7,6),(7,7),(7,8),(7,11),(7,12), -- KMS
(8,4),(8,5),(8,6),(8,14),      -- Axon
(9,1),(9,2),(9,3),(9,11),      -- NashTech
(10,6),(10,7),(10,15);         -- Momo

-- =====================
-- JOBS (25 jobs, 2–3 jobs mỗi company)
-- =====================
INSERT INTO jobs (
    company_id, title, location, address, description, requirement, benefit, working_time,
    job_type, level, contract_type, salary, experience, quantity, deadline, status
) VALUES
-- FPT Software
(1, 'Java Developer', 'HANOI', 'Số 17 Duy Tân', 'Phát triển Java backend', 'Java, Spring Boot', 'Lương thưởng hấp dẫn', '8h-17h',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'HAI_NAM', 3, '2025-12-31', 'ACTIVE'),
(1, 'DevOps Engineer', 'HANOI', 'Số 17 Duy Tân', 'Triển khai CI/CD', 'AWS, Docker, Kubernetes', 'Chế độ tốt', '8h-17h',
 'HYBRID', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'TREN_5_NAM', 2, '2025-10-30', 'ACTIVE'),

-- VNG
(2, 'Frontend Developer', 'HOCHIMINH', '273 Điện Biên Phủ', 'Phát triển UI ReactJS', 'React, Redux', 'Team trẻ trung', '9h-18h',
 'HYBRID', 'FRESHER', 'FULL_TIME', 'TU_10_DEN_15_TRIEU', 'DUOI_1_NAM', 2, '2025-11-30', 'ACTIVE'),
(2, 'NodeJS Developer', 'HOCHIMINH', '273 Điện Biên Phủ', 'Backend NodeJS', 'NodeJS, MongoDB', 'Môi trường năng động', '9h-18h',
 'REMOTE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-09-30', 'ACTIVE'),

-- CMC
(3, 'Python Developer', 'HANOI', 'Duy Tân', 'Phát triển dịch vụ Python', 'Python, Django', 'Đãi ngộ tốt', '8h-17h',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-08-31', 'ACTIVE'),
(3, 'Data Engineer', 'HANOI', 'Duy Tân', 'Xử lý big data', 'SQL, Python', 'Môi trường chuyên nghiệp', '8h-17h',
 'HYBRID', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'TREN_5_NAM', 2, '2025-12-15', 'ACTIVE'),

-- VinGroup
(4, 'Angular Developer', 'HOCHIMINH', 'Central Park', 'Xây dựng hệ thống web', 'Angular, TypeScript', 'Phúc lợi đầy đủ', '8h30-17h30',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'HAI_NAM', 3, '2025-09-20', 'ACTIVE'),
(4, 'Cloud Engineer', 'HOCHIMINH', 'Central Park', 'Triển khai hệ thống Cloud', 'AWS, Docker', 'Môi trường hiện đại', '8h30-17h30',
 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'BON_NAM', 2, '2025-12-01', 'ACTIVE'),

-- Sun Group
(5, 'Web Developer', 'DANANG', 'Bà Nà Hills', 'Phát triển hệ thống nội bộ', 'JavaScript, VueJS', 'Team trẻ', '9h-18h',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-07-31', 'ACTIVE'),
(5, 'Mobile Developer', 'DANANG', 'Bà Nà Hills', 'Ứng dụng mobile', 'React Native, JS', 'Môi trường năng động', '9h-18h',
 'HYBRID', 'FRESHER', 'FULL_TIME', 'DUOI_10_TRIEU', 'KHONG_YEU_CAU', 2, '2025-09-01', 'ACTIVE'),

-- TMA
(6, 'Java Developer', 'HOCHIMINH', 'Quận 12', 'Backend Java', 'Java, SQL', 'Lương thưởng hấp dẫn', '8h-17h',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-11-01', 'ACTIVE'),
(6, 'QA Engineer', 'HOCHIMINH', 'Quận 12', 'Kiểm thử phần mềm', 'Automation Testing', 'Đãi ngộ tốt', '8h-17h',
 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_10_DEN_15_TRIEU', 'MOT_NAM', 2, '2025-09-01', 'ACTIVE'),

-- KMS
(7, 'React Developer', 'HOCHIMINH', 'Quận 7', 'Phát triển ReactJS', 'React, Redux', 'Cơ hội onsite', '9h-18h',
 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'HAI_NAM', 2, '2025-10-01', 'ACTIVE'),
(7, 'DevOps Engineer', 'HOCHIMINH', 'Quận 7', 'CI/CD pipelines', 'Docker, Kubernetes', 'Đãi ngộ cao', '9h-18h',
 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'NAM_NAM', 2, '2025-12-20', 'ACTIVE'),

-- Axon
(8, 'Python Developer', 'DANANG', 'Hải Châu', 'Xây dựng ứng dụng Python', 'Django, SQL', 'Môi trường chuyên nghiệp', '8h30-17h30',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-11-15', 'ACTIVE'),
(8, 'Fullstack Developer', 'DANANG', 'Hải Châu', 'React + NodeJS', 'JS, React, Node', 'Onsite Thụy Sĩ', '8h30-17h30',
 'HYBRID', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'BON_NAM', 2, '2025-10-15', 'ACTIVE'),

-- NashTech
(9, 'Java Developer', 'HANOI', 'Hoàn Kiếm', 'Java + Spring Boot', 'Java, Spring Boot', 'Môi trường quốc tế', '8h-17h',
 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'MOT_NAM', 2, '2025-09-30', 'ACTIVE'),
(9, 'Data Scientist', 'HANOI', 'Hoàn Kiếm', 'Machine Learning', 'Python, ML', 'Cơ hội nghiên cứu', '8h-17h',
 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'TREN_5_NAM', 2, '2025-12-31', 'ACTIVE'),

-- Momo
(10, 'Backend Developer', 'HOCHIMINH', 'Tân Bình', 'Backend dịch vụ thanh toán', 'Java, SQL', 'Thưởng theo dự án', '8h-17h',
 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'HAI_NAM', 2, '2025-11-11', 'ACTIVE'),
(10, 'Mobile Engineer', 'HOCHIMINH', 'Tân Bình', 'Ứng dụng ví điện tử', 'Kotlin/Swift', 'Lương cạnh tranh', '8h-17h',
 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'HAI_NAM', 2, '2025-10-10', 'ACTIVE'),
(10, 'Data Engineer', 'HOCHIMINH', 'Tân Bình', 'Dữ liệu lớn', 'SQL, Python', 'Thưởng hiệu suất', '8h-17h',
 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'TREN_5_NAM', 2, '2025-12-20', 'ACTIVE');

-- =====================
-- JOB SKILLS (3–5 skill/job, ví dụ)
-- =====================
INSERT INTO job_skills (job_id, skill_id) VALUES
(1,1),(1,2),(1,3),             -- Java Developer
(2,11),(2,12),(2,13),          -- DevOps Engineer
(3,6),(3,7),(3,9),             -- Frontend Dev
(4,8),(4,6),(4,12),            -- NodeJS Dev
(5,4),(5,5),(5,3),             -- Python Dev
(6,4),(6,3),(6,15),            -- Data Engineer
(7,9),(7,6),(7,13),            -- Angular Dev
(8,11),(8,12),(8,13),          -- Cloud Engineer
(9,6),(9,10),(9,7),            -- Web Dev
(10,6),(10,7),(10,9),          -- Mobile Dev
(11,1),(11,3),(11,2),          -- Java Dev
(12,6),(12,7),(12,8),          -- QA
(13,7),(13,6),(13,9),          -- React Dev
(14,12),(14,13),(14,11),       -- DevOps
(15,4),(15,5),(15,3),          -- Python Dev
(16,6),(16,7),(16,8),          -- Fullstack
(17,1),(17,2),(17,3),          -- Java Dev
(18,15),(18,4),(18,6),         -- Data Scientist
(19,1),(19,3),(19,2),          -- Backend Dev
(20,6),(20,7),(20,9),          -- Mobile Engineer
(21,4),(21,3),(21,15);         -- Data Engineer

