
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
	verification_expiry 	TIMESTAMP,
	ntd_search BOOLEAN 		NOT NULL DEFAULT FALSE
);

-- =====================
-- COMPANIES
-- =====================
CREATE TABLE companies (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
	location		location_enum NOT NULL,
	logo			TEXT,
    address         TEXT NOT NULL,
    website         TEXT,
    tax_code        TEXT,
	email			TEXT,
    description     TEXT,
    status          company_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ADD COLUMN search_tsv tsvector;

CREATE OR REPLACE FUNCTION companies_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    to_tsvector('english', coalesce(NEW.name, '')) ||
    to_tsvector('simple', coalesce(NEW.name, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_tsvector_update
BEFORE INSERT OR UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION companies_search_trigger();

CREATE INDEX companies_search_tsv_idx ON companies USING gin(search_tsv);

-- =====================
-- COMPANY MEMBERS
-- =====================
CREATE TABLE company_members (
    id              BIGSERIAL PRIMARY KEY,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	position		TEXT,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    status          member_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

CREATE TABLE hr_view_candidate (
    id              BIGSERIAL PRIMARY KEY,
    hr_id      		BIGINT NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
    candidate_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (hr_id, candidate_id)
);

-- =====================
-- CVS
-- =====================
CREATE TABLE cvs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    file_url        TEXT NOT NULL,
	file_type       TEXT NOT NULL,
    address         TEXT,
    level           level_enum, 
    experience      experience_enum,     
    job_title       TEXT,               
    content         TEXT,                    
    content_tsv     tsvector, 
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cvs_content_tsv ON cvs USING GIN (content_tsv);

CREATE FUNCTION cvs_tsvector_update() RETURNS trigger AS $$
BEGIN
  NEW.content_tsv :=
    to_tsvector('english', coalesce(NEW.content, '')) || 
	to_tsvector('simple', coalesce(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cvs_tsvector_update
BEFORE INSERT OR UPDATE OF content
ON cvs
FOR EACH ROW
EXECUTE FUNCTION cvs_tsvector_update();


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

CREATE OR REPLACE FUNCTION jobs_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    to_tsvector('english', coalesce(NEW.title, '')) ||
    to_tsvector('simple', coalesce(NEW.title, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_tsvector_update
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION jobs_search_trigger();

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

CREATE TABLE saved_jobs (
    id 				BIGSERIAL PRIMARY KEY,
    candidate_id 	BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id 			BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at 		TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, job_id)
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- USERS (HR cho 10 công ty)
INSERT INTO users (id, email, password_hash, full_name, role, status)
VALUES
 (100, 'hr1@c1.com', 'hash', 'HR C1', 'HR', 'ACTIVE'),
 (101, 'hr2@c2.com', 'hash', 'HR C2', 'HR', 'ACTIVE'),
 (102, 'hr3@c3.com', 'hash', 'HR C3', 'HR', 'ACTIVE'),
 (103, 'hr4@c4.com', 'hash', 'HR C4', 'HR', 'ACTIVE'),
 (104, 'hr5@c5.com', 'hash', 'HR C5', 'HR', 'ACTIVE'),
 (105, 'hr6@c6.com', 'hash', 'HR C6', 'HR', 'ACTIVE'),
 (106, 'hr7@c7.com', 'hash', 'HR C7', 'HR', 'ACTIVE'),
 (107, 'hr8@c8.com', 'hash', 'HR C8', 'HR', 'ACTIVE'),
 (108, 'hr9@c9.com', 'hash', 'HR C9', 'HR', 'ACTIVE'),
 (109, 'hr10@c10.com', 'hash', 'HR C10', 'HR', 'ACTIVE');

-- COMPANIES
INSERT INTO companies (id, name, location, address, status)
VALUES
 (1, 'Company 1', 'HANOI', 'Hà Nội', 'APPROVED'),
 (2, 'Company 2', 'HOCHIMINH', 'Hồ Chí Minh', 'APPROVED'),
 (3, 'Company 3', 'DANANG', 'Đà Nẵng', 'APPROVED'),
 (4, 'Company 4', 'HANOI', 'Hà Nội', 'APPROVED'),
 (5, 'Company 5', 'HOCHIMINH', 'Hồ Chí Minh', 'APPROVED'),
 (6, 'Company 6', 'DANANG', 'Đà Nẵng', 'APPROVED'),
 (7, 'Company 7', 'HANOI', 'Hà Nội', 'APPROVED'),
 (8, 'Company 8', 'HOCHIMINH', 'Hồ Chí Minh', 'APPROVED'),
 (9, 'Company 9', 'DANANG', 'Đà Nẵng', 'APPROVED'),
 (10, 'Company 10', 'HANOI', 'Hà Nội', 'APPROVED');

-- COMPANY MEMBERS (HR -> Company)
INSERT INTO company_members (company_id, user_id, is_admin, status)
VALUES
 (1, 100, TRUE, 'APPROVED'),
 (2, 101, TRUE, 'APPROVED'),
 (3, 102, TRUE, 'APPROVED'),
 (4, 103, TRUE, 'APPROVED'),
 (5, 104, TRUE, 'APPROVED'),
 (6, 105, TRUE, 'APPROVED'),
 (7, 106, TRUE, 'APPROVED'),
 (8, 107, TRUE, 'APPROVED'),
 (9, 108, TRUE, 'APPROVED'),
 (10, 109, TRUE, 'APPROVED');

-- SKILLS (15 kỹ năng)
INSERT INTO skills (id, name)
VALUES
 (1, 'Java'),
 (2, 'Spring Boot'),
 (3, 'Angular'),
 (4, 'React'),
 (5, 'Vue.js'),
 (6, 'Node.js'),
 (7, 'Python'),
 (8, 'Django'),
 (9, 'SQL'),
 (10, 'PostgreSQL'),
 (11, 'MongoDB'),
 (12, 'Docker'),
 (13, 'Kubernetes'),
 (14, 'AWS'),
 (15, 'Git');

-- JOBS (20 job, 2 job mỗi công ty)
INSERT INTO jobs (id, company_id, title, location, address, description, requirement, benefit, working_time, job_type, level, contract_type, salary, experience, quantity, deadline, status)
VALUES
 (1, 1, 'Backend Developer', 'HANOI', 'Hà Nội', 'Backend dev', 'Java, Spring', 'Bonus', '8-17h', 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-12-31', 'ACTIVE'),
 (2, 1, 'Frontend Developer', 'HANOI', 'Hà Nội', 'Frontend dev', 'React, Angular', 'Insurance', '8-17h', 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_10_DEN_15_TRIEU', 'MOT_NAM', 1, '2025-11-30', 'ACTIVE'),
 (3, 2, 'Fullstack Developer', 'HOCHIMINH', 'HCM', 'FS dev', 'Node, React', 'OT pay', '9-18h', 'REMOTE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'HAI_NAM', 3, '2025-12-15', 'ACTIVE'),
 (4, 2, 'Data Engineer', 'HOCHIMINH', 'HCM', 'Data pipeline', 'Python, SQL', 'Laptop', '9-18h', 'IN_OFFICE', 'SENIOR', 'FULL_TIME', 'TU_25_DEN_30_TRIEU', 'BA_NAM', 2, '2025-12-31', 'ACTIVE'),
 (5, 3, 'DevOps Engineer', 'DANANG', 'Đà Nẵng', 'DevOps', 'Docker, K8s', 'Cloud credits', '9-18h', 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'NAM_NAM', 2, '2025-10-30', 'ACTIVE'),
 (6, 3, 'QA Engineer', 'DANANG', 'Đà Nẵng', 'QA test', 'Automation', 'Team building', '8-17h', 'IN_OFFICE', 'FRESHER', 'FULL_TIME', 'DUOI_10_TRIEU', 'KHONG_YEU_CAU', 1, '2025-12-20', 'ACTIVE'),
 (7, 4, 'Mobile Dev', 'HANOI', 'Hà Nội', 'Android/iOS', 'React Native', 'Bonus', '9-18h', 'HYBRID', 'JUNIOR', 'FULL_TIME', 'TU_10_DEN_15_TRIEU', 'MOT_NAM', 2, '2025-11-25', 'ACTIVE'),
 (8, 4, 'System Admin', 'HANOI', 'Hà Nội', 'SysAdmin', 'Linux, AWS', 'Insurance', '8-17h', 'IN_OFFICE', 'SENIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'BON_NAM', 1, '2025-12-05', 'ACTIVE'),
 (9, 5, 'UI/UX Designer', 'HOCHIMINH', 'HCM', 'Design UI/UX', 'Figma', 'Healthcare', '9-18h', 'REMOTE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'HAI_NAM', 1, '2025-11-15', 'ACTIVE'),
 (10, 5, 'Security Engineer', 'HOCHIMINH', 'HCM', 'Cybersecurity', 'Pentest', 'Bonus', '8-17h', 'IN_OFFICE', 'SENIOR', 'FULL_TIME', 'TU_25_DEN_30_TRIEU', 'NAM_NAM', 2, '2025-12-25', 'ACTIVE'),
 (11, 6, 'AI Engineer', 'DANANG', 'Đà Nẵng', 'ML models', 'Python, Tensorflow', 'GPU server', '9-18h', 'REMOTE', 'SENIOR', 'FULL_TIME', 'TREN_50_TRIEU', 'TREN_5_NAM', 1, '2025-12-31', 'ACTIVE'),
 (12, 6, 'Business Analyst', 'DANANG', 'Đà Nẵng', 'Analyze req', 'BA skill', 'Healthcare', '9-18h', 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'HAI_NAM', 1, '2025-10-31', 'ACTIVE'),
 (13, 7, 'Project Manager', 'HANOI', 'Hà Nội', 'PM', 'Agile, Scrum', 'Bonus', '9-18h', 'HYBRID', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'NAM_NAM', 1, '2025-12-31', 'ACTIVE'),
 (14, 7, 'Support Engineer', 'HANOI', 'Hà Nội', 'Customer support', 'English', 'OT pay', '8-17h', 'IN_OFFICE', 'FRESHER', 'FULL_TIME', 'DUOI_10_TRIEU', 'KHONG_YEU_CAU', 2, '2025-11-30', 'ACTIVE'),
 (15, 8, 'Game Developer', 'HOCHIMINH', 'HCM', 'Unity game', 'C#, Unity', 'Free games', '9-18h', 'REMOTE', 'JUNIOR', 'FULL_TIME', 'TU_15_DEN_20_TRIEU', 'MOT_NAM', 2, '2025-12-20', 'ACTIVE'),
 (16, 8, 'Marketing Specialist', 'HOCHIMINH', 'HCM', 'Digital marketing', 'SEO/SEM', 'Bonus', '8-17h', 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_10_DEN_15_TRIEU', 'MOT_NAM', 1, '2025-11-25', 'ACTIVE'),
 (17, 9, 'Embedded Engineer', 'DANANG', 'Đà Nẵng', 'IoT devices', 'C, C++', 'Insurance', '8-17h', 'IN_OFFICE', 'JUNIOR', 'FULL_TIME', 'TU_20_DEN_25_TRIEU', 'BA_NAM', 2, '2025-12-10', 'ACTIVE'),
 (18, 9, 'Cloud Engineer', 'DANANG', 'Đà Nẵng', 'Cloud infra', 'AWS, Docker', 'OT pay', '9-18h', 'REMOTE', 'SENIOR', 'FULL_TIME', 'TU_30_DEN_50_TRIEU', 'TREN_5_NAM', 1, '2025-12-30', 'ACTIVE'),
 (19, 10, 'Tech Lead', 'HANOI', 'Hà Nội', 'Lead dev', 'Leadership', 'Bonus', '9-18h', 'HYBRID', 'SENIOR', 'FULL_TIME', 'TREN_50_TRIEU', 'TREN_5_NAM', 1, '2025-12-31', 'ACTIVE'),
 (20, 10, 'Intern Developer', 'HANOI', 'Hà Nội', 'Intern dev', 'Basic coding', 'Training', '8-17h', 'IN_OFFICE', 'INTERN', 'PART_TIME', 'DUOI_10_TRIEU', 'KHONG_YEU_CAU', 5, '2025-11-15', 'ACTIVE');

-- JOB SKILLS (>= 3 skill/job)
INSERT INTO job_skills (job_id, skill_id)
VALUES
 (1,1),(1,2),(1,9),(1,10),
 (2,3),(2,4),(2,15),
 (3,6),(3,4),(3,15),
 (4,7),(4,9),(4,10),
 (5,12),(5,13),(5,14),
 (6,7),(6,9),(6,15),
 (7,4),(7,5),(7,15),
 (8,7),(8,14),(8,12),
 (9,3),(9,5),(9,15),
 (10,12),(10,13),(10,14),
 (11,7),(11,8),(11,14),
 (12,9),(12,10),(12,15),
 (13,1),(13,2),(13,15),
 (14,9),(14,10),(14,15),
 (15,1),(15,5),(15,15),
 (16,3),(16,5),(16,15),
 (17,1),(17,9),(17,15),
 (18,12),(18,13),(18,14),
 (19,1),(19,2),(19,4),
 (20,1),(20,3),(20,5);
