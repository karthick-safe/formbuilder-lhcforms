/**
 * Answer coding component for enableWhen. The component is used for answer type choice for
 * selecting codes to satisfy a condition.
 */
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ObjectWidget} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';
import fhir from 'fhir/r4';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-enablewhen-answer-coding',
  template: `
    <div class="widget form-group form-group-sm m-0 p-0">
      <select [ngModel]="model" [compareWith]="compareFn" (ngModelChange)="modelChanged($event)"
              name="{{name}}" [attr.id]="id"
              class="form-control"
      >
        <ng-container>
          <option *ngFor="let option of answerOptions" [ngValue]="option.valueCoding"
          >{{option.valueCoding.display}} ({{option.valueCoding.code}})</option>
        </ng-container>
      </select>
    </div>
  `,
  styles: [
  ]
})
export class EnablewhenAnswerCodingComponent extends ObjectWidget implements AfterViewInit, OnDestroy {

  subscriptions: Subscription [] = [];
  answerOptions: any[] = [];
  model: fhir.Coding;

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService) {
    super();
  }

  /**
   * Component initialization.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.formProperty.valueChanges.subscribe((newValue) => {
      this.model = newValue;
    });

    // Listen to question value changes.
    this.formProperty.searchProperty('question').valueChanges.subscribe((source) => {
      this.answerOptions = [];
      if (!source) {
        return;
      }
      const answerType = this.formProperty.searchProperty('__$answerType').value;

      if (answerType === 'choice' || answerType === 'open-choice') {
        const sourceNode = this.formService.getTreeNodeByLinkId(source);
        this.answerOptions =
          (sourceNode && sourceNode.data && sourceNode.data.answerOption)
            ? sourceNode.data.answerOption : [];
        this.answerOptions = this.answerOptions.filter((opt) => {
          return !!opt?.valueCoding?.code || !!opt?.valueCoding?.display;
        });
      }
      this.model = !this.model && this.answerOptions?.length > 0 ? this.answerOptions[0] : this.model;
    });
  }



  /**
   * Handle model change event in <select> tag.
   * @param coding - Option value
   */
  modelChanged(coding: fhir.Coding) {
    this.formProperty.setValue(coding, false);
  }


  /**
   * Call back for <select> tag to pick matching option for a given model.
   * For comparison, it prioritizes code equality before display equality.
   *
   * @param c1 - Option value
   * @param c2 - Model object to compare
   */
  compareFn(c1: fhir.Coding, c2: fhir.Coding): boolean {
    return c1 && c2
      ? (c1.code && c2.code
        ? c1.code === c2.code
        : (c1.display === c2.display))
      : c1 === c2;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub?.unsubscribe();
    })
  }
}
