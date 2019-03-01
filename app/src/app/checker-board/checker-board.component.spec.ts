import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckerBoardComponent } from './checker-board.component';

describe('CheckerBoardComponent', () => {
  let component: CheckerBoardComponent;
  let fixture: ComponentFixture<CheckerBoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckerBoardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckerBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
