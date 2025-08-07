
-- Create Database
CREATE DATABASE job_portal;
GO
USE job_portal;
GO

-- 1. Users table
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255),
    role NVARCHAR(20) CHECK (role IN ('SYSTEM_ADMIN', 'RECRUITER', 'CANDIDATE')) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 2. Companies table
CREATE TABLE companies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    website NVARCHAR(255),
    logo_url NVARCHAR(255),
    created_by BIGINT,
    is_approved BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
GO

-- 3. Company Memberships
CREATE TABLE company_memberships (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    role_in_company NVARCHAR(10) CHECK (role_in_company IN ('ADMIN', 'MEMBER')) NOT NULL,
    is_approved BIT DEFAULT 0,
    joined_at DATETIME DEFAULT GETDATE(),
    UNIQUE (user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
GO

-- 4. Jobs table
CREATE TABLE jobs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    company_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(255),
    salary_range NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
GO

-- 5. Job Applications
CREATE TABLE job_applications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    job_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    cover_letter NVARCHAR(MAX),
    resume_url NVARCHAR(255),
    status NVARCHAR(20) CHECK (status IN ('PENDING', 'REJECTED', 'APPROVED')) DEFAULT 'PENDING',
    applied_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (candidate_id) REFERENCES users(id)
);
GO

-- Insert sample users
INSERT INTO users (email, password, full_name, role) VALUES
('admin@jobportal.com', 'hashed_admin_pwd', 'System Admin', 'SYSTEM_ADMIN'),
('recruiter1@companyx.com', 'hashed_pwd1', 'Alice Nguyen', 'RECRUITER'),
('recruiter2@companyx.com', 'hashed_pwd2', 'Bob Tran', 'RECRUITER'),
('candidate1@gmail.com', 'hashed_pwd3', 'Charlie Pham', 'CANDIDATE'),
('candidate2@gmail.com', 'hashed_pwd4', 'Diana Le', 'CANDIDATE');
GO

-- Insert sample company
INSERT INTO companies (name, description, website, logo_url, created_by, is_approved) VALUES
('Company X', 'A leading tech company in AI and cloud solutions.', 'https://companyx.com', 'https://companyx.com/logo.png', 2, 1);
GO

-- Insert company memberships
INSERT INTO company_memberships (user_id, company_id, role_in_company, is_approved) VALUES
(2, 1, 'ADMIN', 1),
(3, 1, 'MEMBER', 1);
GO

-- Insert jobs
INSERT INTO jobs (company_id, title, description, location, salary_range, is_active, created_by) VALUES
(1, 'Java Backend Developer', 'Develop backend services using Spring Boot.', 'Hanoi', '25-35M VND', 1, 2),
(1, 'Frontend Developer (ReactJS)', 'Build modern UIs using ReactJS and Tailwind.', 'Remote', '20-30M VND', 1, 3);
GO

-- Insert job applications
INSERT INTO job_applications (job_id, candidate_id, cover_letter, resume_url, status) VALUES
(1, 4, 'I have 3 years experience in Java and Spring Boot.', 'https://resume-storage.com/cv_charlie.pdf', 'PENDING'),
(2, 5, 'Strong skills in ReactJS and frontend design.', 'https://resume-storage.com/cv_diana.pdf', 'PENDING');
GO
