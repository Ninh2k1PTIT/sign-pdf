import { Component, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  src: string = '';
  thumbnails: any = [];
  files: any[] = [];
  totalPages: number = 0;
  pageNumber: number = 0;
  fileNumber: number = 0;
  scale: any = 'auto';
  scaleOptions = [
    'auto',
    'page-actual',
    'page-fit',
    'page-width',
    '50%',
    '100%',
    '125%',
    '150%',
    '200%',
    '300%',
    '400%',
  ];

  previousItem!: HTMLElement;

  constructor(
    private modalService: NgbModal,
    private pdfService: NgxExtendedPdfViewerService
  ) {}

  async inputFile(ev: any) {
    this.files = [];
    for (const file of ev.target.files) {
      this.files.push(await this.readFile(file));
    }
    this.src = this.files[0].data;
  }

  readFile(
    file: File
  ): Promise<{ name: string; data: string | ArrayBuffer | null }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.onerror = (error) => reject(error);
    });
  }

  fileChange(fileNumber: number) {
    if (this.fileNumber != fileNumber) {
      this.fileNumber = fileNumber;
      this.src = this.files[fileNumber].data;
    }
  }

  async renderThumbnails() {
    this.thumbnails = [];
    for (let i = 0; i < this.totalPages; i++) {
      await this.pdfService
        .getPageAsImage(i + 1, { width: 1, height: 1, scale: 0.1 })
        .then((data) => {
          this.thumbnails.push(data);
        });
    }
  }

  pdfLoaded(pdf: PdfLoadedEvent) {
    this.totalPages = pdf.pagesCount;
    this.pageNumber = 1;
    this.renderThumbnails();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber += 1;
      this.scrollToPage(this.pageNumber);
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber -= 1;
      this.scrollToPage(this.pageNumber);
    }
  }

  scrollToPage(pageNumber: number) {
    document
      .getElementById(pageNumber - 1 + '')
      ?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }

  openSignaturePad(modal: any) {
    this.modalService.open(modal, { size: 'xl' });
  }
}
