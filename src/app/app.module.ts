import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { FormsModule } from '@angular/forms';
import { SignaturePadComponent } from './signature-pad/signature-pad.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { SignatureModule } from '@syncfusion/ej2-angular-inputs';
import { ToolbarModule } from '@syncfusion/ej2-angular-navigations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularDraggableModule } from 'angular2-draggable';

@NgModule({
  declarations: [AppComponent, SignaturePadComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxExtendedPdfViewerModule,
    FormsModule,
    CommonModule,
    ToolbarModule,
    SignatureModule,
    ButtonModule,
    NgbModule,
    NgSelectModule,
    AngularDraggableModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
