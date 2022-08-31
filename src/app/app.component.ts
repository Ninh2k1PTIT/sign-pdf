import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PdfLoadedEvent } from 'ngx-extended-pdf-viewer';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import { forkJoin, from, map } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  @ViewChild('item') d1!: ElementRef;
  src: string = '';
  files: any = [];
  totalPages: number = 0;
  pageNumber: number = 0;
  choice: number = 0;
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

  constructor(private modalService: NgbModal) {
    GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
  }

  inputFile(ev: any) {
    this.files = [];
    let observables = [];
    for (const file of ev.target.files) {
      observables.push(this.readFile(file));
    }

    let source = forkJoin(observables);
    source.subscribe((data) => {
      this.files = data;
      this.src = this.files[0].data;
    });
  }

  readFile(
    file: any
  ): Promise<{ name: string; data: string | ArrayBuffer | null }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.onerror = (error) => reject(error);
    });
  }

  pdfLoaded(pdf: PdfLoadedEvent) {
    this.totalPages = pdf.pagesCount;
    this.pageNumber = 1;
    this.getPdfThumbnail(this.src, this.totalPages);
  }

  getPdfThumbnail(pdfUrl: any, totalPage: number) {
    getDocument(pdfUrl).promise.then((pdf) => {
      let pagesPdf = [];
      for (let i = 0; i < totalPage; i++) {
        pagesPdf.push(pdf.getPage(i + 1));
      }
      forkJoin(pagesPdf).subscribe((pages) => {
        let canvasTags = [];
        for (let page of pages) {
          const canvas = document.createElement('canvas');
          const viewport = page.getViewport({ scale: 0.13 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvasTags.push(
            from(
              page.render({
                canvasContext: canvas.getContext(
                  '2d'
                ) as CanvasRenderingContext2D,
                viewport,
              }).promise
            ).pipe(map(() => canvas))
          );
        }
        forkJoin(canvasTags).subscribe((tags) => {
          for (let [index, value] of tags.entries()) {
            value.id = index.toString();
            value.style.marginTop = '10px';
            value.addEventListener('click', (ev) => {
              const target = ev.target as HTMLTextAreaElement;
              this.pageNumber = parseInt(target.id) + 1;
              this.thumbnailsStyleChange(this.pageNumber);
            });
            this.d1.nativeElement.appendChild(value);
            let foo = document.createElement('div');
            foo.innerHTML = index + 1 + '';
            this.d1.nativeElement.appendChild(foo);
          }
          this.previousItem = document.getElementById('0')!;
          this.previousItem.className = 'selected';
        });
      });
    });
  }

  fileChange(fileIndex: number) {
    if (this.choice != fileIndex) {
      this.choice = fileIndex;
      this.src = this.files[fileIndex].data;
    }
  }

  pageChange(pageIndex: number) {
    this.thumbnailsStyleChange(pageIndex);
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber += 1;
      this.thumbnailsStyleChange(this.pageNumber);
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber -= 1;
      this.thumbnailsStyleChange(this.pageNumber);
    }
  }

  thumbnailsStyleChange(currentPage: number) {
    this.previousItem.className = '';
    this.previousItem = document.getElementById(currentPage - 1 + '')!;
    this.previousItem.scrollIntoView({ behavior: 'auto', block: 'center' });
    this.previousItem.className = 'selected';
  }

  openSignpad(modal: any) {
    const modalRef = this.modalService.open(modal, { size: 'xl' });
  }
}
