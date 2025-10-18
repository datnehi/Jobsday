import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveMemberComponent } from './approve-member.component';

describe('ApproveMemberComponent', () => {
  let component: ApproveMemberComponent;
  let fixture: ComponentFixture<ApproveMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveMemberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
