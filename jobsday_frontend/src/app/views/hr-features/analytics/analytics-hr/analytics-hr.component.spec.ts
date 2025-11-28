import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsHrComponent } from './analytics-hr.component';

describe('AnalyticsHrComponent', () => {
  let component: AnalyticsHrComponent;
  let fixture: ComponentFixture<AnalyticsHrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsHrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyticsHrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
