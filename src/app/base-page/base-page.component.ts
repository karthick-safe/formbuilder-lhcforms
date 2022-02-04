import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output, TemplateRef,
  ViewChild
} from '@angular/core';
import {FormService} from '../services/form.service';
import {fhir} from '../fhir';
import {BehaviorSubject, from, Observable, of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, finalize, mergeMap, switchMap, takeUntil} from 'rxjs/operators';
import {MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AutoCompleteResult} from '../lib/widgets/auto-complete/auto-complete.component';
import {FetchService} from '../fetch.service';
import {FhirService} from '../services/fhir.service';
import {FhirServersDlgComponent} from '../lib/widgets/fhir-servers-dlg/fhir-servers-dlg.component';
import {FhirSearchDlgComponent} from '../lib/widgets/fhir-search-dlg/fhir-search-dlg.component';
import { PreviewDlgComponent } from '../lib/widgets/preview-dlg/preview-dlg.component';
import {AppJsonPipe} from '../lib/pipes/app-json.pipe';
import {Util} from '../lib/util';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {MatDialog} from '@angular/material/dialog';
import {FhirExportDlgComponent} from '../lib/widgets/fhir-export-dlg/fhir-export-dlg.component';
import {LoincNoticeComponent} from '../lib/widgets/loinc-notice/loinc-notice.component';
import {SharedObjectService} from '../shared-object.service';
declare var LForms: any;

type ExportType = 'CREATE' | 'UPDATE';

@Component({
  selector: 'lfb-base-page',
  templateUrl: './base-page.component.html',
  styleUrls: ['./base-page.component.css'],
  providers: [NgbActiveModal]
})
export class BasePageComponent implements OnDestroy {

  private unsubscribe = new Subject<void>()
  @Input()
  guidingStep = 'home'; // 'choose-start', 'home', 'item-editor'
  startOption = 'scratch';
  importOption = '';
  editMode = 'fresh';
  questionnaire: fhir.Questionnaire = null;
  formFields: fhir.Questionnaire = null;
  formValue: fhir.Questionnaire;
  formSubject = new Subject<fhir.Questionnaire>();
  @Output()
  state = new EventEmitter<string>();
  objectUrl: any;
  acResult: AutoCompleteResult = null;
  @ViewChild('lhcFormPreview') previewEl: ElementRef;
  @ViewChild('fileInput') fileInputEl: ElementRef;
  @ViewChild('loincSearchDlg') loincSearchDlg: TemplateRef<any>;
  selectedPreviewTab = 0;
  acceptTermsOfUse = false;


  constructor(private formService: FormService,
              private modelService: SharedObjectService,
              private modalService: NgbModal,
              private activeModal: NgbActiveModal,
              private dataSrv: FetchService,
              public fhirService: FhirService,
              private appJsonPipe: AppJsonPipe,
              private cdr: ChangeDetectorRef,
              private matDlg: MatDialog
              ) {
    const isAutoSaved = this.formService.isAutoSaved();
    if(isAutoSaved) {
      this.startOption = 'from_autosave';
    }

    this.acceptTermsOfUse = sessionStorage.acceptTermsOfUse === 'true';
    if(!this.acceptTermsOfUse) {
      this.modalService.open(
        LoincNoticeComponent,{size: 'lg', centered: true, keyboard: false, backdrop: 'static'}
      ).result
        .then(
          (result) => {
            this.acceptTermsOfUse = result;
            sessionStorage.acceptTermsOfUse = result;
          },
          (reason) => {
            console.error(reason);
          });
    }

    this.formSubject.asObservable().pipe(
      debounceTime(500),
      switchMap((fhirQ) => {
        this.formService.autoSaveForm(fhirQ);
        return of(fhirQ);
      }),
      takeUntil(this.unsubscribe)
    ).subscribe(() => {
      console.log('Saved');
    });

    formService.guidingStep$.subscribe((step) => {this.guidingStep = step;});
  }


  /**
   * Convert the questionnaire to lfData.
   */
  get lfData(): any {
    const q = Util.convertToQuestionnaireJSON(this.formValue);
    return LForms.Util.convertFHIRQuestionnaireToLForms(q, 'R4');
  }


  /**
   * Notify changes to form.
   * @param form - form object, a.k.a questionnaire
   */
  notifyChange(form) {
    this.formSubject.next(form);
  }


  /**
   * Handle value changes in form-fields component.
   * @param event - Emits questionnaire (Form level copy)
   */
  formFieldsChanged(event) {
    const itemList = this.formValue.item;
    Util.mirrorObject(this.formValue, Util.convertToQuestionnaireJSON(event));
    this.formValue.item = itemList;
    this.notifyChange(this.formValue);
    this.modelService.questionnaire = this.questionnaire;
  }


