import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppliedHistoryComponent } from './applied-history.component';

describe('AppliedHistoryComponent', () => {
  let component: AppliedHistoryComponent;
  let fixture: ComponentFixture<AppliedHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppliedHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppliedHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
