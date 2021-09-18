import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfFormWrapperComponent } from './sf-form-wrapper.component';

describe('SfFormWrapperComponent', () => {
  let component: SfFormWrapperComponent;
  let fixture: ComponentFixture<SfFormWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SfFormWrapperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SfFormWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
