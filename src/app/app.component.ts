import {
  ChangeDetectorRef,
  Component,
  HostListener,
  ViewEncapsulation,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';
import { PageRenderEvent } from 'ngx-extended-pdf-viewer/lib/events/page-render-event';
import { PdfFile } from 'src/models/PdfFile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class AppComponent {
  src: string | ArrayBuffer | null = '';
  totalPages: number = 0;
  pageNumber: number = 0;
  fileNumber: number = 0;
  scaleOptions = [0.5, 1, 1.25, 1.5, 2, 3, 4];
  scale = this.scaleOptions[1];
  openSignature = false;
  signatureImage = '';
  list: PdfFile[] = [];
  handTool = true;
  count = 0;

  constructor(
    private modalService: NgbModal,
    private pdfService: NgxExtendedPdfViewerService,
    private changeDetection: ChangeDetectorRef
  ) {}

  async inputFile(ev: any) {
    for (const file of ev.target.files) {
      this.list.push(await this.readFile(file));
    }
    this.src = this.list[0].data;
    this.pageNumber = 1;
  }

  readFile(file: File): Promise<PdfFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({
          name: file.name,
          data: reader.result,
          thumbnails: [],
          signatures: [],
        });
      reader.onerror = (error) => reject(error);
    });
  }

  fileChange(fileNumber: number) {
    if (this.fileNumber != fileNumber) {
      this.fileNumber = fileNumber;
      this.pageNumber = 1;
      this.src = this.list[fileNumber].data;
    }
  }

  async renderThumbnails() {
    let currentSize = this.list[this.fileNumber].thumbnails.length;
    if (currentSize < this.totalPages)
      for (let i = currentSize; i < this.totalPages; i++) {
        await this.pdfService
          .getPageAsImage(i + 1, { width: 1, height: 1, scale: 0.1 })
          .then((data) => {
            this.list[this.fileNumber].thumbnails.push(data);
          });
      }
  }

  pdfLoaded(pdf: PdfLoadedEvent) {
    this.totalPages = pdf.pagesCount;
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

  //Chỉ hoạt động khi tạo chữ ký
  @HostListener('document:mousemove', ['$event'])
  mousemove(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'flex';
      drag.style.top = event.clientY - drag.offsetHeight / 2 + 'px';
      drag.style.left = event.clientX - drag.offsetWidth / 2 + 'px';
    }
  }

  //Chỉ hoạt động khi tạo chữ ký
  @HostListener('document:mousedown', ['$event'])
  mousedown(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;
    }
  }

  openSignaturePad(modal: any) {
    this.modalService.open(modal, { size: 'xl' });
  }

  setSignature(ev: any) {
    //Khi tạo đc chữ ký thì mới hiện thả chữ ký
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;

      //Bấm vào trang pdf mới gắn đc chữ ký
      if (ev.target?.tagName === 'CANVAS') {
        let canvasWrapper = ev.target.parentElement as HTMLElement;
        let page = canvasWrapper.parentElement as HTMLElement;
        let signatureInfo = {
          id: this.count++,
          pageNumber: parseInt(page.getAttribute('data-page-number') || ''),
          x: ev.offsetX - 125,
          y: ev.offsetY - 50,
          width: 250,
          height: 100,
          fontSize: 11,
          srcImg: this.signatureImage,
        };

        const boundaryLimit = 5;
        const borderSignature = 2;

        //Ảnh chữ ký
        let img = document.createElement('img') as HTMLImageElement;
        img.src = signatureInfo.srcImg;
        img.width = signatureInfo.width / 2;
        img.height = signatureInfo.height;

        //Thẻ bọc thông tin
        let wrap = document.createElement('div') as HTMLDivElement;
        wrap.className = 'wrap';
        wrap.style.fontSize = signatureInfo.fontSize + 'px';
        wrap.style.width = signatureInfo.width / 2 + 'px';
        wrap.style.height = signatureInfo.height + 'px';

        //Thẻ ghi thông tin
        let info = document.createElement('div') as HTMLDivElement;
        info.className = 'info';
        wrap.innerHTML =
          '<div>Ký bởi: Nguyễn Việt Hưng</div><div>Tên tổ chức: CMC CIST</div><div>Thư điện tử: nguyentienhaininh@gmail.com</div><div>Ngày ký: 11/10/2022</div>';

        //Thẻ chữ ký = Thẻ ảnh + Thẻ bọc
        let signature = document.createElement('div');
        signature.className = 'signature';
        if (signatureInfo.x < boundaryLimit) {
          signatureInfo.x = boundaryLimit;
        } else if (
          signatureInfo.x >
          canvasWrapper.offsetWidth -
            signatureInfo.width -
            boundaryLimit -
            borderSignature * 2
        ) {
          signatureInfo.x =
            canvasWrapper.offsetWidth -
            boundaryLimit -
            borderSignature * 2 -
            signatureInfo.width;
        }

        if (signatureInfo.y < boundaryLimit) {
          signatureInfo.y = boundaryLimit;
        } else if (
          signatureInfo.y >
          canvasWrapper.offsetHeight -
            signatureInfo.height -
            boundaryLimit -
            borderSignature * 2
        ) {
          signatureInfo.y =
            canvasWrapper.offsetHeight -
            boundaryLimit -
            borderSignature * 2 -
            signatureInfo.height;
        }

        signature.style.left = signatureInfo.x + 'px';
        signature.style.top = signatureInfo.y + 'px';
        signature.style.border = `${borderSignature}px solid #008fd3`;

        //Thẻ Resize
        let resizable = document.createElement('div') as HTMLDivElement;
        resizable.className = 'resizable';

        //Thẻ Close
        let close = document.createElement('div') as HTMLDivElement;
        close.className = 'close';

        //Hàm di chuyển chữ ký
        let move = (event: MouseEvent) => {
          let canvasWrapper1 = signature.parentElement as HTMLElement;
          let page1 = canvasWrapper1.parentElement as HTMLElement;

          this.handTool = false;
          let shiftX = event.clientX - signature.getBoundingClientRect().left;
          let shiftY = event.clientY - signature.getBoundingClientRect().top;
          canvasWrapper1.append(signature);

          // moves the signature at (pageX, pageY) coordinates
          // taking initial shifts into account
          let moveAt = (pageX: number, pageY: number) => {
            const left =
              pageX - shiftX - canvasWrapper1.getBoundingClientRect().left;
            const top =
              pageY - shiftY - canvasWrapper1.getBoundingClientRect().top;
            if (
              left >= boundaryLimit &&
              left <=
                canvasWrapper1.offsetWidth -
                  signature.offsetWidth -
                  boundaryLimit
            ) {
              signature.style.left =
                pageX -
                shiftX -
                canvasWrapper1.getBoundingClientRect().left +
                'px';
              this.list[this.fileNumber].signatures
                .filter((i) => i.id === signatureInfo.id)
                .map((j) => {
                  j.x = left;
                  return j;
                });
            }

            let currentPage = parseInt(page1.getAttribute('data-page-number')!);

            if (
              top >= canvasWrapper1.offsetHeight + 10 &&
              currentPage != this.totalPages
            ) {
              canvasWrapper1.removeEventListener('mousemove', onMouseMove);
              currentPage += 1;
              page1 = document.querySelector(
                `[data-page-number="${currentPage}"]`
              )!;

              canvasWrapper1 = page1.firstChild as HTMLElement;
              signature.style.top = '0px';
              canvasWrapper1.appendChild(signature);
              canvasWrapper1.addEventListener('mousemove', onMouseMove);
            } else if (top < 0 && currentPage != 1) {
              canvasWrapper1.removeEventListener('mousemove', onMouseMove);
              currentPage -= 1;
              page1 = document.querySelector(
                `[data-page-number="${currentPage}"]`
              )!;
              canvasWrapper1 = page1.firstChild as HTMLElement;
              signature.style.top = canvasWrapper1.offsetHeight - top + 'px';
              canvasWrapper1.appendChild(signature);
              canvasWrapper1.addEventListener('mousemove', onMouseMove);
            } else
              signature.style.top =
                pageY -
                shiftY -
                canvasWrapper1.getBoundingClientRect().top +
                'px';
            this.list[this.fileNumber].signatures
              .filter((i) => i.id === signatureInfo.id)
              .map((j) => {
                j.y = top;
                j.pageNumber = currentPage;
                return j;
              });
          };

          let onMouseMove = (event: MouseEvent) => {
            moveAt(event.pageX, event.pageY);
          };
          moveAt(event.pageX, event.pageY);
          // move the signature on mousemove
          canvasWrapper1.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mousemove', onMouseMove);

          // drop the signature, remove unneeded handlers
          document.onmouseup = () => {
            this.list[this.fileNumber].signatures
              .filter((i) => i.id === signatureInfo.id)
              .map((j) => {
                if (
                  j.y >
                  canvasWrapper1.offsetHeight -
                    j.height -
                    borderSignature * 2 -
                    boundaryLimit
                ) {
                  j.y =
                    canvasWrapper1.offsetHeight -
                    j.height -
                    borderSignature * 2 -
                    boundaryLimit;
                } else if (j.y < boundaryLimit) j.y = boundaryLimit;
                signature.style.top = j.y + 'px';

                return j;
              });
            this.changeDetection.detectChanges();

            this.handTool = true;
            canvasWrapper1.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousemove', onMouseMove);
          };
        };

        //Hàm resize chữ kỹ
        let resize = (event: MouseEvent) => {
          let canvasWrapper1 = signature.parentElement as HTMLElement;
          this.handTool = false;
          const startY = event.clientY,
            startX = event.clientX,
            signatureStartWidth = signature.offsetWidth,
            signatureStartHeight = signature.offsetHeight,
            imgStartWidth = img.offsetWidth,
            imgStartHeight = img.offsetHeight,
            wrapStartWidth = wrap.offsetWidth,
            wrapStartHeight = wrap.offsetHeight;
          let onMouseMove = (event: MouseEvent) => {
            const width =
                signatureStartWidth +
                event.clientX -
                startX -
                borderSignature * 2,
              height =
                signatureStartHeight +
                event.clientY -
                startY -
                borderSignature * 2;
            if (width >= 100 && width <= 700) {
              signature.style.width = width + 'px';
              img.style.width =
                imgStartWidth + (event.clientX - startX) / 2 + 'px';
              wrap.style.width =
                wrapStartWidth + (event.clientX - startX) / 2 + 'px';
            }
            if (height >= 50 && height <= 350) {
              signature.style.height = height + 'px';
              img.style.height = imgStartHeight + event.clientY - startY + 'px';
              wrap.style.height =
                wrapStartHeight + event.clientY - startY + 'px';
            }
            const newHeight = parseInt(signature.style.height.split('px')[0]);
            const newWidth = parseInt(signature.style.width.split('px')[0]);
            const ratio =
              (newHeight * newWidth) /
              (signatureInfo.width * signatureInfo.height); //Tỉ lệ diện tích mới/cũ
            let fontSize = 0;

            if (ratio > 1)
              fontSize = signatureInfo.fontSize * (0.75 + 0.25 * ratio);
            else fontSize = signatureInfo.fontSize * (0.3 + 0.7 * ratio);

            wrap.style.fontSize = fontSize + 'px';

            this.list[this.fileNumber].signatures
              .filter((i) => i.id === signatureInfo.id)
              .map((j) => {
                j.width = newWidth;
                j.height = newHeight;
                j.fontSize = fontSize;
                return j;
              });
          };
          canvasWrapper1.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mousemove', onMouseMove);
          document.onmouseup = () => {
            this.list[this.fileNumber].signatures
              .filter((i) => i.id === signatureInfo.id)
              .map((j) => {
                if (
                  j.y >
                    canvasWrapper1.offsetHeight -
                      j.height -
                      borderSignature * 2 -
                      boundaryLimit &&
                  j.y < canvasWrapper1.offsetHeight + 10
                ) {
                  j.y =
                    canvasWrapper1.offsetHeight -
                    j.height -
                    borderSignature * 2 -
                    boundaryLimit;
                } else if (j.y < boundaryLimit) j.y = 5;

                if (
                  j.x >
                  canvasWrapper1.offsetWidth -
                    j.width -
                    borderSignature * 2 -
                    boundaryLimit
                )
                  j.x =
                    canvasWrapper1.offsetWidth -
                    j.width -
                    borderSignature * 2 -
                    boundaryLimit;
                signature.style.top = j.y + 'px';
                signature.style.left = j.x + 'px';

                return j;
              });
            this.handTool = true;
            canvasWrapper1.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousemove', onMouseMove);
            resizable.onmouseup = null;
          };
        };

        //Hàm xóa chữ ký
        let remove = () => {
          let i = this.list[this.fileNumber].signatures.findIndex(
            (x) => x.id == signatureInfo.id
          );
          this.list[this.fileNumber].signatures.splice(i, 1);
          signature.remove();
        };

        //Gắn event
        img.addEventListener('mousedown', move);
        wrap.addEventListener('mousedown', move);
        resizable.addEventListener('mousedown', resize);
        close.addEventListener('click', remove);

        signature.ondragstart = function () {
          return false;
        };

        //Gắn các thẻ
        wrap.appendChild(info);
        signature.appendChild(img);
        signature.appendChild(wrap);
        signature.appendChild(resizable);
        signature.appendChild(close);
        canvasWrapper.appendChild(signature);
        this.list[this.fileNumber].signatures.push({
          ...signatureInfo,
          html: signature,
        });
      }
    }
  }

  setSignatureImage(ev: any) {
    this.signatureImage = ev;
    this.openSignature = true;
  }

  selectSignature(
    fileNumber: number,
    pageNumber: number,
    signatureIndex: number
  ) {
    this.fileChange(fileNumber);
    this.pageNumber = pageNumber;
    this.scrollToPage(this.pageNumber);
  }

  hasSignature(fileNumber: number, pageNumber: number) {
    return this.list[fileNumber].signatures.some(
      (x) => x.pageNumber == pageNumber
    );
  }

  pageRender(ev: PageRenderEvent) {
    let canvas = ev.source.canvas as HTMLElement;
    let canvasWrapper = canvas.parentElement;
    let signatures = this.list[this.fileNumber].signatures.filter(
      (x) => x.pageNumber == ev.pageNumber
    );

    for (const signature of signatures)
      canvasWrapper?.appendChild(signature.html!);
  }
}