  /**
   * Handle value changes in item-component.
   * @param itemList - Emits item list. Form level fields should be untouched.
   */
  itemComponentChanged(itemList) {
    this.formValue.item = itemList;
    this.notifyChange(this.formValue);
  }


  /**
   * Set questionnaire.
   * Make
   * @param questionnaire - Input FHIR questionnaire
   */
  setQuestionnaire(questionnaire) {
    this.questionnaire = questionnaire;
    this.formValue = Object.assign({}, questionnaire);
    this.formFields = Object.assign({}, questionnaire);
    delete this.formFields.item;
    this.notifyChange(this.formValue);
  }


  /**
   * Switch guiding step
   * @param step - a
   */
  setStep(step: string) {
    this.formService.setGuidingStep(step);
    this.formService.autoSave('state', step);
  }

  /**
   * Check auto save status
   */
  isAutoSaved() {
    return this.formService.isAutoSaved();
  }
  /**
   * Handle continue button.
   */
  onContinue() {
    // TODO - Rethink the logic.
    if(this.startOption === 'from_autosave') {
      this.formService.setGuidingStep(this.formService.autoLoad('state'));
      this.setQuestionnaire(this.formService.autoLoadForm());
    }
    else if (this.startOption === 'scratch') {
      this.setStep('fl-editor');
      this.setQuestionnaire(Util.createDefaultForm());
    }
    else if (this.importOption === 'local') {
      this.fileInputEl.nativeElement.click();
    }
    else if (this.importOption === 'fhirServer') {
      this.fetchFormFromFHIRServer$().subscribe((form) => {
        if(form) {
          this.setQuestionnaire(form);
          this.setStep('fl-editor');
        }
      });
    }
    else if (this.importOption === 'loinc') {
      this.modalService.open(this.loincSearchDlg).result.then((qId)=>{
        this.dataSrv.getFormData(qId).subscribe((data) => {
          this.setQuestionnaire(data);
          this.setStep('fl-editor');
        });
      }, ()=>{});
    }
  }

  /**
   * Remove subscriptions before removing the component.
   */
  ngOnDestroy() {
    this.unsubscribe.next();
  }

/////////////////////////////////////////

  /**
   * Set guiding to step to switch the page.
   */
  /*
  setGuidingStep(step: string) {
    // this.guidingStep = step;
    this.formService.autoSave('state', step);
  }
*/
  /**
   * Select form from local file system. Copied from current form builder.
   *
   * @param event - Object having selected file from the browser file dialog.
   */
  onFileSelected(event) {
    const fileReader = new FileReader();
    const selectedFile = event.target.files[0];
    event.target.value = null; //
    fileReader.onload = () => {
      try {
        this.setQuestionnaire(this.formService.parseQuestionnaire(fileReader.result as string));
        setTimeout(() => {
          this.setStep('fl-editor');
        });
      }
      catch (e) {
        this.showError(e);
      }
    }
    fileReader.onerror = (error) => {
      this.showError('Error occurred reading file: ${selectedFile.name}');
    }
    fileReader.readAsText(selectedFile, 'UTF-8');
  }

  showError(error: any) {
    this.formService.showMessage('Error', error.message || error, MessageType.DANGER);
  }

  /**
   * View preview of lforms widget and questionnaire json
   */
  showPreviewDlg() {
    this.matDlg.open(PreviewDlgComponent,
      {data: {
        questionnaire: Util.convertToQuestionnaireJSON(this.formValue),
          lfData: this.lfData},
        width: '80vw', height: '80vh'
      }
    );
  }

  /**
   * Format result item for auto complete.
   * @param acResult - Result item.
   */
  formatter(acResult: any) {
    return acResult.id + ': ' + acResult.title;
  }

