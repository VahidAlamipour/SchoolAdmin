import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DecimalPipe } from "@angular/common";

import { SdkService } from "src/app/services/sdk.service";
import { AuthService } from "src/app/auth/auth.service";
import { NotificationsService } from "src/app/components/notifications/services/notifications.service";

import { IPlagiarismChecker } from "../models/permissions.model";
import { IPlagiarismFeature } from "../../../../../../sdk/interfaces";

@Component({
  selector: "app-permissions",
  templateUrl: "./permissions.component.html",
  styleUrls: ["./permissions.component.css"],
  encapsulation: ViewEncapsulation.None,
})
export class PermissionsComponent implements OnInit {
  constructor(
    private sdk: SdkService,
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private formBuilder: FormBuilder,
    private decimalPipe: DecimalPipe
  ) { }

  public hasPermission: boolean;

  public hasPlagiarismChecker: boolean;
  public permissionsForm: FormGroup;
  public plagiarismCheckerForm: PlagiarismCheckerForm;
  public plagiarismInfo: any;
  private plagiarismFeature: IPlagiarismFeature;

  ngOnInit() {
    this.permissionsForm = this.formBuilder.group({
      isPlagiarismCheckerInactive: [false],
      isDownloadDocumentEnable: false
    });

    this.plagiarismCheckerForm = new PlagiarismCheckerForm({
      general: 'Freezing plagiarism checker will temporarily prevent educators/teachers from using this feature'
    });

    this.getSettings();
  }

  private getSettings(): void {
    //Get all settings function
    //Future: Either get the entire settings in a single call or multiple calls
    //Current: Mutliple calls

    //test API
    // this.sdk.client.testPermissionApi().then((data) => {
    //   console.log(data);
    // });

    //Plagiarism Checker
    this.sdk.client.getPermission().then((data) => {

      this.permissionsForm.patchValue({
        isDownloadDocumentEnable: Boolean(data.downloadStatus)
      })

      this.hasPlagiarismChecker = false;

      if (data.rows) {
        this.hasPlagiarismChecker = true;
        this.plagiarismFeature = data.rows;

        this.permissionsForm.patchValue({
          isPlagiarismCheckerInactive: !data.rows.isActive,
        });
        this.plagiarismCheckerForm.pagesUsedCount = data.rows.pageCount;
        this.plagiarismCheckerForm.totalPages = data.rows.maxPageCount;
        this.plagiarismCheckerForm.pagesLeftCount = data.rows.quotaBalance;
        this.setPlagiarismCheckerMessages();
        this.setPermissionPage();
      }

    });
  }

  public onSubmitFormDetails(value: any) {
    //Submit entire modified settings in a single or multiple calls
    this.sdk.client
      .setPermissions({
        plagiarism: {
          ...this.plagiarismFeature,
          isActive: !value.isPlagiarismCheckerInactive
        },
        downloadDocument: value.isDownloadDocumentEnable
      })
      .then((result) => {
        this.notificationsService.notifyUser({
          message: `Permission settings have been successfully updated.`,
          type: "success",
        });
      });

  }

  private setPermissionPage(): void {
    if (this.hasPlagiarismChecker) {
      this.hasPermission = true;
    }
  }

  //Plagiarism Checker
  private setPlagiarismCheckerMessages(): void {
    this.plagiarismCheckerForm.usageRatio = 100;
    if (this.plagiarismCheckerForm.totalPages != 0) {
      this.plagiarismCheckerForm.usageRatio =
        (this.plagiarismCheckerForm.pagesUsedCount /
          this.plagiarismCheckerForm.totalPages) *
        100;
    }

    this.plagiarismCheckerForm.usageMessage = ` <p>
                                            Total Usage (All Institutions): 
                                            <span class="plagiarism-checker-text-usage">${this.decimalPipe.transform(
      this.plagiarismCheckerForm
        .pagesUsedCount
    )}</span>
                                            /
                                            ${this.decimalPipe.transform(
      this.plagiarismCheckerForm
        .totalPages
    )}
                                            pages
                                          </p>`;

    this.plagiarismCheckerForm.contactEmail = "contact@beed.world";
    // this.plagiarismCheckerForm.pagesLeftCount =
    //   this.plagiarismCheckerForm.totalPages -
    //   this.plagiarismCheckerForm.pagesUsedCount;

    this.plagiarismCheckerForm.message = `<span>
                                        You have ${this.decimalPipe.transform(
      this.plagiarismCheckerForm
        .pagesLeftCount
    )} pages left.
                                        Contact BeED at <a class="plagiarism-checker-text-email" href="mailto:${this.plagiarismCheckerForm
        .contactEmail
      }">${this.plagiarismCheckerForm.contactEmail
      }</a> to top up now.
                                      </span>`;
  }
}

class PlagiarismCheckerForm implements IPlagiarismChecker {
  message: string;
  usageMessage: string;
  usageRatio: number;
  totalPages: number;
  pagesUsedCount: number;
  pagesLeftCount: number;
  contactEmail: string;
  info: any;

  constructor(info: any) {
    this.info = info;
  }
}
