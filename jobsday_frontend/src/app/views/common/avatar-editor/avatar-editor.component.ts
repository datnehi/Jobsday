import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnChanges, SimpleChanges, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-avatar-editor',
  imports: [
    CommonModule
  ],
  templateUrl: './avatar-editor.component.html',
  styleUrls: ['./avatar-editor.component.css']
})
export class AvatarEditorComponent implements OnChanges, OnDestroy {
  @Input() data: any | null = null;
  @Input() visible = false;

  @Output() saved = new EventEmitter<File | null>();
  @Output() closed = new EventEmitter<void>();
  @Output() error = new EventEmitter<{ title: string; message: string }>();

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  selectedFileUrl: string | null = null;
  previewUrl: string | null = null;

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']) {
      if (this.visible) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  onFileSelected(event: Event) {
    const el = event.target as HTMLInputElement;
    const file = el.files && el.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.error.emit({ title: 'Lỗi', message: 'Kích thước file vượt quá 5MB. Vui lòng chọn file khác.' });
      if (this.fileInput) this.fileInput.nativeElement.value = '';
      return;
    }

    this.selectedFile = file;

    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }
    this.selectedFileUrl = URL.createObjectURL(file);
    this.previewUrl = this.selectedFileUrl;
  }

  removeImage() {
    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }
    this.selectedFile = null;
    this.selectedFileUrl = null;
    this.previewUrl = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  saveAvatar() {
    if (!this.selectedFile) return;
    this.saved.emit(this.selectedFile);
    this.cleanupAndClose();
  }

  closeAvatarDialog() {
    this.closed.emit();
    this.cleanupAndClose();
  }

  private cleanupAndClose() {
    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }
    this.selectedFile = null;
    this.selectedFileUrl = null;
    this.previewUrl = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  triggerFileDialog() {
    this.fileInput?.nativeElement.click();
  }
}