  /**
   * Save form to local file, mostly copied from current form builder.
   */
  saveToFile() {
    const content = this.toString(this.questionnaire);
    const blob = new Blob([content], {type: 'application/json;charset=utf-8'});
    const formName = this.questionnaire.title;
    const formShortName = this.questionnaire.name;
    const exportFileName = formShortName ?  formShortName.replace(/\s/g, '-') : (formName ? formName.replace(/\s/g, '-') : 'form');

    // Use hidden anchor to do file download.
    // const downloadLink: HTMLAnchorElement = document.createElement('a');
    const downloadLink = document.getElementById('exportAnchor');
    const urlFactory = (window.URL || window.webkitURL);
    if(this.objectUrl != null) {
      // First release any resources on existing object url
      urlFactory.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.objectUrl = urlFactory.createObjectURL(blob);
    downloadLink.setAttribute('href', this.objectUrl);
    downloadLink.setAttribute('download', exportFileName + '.R4.json');
    // Avoid using downloadLink.click(), which will display down content in the browser.
    downloadLink.dispatchEvent(new MouseEvent('click'));
  }

  /**
   * Call back to auto complete search.
   * @param term - Search term
   */
  acSearch = (term$: Observable<string>): Observable<AutoCompleteResult []> => {
    return term$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => term.length < 2 ? [] : this.dataSrv.searchForms(term)));
  }

  /**
   * Get questionnaire by id
   * @param questionnaireId - Id of the questionnaire to fetch. If empty, return empty questionnaire.
   */
  getForm(questionnaireId: string) {
    if (!questionnaireId) {
      this.setQuestionnaire(Util.createDefaultForm());
    } else {
      this.dataSrv.getFormData(questionnaireId).subscribe((data) => {
        this.setQuestionnaire(data);
        this.acResult = null;
      });
    }
  }

  /**
   * Change button text based on context
   */
  createButtonLabel(): string {
    let ret = 'Create questions';
    if(this.questionnaire && this.questionnaire.item && this.questionnaire.item.length > 0) {
      ret = 'Edit questions'
    }
    return ret;
  }


  /**
   * Close menu handler.
   */
  newStart() {
    localStorage.clear();
    this.setQuestionnaire(Util.createDefaultForm());
    this.setStep('home');
  }

  /**
   * Import FHIR server menu handler.
   */
  importFromFHIRServer() {
    this.modalService.open(FhirServersDlgComponent, {size: 'lg'}).result.then((result) => {
      if(result) { // Server picked, invoke search dialog.
        this.modalService.open(FhirSearchDlgComponent, {size: 'lg', scrollable: true}).result.then((selected) => {
          if(selected !== false) { // Questionnaire picked, get the item from the server.
            this.fhirService.read(selected).subscribe((resp)=>{
              this.setQuestionnaire(resp);
            });
          }
        });
      }
    }, (reason) => {
      console.error(reason);
    });
  }

  /**
   * Fetch form from FHIR server invoking dialogs for server selection and search for forms.
   */
  fetchFormFromFHIRServer$(): Observable<any> {
    return from(this.modalService.open(FhirServersDlgComponent, {size: 'lg'}).result)
      .pipe(switchMap((result) => {
        if(result) {
          return from(this.modalService.open(FhirSearchDlgComponent, {size: 'lg', scrollable: true}).result);
        }
        else {
          return of(false);
        }
      }), switchMap((selected) => {
        if(selected !== false) {
          return this.fhirService.read(selected);
        }
        else {
          return of(null);
        }
      }));
  }


  /**
   * Create/Update questionnaire on the FHIR server.
   * @param type - 'CREATE' | 'UPDATE'
   */
  exportToServer(type: ExportType) {
    let observer: Observable<any>;
    if(type === 'CREATE') {
      this.modalService.open(FhirServersDlgComponent, {size: 'lg'}).result.then((result) => {
        if (result) { // Server picked, invoke search dialog.
          observer = this.fhirService.create(Util.convertToQuestionnaireJSON(this.formValue), null);
          this.handleServerResponse(observer);
        }
      }, (reason) => {
        console.error(reason);
      });
    }
    else if(type === 'UPDATE') {
      observer = this.fhirService.update(Util.convertToQuestionnaireJSON(this.formValue), null);
      this.handleServerResponse(observer);
    }
  }


  /**
   * Handle FHIR server response after create/update.
   * @param serverResponse - An observable yielding fhir resource.
   */
  handleServerResponse(serverResponse: Observable<fhir.Resource>) {
    serverResponse.pipe(
      catchError((err) => {
        console.error(err.message);
        return of(err);
      }),
      finalize(() => {
      })
    )
      .subscribe((response) => {
        const modalRef = this.modalService.open(FhirExportDlgComponent, {size: 'lg', scrollable: true});
        if(response instanceof Error) {
          modalRef.componentInstance.error = response;
          modalRef.componentInstance.serverResponse = null;
        }
        else {
          this.setQuestionnaire(response);
          modalRef.componentInstance.error = null;
          modalRef.componentInstance.serverResponse = response;
        }
      });
  }


  /**
   * Transform questionnaire model to FHIR compliant questionnaire in string format.
   *
   * The questionnaire, although mostly a FHIR questionnaire object, has some internal fields for processing.
   * Get a fully compliant FHIR questionnaire in string format.
   *
   * @param questionnaire - Questionnaire model is in the form builder.
   */
  toString(questionnaire: fhir.Questionnaire): string {
    return this.appJsonPipe.transform(questionnaire);
  }

}