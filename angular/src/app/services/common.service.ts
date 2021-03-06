import { Injectable } from '@angular/core';
import {Subject} from "rxjs/index";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class CommonService {

  public isLoggedIn: boolean = false;
  public chooseAccount$ = new Subject();

  constructor(
    private http: HttpClient
  ) { }

  copyText(val: string){
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  getManifest() {
    return this.http.get('../../../manifest.json');
  }

}
