import {Component, Inject, OnInit} from '@angular/core';
import {SdkService} from '../../../services/sdk.service';
import {IProfile} from '../../../../../../sdk/interfaces';
import {DOCUMENT} from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  public profile: IProfile;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private sdk: SdkService
  ) { }

  async ngOnInit(): Promise<void> {
    this.profile = await this.sdk.client.getProfile();
    console.log(this.profile);
  }

  public changePassword() {
    this.document.location.href = this.profile.changePassUrl;
  }

}
