import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CvsService } from '../../../../services/cvs.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload-cv',
  imports: [
    CommonModule
  ],
  templateUrl: './upload-cv.component.html',
  styleUrl: './upload-cv.component.css'
})
export class UploadCvComponent {
  uploadedCVName: string = '';
  uploadedCVFile: File | undefined;
  isDragOver = false;
  isUploading = false;

  constructor(private cvsService: CvsService, private router: Router) {}

  onCVFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Giới hạn loại file
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ hỗ trợ file .pdf, .doc, .docx!');
        return;
      }
      // Giới hạn kích thước file (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File vượt quá kích thước 5MB!');
        return;
      }
      this.uploadedCVName = file.name;
      this.uploadedCVFile = file;
    }
  }

  removeUploadedCV() {
    this.uploadedCVName = '';
    this.uploadedCVFile = undefined;
  }

  triggerCVUpload() {
    const input = document.querySelector('input[type="file"]') as HTMLElement;
    if (input) input.click();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onCVFileChange({ target: { files } });
    }
  }

  upLoadCv() {
    if (!this.uploadedCVFile) {
      alert('Vui lòng chọn file CV!');
      return;
    }
    this.isUploading = true;
    const formData = new FormData();
    formData.append('title', this.uploadedCVName);
    formData.append('file', this.uploadedCVFile);

    this.cvsService.uploadCV(formData).subscribe({
      next: (response) => {
        this.router.navigate(['/quan-ly-cv']);
      },
      error: (error) => {
        this.isUploading = false;
        console.error("Error:", error.error);
        alert(error.error.message);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }
}
