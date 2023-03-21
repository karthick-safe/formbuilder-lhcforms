/**
 * Component for general input box
 */
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ControlWidget, StringWidget} from '@lhncbc/ngx-schema-form';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbControlWidgetComponent implements AfterViewInit {

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
  }
}
