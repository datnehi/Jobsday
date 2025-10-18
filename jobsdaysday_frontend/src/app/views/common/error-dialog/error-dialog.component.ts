import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-dialog',
  imports: [],
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.css'
})
export class ErrorDialogComponent {
  @Input() title?: string;
  @Input() message?: string;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent) {
    this.onCancel();
  }
}
