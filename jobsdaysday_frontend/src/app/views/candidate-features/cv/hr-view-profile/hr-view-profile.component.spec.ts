import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrViewProfileComponent } from './hr-view-profile.component';

describe('HrViewProfileComponent', () => {
  let component: HrViewProfileComponent;
  let fixture: ComponentFixture<HrViewProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrViewProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrViewProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
