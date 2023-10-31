import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTextComponent } from './custom-text.component';

xdescribe('CustomTextComponent', () => {
  let component: CustomTextComponent;
  let fixture: ComponentFixture<CustomTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
