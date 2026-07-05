import { Component, ElementRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService, ChatbotConfig, DaySchedule, defaultSchedule, configToDb, CONFIG_DEFAULTS } from './session.service';
import { SupabaseClientService } from './supabase.client';
import { ChatbotAuthService } from './auth.service';
import { FocusTrapDirective } from './focus-trap.directive';

interface Faq { q: string; a: string; }

/** URL del Worker de Vectis (mismo que usa el widget). */
const WORKER_URL = 'https://chatbot.vectisauto.workers.dev';

/**
 * /ai-chatbot/configure — Onboarding/edición del chatbot.
 *  - Usuario nuevo: formulario; el widget aparece al guardar.
 *  - Usuario con chatbot: muestra el widget (copiar/pegar) y debajo el formulario
 *    pre-cargado para editar.
 * Incluye vista previa en vivo + barra de progreso por secciones.
 */
@Component({
  selector: 'app-chatbot-configure',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent, FocusTrapDirective],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>
        <main class="content">

      <section class="cfg">
        <div class="glow" aria-hidden="true"></div>
        <div class="container inner">

          @if (step() === 'done') {
            <div class="success">
              @if (!s.subscriptionActive()) {
                <div class="paused-banner" role="status">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 9v6M14 9v6"/></svg>
                  {{ 'AICHATBOT.CONFIGURE.PAUSED' | translate }}
                </div>
              } @else if (returning() && !s.currentActive()) {
                <div class="paused-banner" role="status">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 9v6M14 9v6"/></svg>
                  {{ 'AICHATBOT.CONFIGURE.INACTIVE_BOT' | translate }}
                  <a routerLink="/ai-chatbot/manage">{{ 'AICHATBOT.CONFIGURE.MANAGE_LINK' | translate }}</a>
                </div>
              }
              @if (returning()) {
                <div class="check widget" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg></div>
                <span class="eyebrow on-dark">{{ 'AICHATBOT.CONFIGURE.WIDGET_EYEBROW' | translate }}</span>
                <h1 class="ttl">{{ 'AICHATBOT.CONFIGURE.WIDGET_TITLE' | translate }}</h1>
                <p class="lead on-dark">{{ 'AICHATBOT.CONFIGURE.WIDGET_SUBTITLE' | translate:{ company: s.currentCompany() } }}</p>
              } @else {
                <div class="check" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
                <span class="eyebrow on-dark">{{ 'AICHATBOT.CONFIGURE.EYEBROW' | translate }}</span>
                <h1 class="ttl">{{ 'AICHATBOT.CONFIGURE.TITLE' | translate }}</h1>
                <p class="lead on-dark">{{ 'AICHATBOT.CONFIGURE.SUBTITLE' | translate }}</p>
              }
              <div class="panel">
                <div class="panel-head">
                  <span>{{ 'AICHATBOT.CONFIGURE.SNIPPET_LABEL' | translate }}</span>
                  <button type="button" class="copy" (click)="copy()">{{ (copied() ? 'AICHATBOT.CONFIGURE.COPIED' : 'AICHATBOT.CONFIGURE.COPY') | translate }}</button>
                </div>
                <pre class="code"><code>{{ snippet }}</code></pre>
              </div>
              @if (!returning()) {
                <ol class="steps">
                  <li><span class="n">1</span>{{ 'AICHATBOT.CONFIGURE.STEP1' | translate }}</li>
                  <li><span class="n">2</span>{{ 'AICHATBOT.CONFIGURE.STEP2' | translate }}</li>
                  <li><span class="n">3</span>{{ 'AICHATBOT.CONFIGURE.STEP3' | translate }}</li>
                </ol>
                <div class="actions">
                  <a class="go" routerLink="/ai-chatbot/dashboard">{{ 'AICHATBOT.CONFIGURE.GO_PANEL' | translate }}</a>
                  @if (s.canAddCompany()) {
                    <button type="button" class="go ghost" (click)="startNew()">{{ 'AICHATBOT.CONFIGURE.CONFIGURE_ANOTHER' | translate }}</button>
                  }
                </div>
              }
            </div>
          }

          @if (showForm()) {
            @if (returning()) {
              <header class="head edit">
                <h2 class="ttl sm">{{ 'AICHATBOT.CONFIGURE.EDIT_TITLE' | translate }}</h2>
                <p class="lead on-dark">{{ 'AICHATBOT.CONFIGURE.EDIT_SUBTITLE' | translate }}</p>
              </header>
            } @else {
              <header class="head">
                <span class="eyebrow on-dark">{{ 'AICHATBOT.ONBOARD.EYEBROW' | translate }}</span>
                <h1 class="ttl">{{ 'AICHATBOT.ONBOARD.TITLE' | translate }}</h1>
                <p class="lead on-dark">{{ 'AICHATBOT.ONBOARD.SUBTITLE' | translate }}</p>
              </header>
              <div class="callout">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <p>{{ 'AICHATBOT.ONBOARD.INTEGRATION_NOTE' | translate }}</p>
              </div>
              <div class="callout warn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 2 22h20L12 2z"/><path d="M12 9v5M12 18h.01"/></svg>
                <p>{{ 'AICHATBOT.ONBOARD.MODERATION_NOTE' | translate }}</p>
              </div>
            }

            <!-- Barra de progreso por secciones -->
            <div class="progress" role="status" aria-live="polite">
              <div class="progress-top">
                <span>{{ 'AICHATBOT.ONBOARD.PROGRESS' | translate:{ done: sectionsDone(), total: 4 } }}</span>
                <span class="pct">{{ progressPct() }}%</span>
              </div>
              <div class="bar"><span [style.width.%]="progressPct()"></span></div>
            </div>

            <div class="cfg-grid">
              <form class="form" (ngSubmit)="save()">
                <!-- 1. IDENTIDAD -->
                <div class="acc" [class.ok]="sectionDone(0)" [class.expanded]="isOpen(0)">
                  <button type="button" class="acc-head" (click)="toggle(0)" [attr.aria-expanded]="isOpen(0)">
                    <span class="acc-num">1</span>
                    <span class="acc-title">{{ 'AICHATBOT.ONBOARD.SEC_IDENTITY' | translate }}</span>
                    @if (sectionDone(0)) { <span class="acc-ok" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span> }
                    <svg class="acc-chev" [class.up]="isOpen(0)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  @if (isOpen(0)) {
                  <div class="acc-body">
                  <div class="field">
                    <label for="ob-name">{{ 'AICHATBOT.ONBOARD.COMPANY' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_COMPANY' }"></ng-container>
                    </label>
                    <input id="ob-name" name="company" [ngModel]="company" (ngModelChange)="onCompany($event)" [class.bad]="showErr(0) && !vCompany()" [attr.placeholder]="'AICHATBOT.ONBOARD.COMPANY_PH' | translate" />
                    @if (showErr(0) && !vCompany()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_REQUIRED' | translate }}</p> }
                  </div>
                  <div class="field">
                    <label for="ob-desc">{{ 'AICHATBOT.ONBOARD.DESC' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_DESC' }"></ng-container>
                    </label>
                    <input id="ob-desc" name="desc" [ngModel]="desc" (ngModelChange)="onDesc($event)" [class.bad]="showErr(0) && !vDesc()" [attr.placeholder]="'AICHATBOT.ONBOARD.DESC_PH' | translate" />
                    @if (showErr(0) && !vDesc()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_MIN8' | translate }}</p> }
                  </div>
                  <div class="field">
                    <label for="ob-persona">{{ 'AICHATBOT.ONBOARD.PERSONA' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_PERSONA' }"></ng-container>
                    </label>
                    <textarea id="ob-persona" rows="4" name="persona" [ngModel]="persona" (ngModelChange)="onPersona($event)" [class.bad]="showErr(0) && !vPersona()" [attr.placeholder]="personaPlaceholder()"></textarea>
                    <p class="hintline">{{ 'AICHATBOT.ONBOARD.PERSONA_HINT' | translate }} ({{ persona.trim().length }}/100)</p>
                    @if (showErr(0) && !vPersona()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_MIN100' | translate }}</p> }
                  </div>
                  <div class="acc-nav"><button type="button" class="next" (click)="next(0)">{{ 'AICHATBOT.ONBOARD.NEXT' | translate }}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
                  </div>
                  }
                </div>

                <!-- 2. CONOCIMIENTO -->
                <div class="acc" [class.ok]="sectionDone(1)" [class.expanded]="isOpen(1)">
                  <button type="button" class="acc-head" (click)="toggle(1)" [attr.aria-expanded]="isOpen(1)">
                    <span class="acc-num">2</span>
                    <span class="acc-title">{{ 'AICHATBOT.ONBOARD.SEC_KNOWLEDGE' | translate }}</span>
                    @if (sectionDone(1)) { <span class="acc-ok" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span> }
                    <svg class="acc-chev" [class.up]="isOpen(1)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  @if (isOpen(1)) {
                  <div class="acc-body">
                  <div class="field">
                    <label for="ob-info">{{ 'AICHATBOT.ONBOARD.INFO' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_INFO' }"></ng-container>
                    </label>
                    <textarea id="ob-info" rows="5" name="info" [(ngModel)]="info" [class.bad]="showErr(1) && !vInfo()" [attr.placeholder]="'AICHATBOT.ONBOARD.INFO_PH' | translate"></textarea>
                    <p class="hintline">{{ 'AICHATBOT.ONBOARD.INFO_HINT' | translate }} ({{ info.trim().length }}/200)</p>
                    @if (showErr(1) && !vInfo()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_MIN200' | translate }}</p> }
                  </div>
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.HOURS' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_HOURS' }"></ng-container>
                    </label>
                    @if (showErr(1) && !vSchedule()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_SCHEDULE' | translate }}</p> }
                    <div class="sched">
                      @for (d of schedule(); track d.day) {
                        <div class="sched-row" [class.off]="d.closed">
                          <span class="sched-day">{{ ('AICHATBOT.ONBOARD.DAY_' + d.day) | translate }}</span>
                          <label class="sw">
                            <input type="checkbox" [ngModel]="!d.closed" (ngModelChange)="toggleDay(d, $event)" [ngModelOptions]="{ standalone: true }" />
                            <span class="sw-track"><span class="sw-dot"></span></span>
                            <span class="sw-label">{{ (d.closed ? 'AICHATBOT.ONBOARD.CLOSED' : 'AICHATBOT.ONBOARD.OPEN') | translate }}</span>
                          </label>
                          @if (!d.closed) {
                            <label class="sw sw-24">
                              <input type="checkbox" [ngModel]="is24h(d)" (ngModelChange)="toggle24(d, $event)" [ngModelOptions]="{ standalone: true }" />
                              <span class="sw-track sm"><span class="sw-dot"></span></span>
                              <span class="sw-label">{{ 'AICHATBOT.ONBOARD.ALLDAY' | translate }}</span>
                            </label>
                            @if (!is24h(d)) {
                              <span class="sched-times">
                                <input type="time" [(ngModel)]="d.open" [ngModelOptions]="{ standalone: true }" [attr.aria-label]="'AICHATBOT.ONBOARD.OPENS' | translate" />
                                <span class="dash">–</span>
                                <input type="time" [(ngModel)]="d.close" [ngModelOptions]="{ standalone: true }" [attr.aria-label]="'AICHATBOT.ONBOARD.CLOSES' | translate" />
                              </span>
                            }
                          } @else {
                            <span class="sched-cl">{{ 'AICHATBOT.ONBOARD.CLOSED' | translate }}</span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                  <!-- Contacto del negocio -->
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.CONTACT' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_CONTACT' }"></ng-container>
                    </label>
                    <div class="two">
                      <input name="cphone" type="tel" [(ngModel)]="contactPhone" [attr.placeholder]="'AICHATBOT.ONBOARD.CONTACT_PHONE' | translate" />
                      <input name="cemail" type="email" [(ngModel)]="contactEmail" [attr.placeholder]="'AICHATBOT.ONBOARD.CONTACT_EMAIL' | translate" />
                    </div>
                    <div class="two">
                      <input name="caddr" [(ngModel)]="contactAddress" [attr.placeholder]="'AICHATBOT.ONBOARD.CONTACT_ADDRESS' | translate" />
                      <input name="cname" [(ngModel)]="contactName" [attr.placeholder]="'AICHATBOT.ONBOARD.CONTACT_NAME' | translate" />
                    </div>
                  </div>

                  <div class="two">
                    <div class="field">
                      <label for="ob-agenda">{{ 'AICHATBOT.ONBOARD.AGENDA' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_AGENDA' }"></ng-container>
                      </label>
                      <input id="ob-agenda" name="agenda" [(ngModel)]="urlAgenda" placeholder="https://cal.com/tu-negocio" />
                    </div>
                    <div class="field">
                      <label for="ob-doc">{{ 'AICHATBOT.ONBOARD.DOC' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_DOC' }"></ng-container>
                      </label>
                      <input id="ob-doc" name="doc" [(ngModel)]="urlDoc" [disabled]="!!kbFileName" placeholder="https://docs.google.com/document/d/..." />
                      @if (kbFileName) { <p class="hintline">{{ 'AICHATBOT.ONBOARD.LOCKED_BY_FILE' | translate }}</p> }
                    </div>
                  </div>
                  <div class="field">
                    <label for="ob-web">{{ 'AICHATBOT.ONBOARD.WEBSITE' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_WEBSITE' }"></ng-container>
                    </label>
                    <input id="ob-web" name="web" [(ngModel)]="websiteUrl" placeholder="https://tunegocio.com" />
                    @if (websiteUrl.trim()) {
                      <div class="uprow">
                        <button type="button" class="ghost-btn" [disabled]="studyBusy() || !s.currentClientId()" (click)="studySite()">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
                          {{ 'AICHATBOT.ONBOARD.STUDY_SITE' | translate }}
                        </button>
                        @if (studyBusy()) { <span class="upstate">{{ 'AICHATBOT.ONBOARD.STUDYING' | translate }}</span> }
                        @else if (studyMsg() === 'ok') { <span class="upstate">{{ 'AICHATBOT.ONBOARD.STUDY_OK' | translate }}</span> }
                        @else if (studyMsg() === 'err') { <span class="ferr">{{ 'AICHATBOT.ONBOARD.STUDY_ERR' | translate }}</span> }
                      </div>
                      @if (!s.currentClientId()) { <p class="hintline">{{ 'AICHATBOT.ONBOARD.STUDY_SAVE_FIRST' | translate }}</p> }
                    }
                    <p class="hintline">{{ 'AICHATBOT.ONBOARD.WEBSITE_HINT' | translate }}</p>
                  </div>

                  <!-- Subir documento de conocimiento (PDF / texto) -->
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.KB_FILE' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_KB_FILE' }"></ng-container>
                    </label>
                    @if (kbFileName) {
                      <div class="kbfile">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                        <span class="kbname">{{ kbFileName }}</span>
                        @if (kbFileUrl) { <a [href]="kbFileUrl" target="_blank" rel="noopener">{{ 'AICHATBOT.ONBOARD.VIEW' | translate }}</a> }
                        <button type="button" class="kbx" (click)="removeKb()">{{ 'AICHATBOT.ONBOARD.REMOVE' | translate }}</button>
                      </div>
                    }
                    <div class="uprow">
                      <label class="upbtn" [class.disabled]="kbBusy() || !!urlDoc.trim()">
                        <input type="file" accept=".pdf,.txt,.md" (change)="onKbFile($event)" hidden [disabled]="kbBusy() || !!urlDoc.trim()" />
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        {{ (kbFileName ? 'AICHATBOT.ONBOARD.REPLACE' : 'AICHATBOT.ONBOARD.UPLOAD') | translate }}
                      </label>
                      @if (kbBusy()) { <span class="upstate">{{ 'AICHATBOT.ONBOARD.PROCESSING' | translate }}</span> }
                    </div>
                    @if (kbErr()) { <p class="ferr">{{ kbErr() }}</p> }
                    @if (urlDoc.trim() && !kbFileName) { <p class="hintline">{{ 'AICHATBOT.ONBOARD.LOCKED_BY_URL' | translate }}</p> }
                    @else { <p class="hintline">{{ 'AICHATBOT.ONBOARD.KB_FILE_HINT' | translate }}</p> }
                  </div>

                  <div class="field">
                    <label for="ob-inv">{{ 'AICHATBOT.ONBOARD.INVENTORY' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_INVENTORY' }"></ng-container>
                    </label>
                    <input id="ob-inv" name="inv" [(ngModel)]="inventoryUrl" [disabled]="!!inventoryFileName" placeholder="https://docs.google.com/.../export?format=csv" />
                    @if (inventoryFileName) { <p class="hintline">{{ 'AICHATBOT.ONBOARD.LOCKED_BY_FILE' | translate }}</p> }
                  </div>

                  <!-- Subir base de datos (CSV / Excel) -->
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.INV_FILE' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_INV_FILE' }"></ng-container>
                    </label>
                    @if (inventoryFileName) {
                      <div class="kbfile">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                        <span class="kbname">{{ inventoryFileName }}</span>
                        @if (inventoryFileUrl) { <a [href]="inventoryFileUrl" target="_blank" rel="noopener">{{ 'AICHATBOT.ONBOARD.VIEW' | translate }}</a> }
                        <button type="button" class="kbx" (click)="removeInv()">{{ 'AICHATBOT.ONBOARD.REMOVE' | translate }}</button>
                      </div>
                    }
                    <div class="uprow">
                      <label class="upbtn" [class.disabled]="invBusy() || !!inventoryUrl.trim()">
                        <input type="file" accept=".csv,.tsv,.xlsx,.xls" (change)="onInvFile($event)" hidden [disabled]="invBusy() || !!inventoryUrl.trim()" />
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        {{ (inventoryFileName ? 'AICHATBOT.ONBOARD.REPLACE' : 'AICHATBOT.ONBOARD.UPLOAD') | translate }}
                      </label>
                      @if (invBusy()) { <span class="upstate">{{ 'AICHATBOT.ONBOARD.PROCESSING' | translate }}</span> }
                    </div>
                    @if (invErr()) { <p class="ferr">{{ invErr() }}</p> }
                    @if (inventoryUrl.trim() && !inventoryFileName) { <p class="hintline">{{ 'AICHATBOT.ONBOARD.LOCKED_BY_URL' | translate }}</p> }
                    @else { <p class="hintline">{{ 'AICHATBOT.ONBOARD.INV_FILE_HINT' | translate }}</p> }
                  </div>
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.FAQS' | translate }} <span class="req">*</span></label>
                    <p class="hintline">{{ 'AICHATBOT.ONBOARD.FAQS_HINT' | translate }}</p>
                    @for (f of faqs(); track $index) {
                      <div class="faq">
                        <input [(ngModel)]="f.q" [ngModelOptions]="{ standalone: true }" [attr.placeholder]="'AICHATBOT.ONBOARD.FAQ_Q' | translate" />
                        <input [(ngModel)]="f.a" [ngModelOptions]="{ standalone: true }" [attr.placeholder]="'AICHATBOT.ONBOARD.FAQ_A' | translate" />
                        <button type="button" class="x" (click)="removeFaq($index)" aria-label="Quitar"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                      </div>
                    }
                    <button type="button" class="ghost-btn" (click)="addFaq()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>{{ 'AICHATBOT.ONBOARD.ADD_FAQ' | translate }}</button>
                    @if (showErr(1) && !vFaqs()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_FAQS' | translate }}</p> }
                  </div>
                  <div class="acc-nav"><button type="button" class="next" (click)="next(1)">{{ 'AICHATBOT.ONBOARD.NEXT' | translate }}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
                  </div>
                  }
                </div>

                <!-- 3. APARIENCIA -->
                <div class="acc" [class.ok]="sectionDone(2)" [class.expanded]="isOpen(2)">
                  <button type="button" class="acc-head" (click)="toggle(2)" [attr.aria-expanded]="isOpen(2)">
                    <span class="acc-num">3</span>
                    <span class="acc-title">{{ 'AICHATBOT.ONBOARD.SEC_APPEARANCE' | translate }}</span>
                    @if (sectionDone(2)) { <span class="acc-ok" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span> }
                    <svg class="acc-chev" [class.up]="isOpen(2)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  @if (isOpen(2)) {
                  <div class="acc-body">
                  <div class="two">
                    <div class="field">
                      <label for="ob-title">{{ 'AICHATBOT.ONBOARD.WIDGET_TITLE' | translate }}</label>
                      <input id="ob-title" name="wtitle" [(ngModel)]="widgetTitle" [attr.placeholder]="'AICHATBOT.ONBOARD.WIDGET_TITLE_PH' | translate" />
                    </div>
                    <div class="field">
                      <label for="ob-logo">{{ 'AICHATBOT.ONBOARD.LOGO_URL' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_LOGO' }"></ng-container>
                      </label>
                      <input id="ob-logo" name="logo" [(ngModel)]="brandLogoUrl" placeholder="https://tutienda.com/logo.png" />
                    </div>
                  </div>
                  <div class="two">
                    <div class="field">
                      <label>{{ 'AICHATBOT.ONBOARD.COLOR' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_COLOR' }"></ng-container>
                      </label>
                      <div class="color">
                        <input name="color" [(ngModel)]="brandColor" placeholder="#E7AB2E" />
                        <input type="color" [ngModel]="brandColor || '#E7AB2E'" (ngModelChange)="brandColor = $event" name="colorpick" aria-label="Color" />
                      </div>
                    </div>
                    <div class="field">
                      <label>{{ 'AICHATBOT.ONBOARD.COLOR2' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_COLOR2' }"></ng-container>
                      </label>
                      <div class="color">
                        <input name="color2" [(ngModel)]="secondBrandColor" placeholder="#0A0A0A" />
                        <input type="color" [ngModel]="secondBrandColor || '#0A0A0A'" (ngModelChange)="secondBrandColor = $event" name="colorpick2" aria-label="Color 2" />
                      </div>
                    </div>
                  </div>
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.POSITION' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_POSITION' }"></ng-container>
                    </label>
                    <div class="pos-seg" role="group" [attr.aria-label]="'AICHATBOT.ONBOARD.POSITION' | translate">
                      <button type="button" [class.on]="widgetPosition === 'left'" (click)="widgetPosition = 'left'">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="7.5" cy="16.5" r="2.5" fill="currentColor" stroke="none"/></svg>
                        {{ 'AICHATBOT.ONBOARD.POS_LEFT' | translate }}
                      </button>
                      <button type="button" [class.on]="widgetPosition === 'right'" (click)="widgetPosition = 'right'">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="16.5" cy="16.5" r="2.5" fill="currentColor" stroke="none"/></svg>
                        {{ 'AICHATBOT.ONBOARD.POS_RIGHT' | translate }}
                      </button>
                    </div>
                  </div>
                  <div class="field">
                    <label for="ob-welcome">{{ 'AICHATBOT.ONBOARD.WELCOME' | translate }}</label>
                    <input id="ob-welcome" name="welcome" [(ngModel)]="welcome" [attr.placeholder]="'AICHATBOT.ONBOARD.WELCOME_PH' | translate" />
                  </div>
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.QUICK' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_QUICK' }"></ng-container>
                    </label>
                    @for (q of quickReplies(); track $index) {
                      <div class="qr">
                        <input [ngModel]="q" (ngModelChange)="setQuick($index, $event)" [ngModelOptions]="{ standalone: true }" [attr.placeholder]="'AICHATBOT.ONBOARD.QUICK_PH' | translate" />
                        <button type="button" class="x" (click)="removeQuick($index)" aria-label="Quitar"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                      </div>
                    }
                    @if (quickReplies().length < quickLimit()) {
                      <button type="button" class="ghost-btn" (click)="addQuick()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>{{ 'AICHATBOT.ONBOARD.ADD_QUICK' | translate }}</button>
                    } @else if (s.plan() === 'basic') {
                      <p class="upgrade">{{ 'AICHATBOT.ONBOARD.QUICK_UPGRADE' | translate }}</p>
                    }
                  </div>
                  <div class="acc-nav"><button type="button" class="next" (click)="next(2)">{{ 'AICHATBOT.ONBOARD.NEXT' | translate }}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
                  </div>
                  }
                </div>

                <!-- 4. AVANZADO -->
                <div class="acc" [class.ok]="sectionDone(3)" [class.expanded]="isOpen(3)">
                  <button type="button" class="acc-head" (click)="toggle(3)" [attr.aria-expanded]="isOpen(3)">
                    <span class="acc-num">4</span>
                    <span class="acc-title">{{ 'AICHATBOT.ONBOARD.SEC_ADVANCED' | translate }}</span>
                    @if (sectionDone(3)) { <span class="acc-ok" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span> }
                    <svg class="acc-chev" [class.up]="isOpen(3)" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  @if (isOpen(3)) {
                  <div class="acc-body">
                  <div class="field">
                    <label>{{ 'AICHATBOT.ONBOARD.ORIGINS' | translate }}
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_ORIGINS' }"></ng-container>
                    </label>
                    @for (o of origins(); track $index) {
                      <input class="mb" [ngModel]="o" (ngModelChange)="setOrigin($index, $event)" [ngModelOptions]="{ standalone: true }" placeholder="https://tutienda.com" />
                    }
                    <p class="hintline">{{ (s.plan() === 'business' ? 'AICHATBOT.ONBOARD.ORIGINS_BIZ' : 'AICHATBOT.ONBOARD.ORIGINS_ONE') | translate }}</p>
                    <p class="hintline warn">{{ 'AICHATBOT.ONBOARD.ORIGINS_ANY' | translate }}</p>
                  </div>
                  <div class="field">
                    <label for="ob-rules">{{ 'AICHATBOT.ONBOARD.RULES' | translate }} <span class="req">*</span>
                      <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_RULES' }"></ng-container>
                    </label>
                    <textarea id="ob-rules" rows="4" name="rules" [(ngModel)]="extraRules" [class.bad]="showErr(3) && !vRules()" [attr.placeholder]="'AICHATBOT.ONBOARD.RULES_PH' | translate"></textarea>
                    <p class="hintline">{{ 'AICHATBOT.ONBOARD.RULES_HINT' | translate }} ({{ extraRules.trim().length }}/100)</p>
                    @if (showErr(3) && !vRules()) { <p class="ferr">{{ 'AICHATBOT.ONBOARD.E_MIN100' | translate }}</p> }
                  </div>
                  <div class="two">
                    <div class="field">
                      <label for="ob-lang">{{ 'AICHATBOT.ONBOARD.LANGUAGE' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_LANGUAGE' }"></ng-container>
                      </label>
                      <select id="ob-lang" name="lang" [(ngModel)]="language">
                        <option value="auto">{{ 'AICHATBOT.ONBOARD.LANG_AUTO' | translate }}</option>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="ob-purl">{{ 'AICHATBOT.ONBOARD.PRIVACY_URL' | translate }}
                        <ng-container [ngTemplateOutlet]="tip" [ngTemplateOutletContext]="{ k: 'AICHATBOT.ONBOARD.TIP_PRIVACY' }"></ng-container>
                      </label>
                      <input id="ob-purl" name="purl" [(ngModel)]="privacyUrl" placeholder="https://tutienda.com/privacidad" />
                    </div>
                  </div>
                  <div class="field">
                    <label for="ob-ptext">{{ 'AICHATBOT.ONBOARD.PRIVACY_TEXT' | translate }}</label>
                    <input id="ob-ptext" name="ptext" [(ngModel)]="privacyText" [attr.placeholder]="'AICHATBOT.ONBOARD.PRIVACY_TEXT_PH' | translate" />
                  </div>
                  </div>
                  }
                </div>

                @if (err()) { <p class="err">{{ 'AICHATBOT.ONBOARD.REQUIRED' | translate }}</p> }
                @if (saveErr()) { <p class="err">{{ saveErr() }}</p> }
                <button type="submit" class="save" [disabled]="saving()">
                  {{ (saving() ? 'AICHATBOT.ONBOARD.SAVING' : (returning() ? 'AICHATBOT.CONFIGURE.SAVE_CHANGES' : 'AICHATBOT.ONBOARD.SAVE')) | translate }}
                </button>
                @if (saved()) { <p class="okmsg" role="status" aria-live="polite">{{ 'AICHATBOT.CONFIGURE.SAVED' | translate }}</p> }

                @if (returning() && dbId) {
                  <div class="del-zone">
                    <button type="button" class="ghost-btn lg" [disabled]="togglingStatus()" (click)="toggleActive()">
                      @if (s.currentActive()) {
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        {{ 'AICHATBOT.CONFIGURE.DEACTIVATE_BOT' | translate }}
                      } @else {
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l14 9-14 9V3z"/></svg>
                        {{ 'AICHATBOT.CONFIGURE.ACTIVATE_BOT' | translate }}
                      }
                    </button>
                    <button type="button" class="del-btn" (click)="confirmDelete.set(true)">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      {{ 'AICHATBOT.CONFIGURE.DELETE_BOT' | translate }}
                    </button>
                  </div>
                  @if (statusErr()) { <p class="err" role="alert">{{ statusErr() }}</p> }
                }
              </form>

              <!-- Vista previa en vivo (réplica real del widget) -->
              <aside class="preview">
                <div class="preview-sticky">
                  <span class="preview-label">{{ 'AICHATBOT.ONBOARD.PREVIEW_LABEL' | translate }}</span>

                  <div class="wchat">
                    <div class="wbar" [style.background]="previewBar()">
                      @if (previewLogo()) {
                        <img class="wava" [src]="previewLogo()" alt="" loading="lazy" decoding="async" />
                      } @else {
                        <span class="wava">{{ previewInitial() }}</span>
                      }
                      <div class="wmeta">
                        <b>{{ previewTitle() }}</b>
                        <span class="won"><i></i> {{ 'AICHATBOT.ONBOARD.PREVIEW_ONLINE' | translate }}</span>
                      </div>
                      <span class="wx" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </span>
                    </div>
                    <div class="wbody">
                      <div class="wb bot">{{ previewWelcome() }}</div>
                      @if (previewQuick().length) {
                        <div class="wchips">
                          @for (q of previewQuick(); track $index) {
                            <span class="wchip" [style.border-color]="previewColor()" [style.color]="previewColor()">{{ q }}</span>
                          }
                        </div>
                      }
                    </div>
                    <div class="winput">
                      <span class="wph">{{ 'AICHATBOT.ONBOARD.PREVIEW_INPUT' | translate }}</span>
                      <span class="wsend" [style.background]="previewBar()" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </span>
                    </div>
                  </div>

                  <div class="wlaunch-row" [class.left]="widgetPosition === 'left'">
                    <span class="wlaunch" [style.background]="previewBar()" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          }
        </div>
      </section>

        </main>
      </div>

      <!-- Confirmar eliminación de chatbot -->
      @if (confirmDelete()) {
        <div class="modal-bg" (click)="confirmDelete.set(false)">
          <div class="modal" role="alertdialog" aria-modal="true" appFocusTrap (dismiss)="confirmDelete.set(false)" (click)="$event.stopPropagation()">
            <div class="warn-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
            <h3>{{ 'AICHATBOT.CONFIGURE.DELETE_TITLE' | translate }}</h3>
            <p>{{ 'AICHATBOT.CONFIGURE.DELETE_BODY' | translate:{ company: s.currentCompany() } }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-ghost-modal" (click)="confirmDelete.set(false)">{{ 'AICHATBOT.CONFIGURE.DELETE_NO' | translate }}</button>
              <button type="button" class="btn-danger-modal" [disabled]="deleting()" (click)="deleteChatbot()">{{ (deleting() ? 'AICHATBOT.ONBOARD.SAVING' : 'AICHATBOT.CONFIGURE.DELETE_YES') | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- tip reutilizable (bombillo + tooltip al hover/focus) -->
    <ng-template #tip let-k="k">
      <span class="tipbulb" tabindex="0" [attr.aria-label]="k | translate">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/></svg>
        <span class="tiptext" role="tooltip">{{ k | translate }}</span>
      </span>
    </ng-template>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; }
    .cfg { position: relative; overflow: hidden; padding: 40px clamp(16px, 4vw, 40px) 80px; }
    .callout { display: flex; align-items: flex-start; gap: 12px; margin: 0 auto 22px; max-width: 820px; padding: 14px 16px;
      border: 1px solid rgba(231,171,46,.4); background: rgba(231,171,46,.08); border-radius: var(--radius-md); }
    .callout svg { color: var(--gold-bright); flex-shrink: 0; margin-top: 1px; }
    .callout p { font-size: 13.5px; line-height: 1.5; color: var(--text-inv); }
    .callout.warn { border-color: rgba(214,69,69,.35); background: rgba(214,69,69,.08); }
    .callout.warn svg { color: #ff8a8a; }
    @media (max-width: 860px) { .layout { flex-direction: column; } }
    .glow { position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 700px; height: 460px; pointer-events: none; background: radial-gradient(closest-side, rgba(231,171,46,.16), transparent 70%); }
    .inner { position: relative; z-index: 1; max-width: 1120px; margin: 0 auto; }
    .head { text-align: center; margin-bottom: 22px; max-width: 780px; margin-left: auto; margin-right: auto; }
    .head.edit { text-align: left; border-top: 1px solid var(--line-light); padding-top: 36px; margin-top: 40px; }
    .ttl { font-size: clamp(30px, 4.4vw, 52px); margin-top: 12px; }
    .ttl.sm { font-size: clamp(24px, 3.4vw, 34px); }
    .head .lead, .success .lead { margin: 14px auto 0; }
    .head.edit .lead { margin-left: 0; }

    /* progreso */
    .progress { max-width: 1120px; margin: 0 auto 18px; }
    .progress-top { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-inv-2); margin-bottom: 8px; }
    .progress .pct { color: var(--gold-bright); font-weight: 700; }
    .bar { height: 7px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold-soft), var(--gold-bright)); transition: width .3s var(--ease); }

    /* layout form + preview */
    .cfg-grid { display: grid; grid-template-columns: minmax(0,1fr) 332px; gap: 26px; align-items: start; }
    .form { display: grid; gap: 14px; min-width: 0; }

    /* acordeón */
    .acc { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); overflow: hidden; transition: border-color var(--dur) var(--ease); }
    .acc.expanded { border-color: rgba(231,171,46,.45); }
    .acc-head { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: transparent; border: none; color: var(--text-inv); font: inherit; padding: 18px 20px; cursor: pointer; }
    .acc-head:hover { background: rgba(255,255,255,.03); }
    .acc-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--text-inv-2); border: 1px solid var(--line-light); }
    .acc.ok .acc-num, .acc.expanded .acc-num { color: var(--gold-bright); border-color: var(--gold-bright); }
    .acc-title { font-size: 14.5px; font-weight: 700; letter-spacing: .01em; }
    .acc-ok { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); }
    .acc-chev { margin-left: auto; color: var(--text-inv-2); transition: transform .2s var(--ease); flex-shrink: 0; }
    .acc-chev.up { transform: rotate(180deg); }
    .acc-body { padding: 4px 20px 20px; }
    .acc-nav { display: flex; justify-content: flex-end; margin-top: 16px; }
    .next { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; font-size: 14px; color: var(--ink);
      padding: 11px 22px; background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 8px 22px rgba(231,171,46,.28); transition: transform var(--dur) var(--ease); }
    .next:hover { transform: translateY(-2px); }

    /* horario por día */
    .sched { display: grid; gap: 8px; }
    .sched-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid var(--line-light); }
    .sched-row:last-child { border-bottom: none; }
    .sched-row.off { opacity: .7; }
    .sched-day { width: 84px; flex-shrink: 0; font-size: 14px; font-weight: 600; }
    .sw { display: inline-flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; }
    .sw input { position: absolute; opacity: 0; width: 0; height: 0; }
    .sw-track { position: relative; width: 38px; height: 22px; border-radius: 999px; background: rgba(255,255,255,.12); transition: background var(--dur) var(--ease); flex-shrink: 0; }
    .sw-dot { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform var(--dur) var(--ease); }
    .sw input:checked + .sw-track { background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); }
    .sw input:checked + .sw-track .sw-dot { transform: translateX(16px); }
    .sw input:focus-visible + .sw-track { box-shadow: 0 0 0 3px rgba(231,171,46,.3); }
    .sw-label { font-size: 13px; color: var(--text-inv-2); width: 58px; }
    .sched-times { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }
    .sched-times input[type=time] { width: auto; padding: 8px 10px; }
    .sched-times .dash { color: var(--text-inv-2); }
    .sched-cl { margin-left: auto; font-size: 13px; color: var(--text-inv-2); }

    .card { background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 24px; transition: border-color var(--dur) var(--ease); }
    .card.ok { border-color: rgba(231,171,46,.4); }
    legend { font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--gold-bright); padding: 0 0 4px; }
    .field { margin-bottom: 16px; }
    .field:last-child { margin-bottom: 0; }
    .field label { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--text-inv-2); margin-bottom: 7px; }
    .req { color: var(--gold-bright); }
    input, textarea, select { width: 100%; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--line-light);
      background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; outline: none; transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
    textarea { resize: vertical; line-height: 1.5; }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,.4); }
    input:focus, textarea:focus, select:focus { border-color: var(--gold-bright); box-shadow: 0 0 0 3px rgba(231,171,46,.2); }
    select option { color: #111; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .mb { margin-bottom: 8px; }
    .color { display: flex; gap: 8px; }
    .color input[type=color] { width: 52px; padding: 4px; flex-shrink: 0; }
    .faq, .qr { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 8px; }
    .faq { grid-template-columns: 1fr 1.3fr auto; }
    .x { background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); border-radius: 9px; cursor: pointer; display: grid; place-items: center; padding: 0 10px; }
    .x:hover { background: rgba(255,255,255,.12); }
    .ghost-btn { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv);
      border-radius: var(--radius-pill); padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
    .ghost-btn:hover { background: rgba(255,255,255,.1); }
    .hintline { font-size: 12px; color: var(--text-inv-2); margin: 4px 0 0; }
    .uprow { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
    .upbtn { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.05); border: 1px dashed var(--line-light); color: var(--text-inv);
      padding: 9px 14px; border-radius: var(--radius-md); font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .15s, border-color .15s; }
    .upbtn:hover { background: rgba(255,255,255,.09); border-color: var(--gold); }
    .upbtn.disabled { opacity: .55; pointer-events: none; }
    .upstate { font-size: 12.5px; color: var(--gold-bright); }
    .kbfile { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; padding: 9px 12px; background: rgba(231,171,46,.08); border: 1px solid rgba(231,171,46,.3); border-radius: var(--radius-md); font-size: 13px; }
    .kbfile svg { color: var(--gold-bright); flex-shrink: 0; }
    .kbname { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .kbfile a { color: var(--gold-bright); text-decoration: underline; font-size: 12.5px; }
    .kbx { background: none; border: none; color: #ff8a8a; cursor: pointer; font-size: 12.5px; font-weight: 600; }
    .hintline.warn { color: var(--gold-soft); }
    .ferr { font-size: 12.5px; color: #ff8a8a; margin: 6px 0 0; }
    input.bad, textarea.bad { border-color: rgba(214,69,69,.6); box-shadow: 0 0 0 3px rgba(214,69,69,.15); }
    .upgrade { font-size: 12.5px; color: var(--gold-soft); margin: 6px 0 0; }
    .err { color: #ff8a8a; font-size: 13px; margin: 0; }
    .okmsg { color: var(--gold-soft); font-size: 13.5px; margin: 6px 0 0; background: rgba(231,171,46,.1); padding: 10px 12px; border-radius: 10px; }
    .save { width: 100%; min-height: 54px; border: none; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; color: var(--ink);
      background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease); }
    .save:hover { transform: translateY(-2px); }

    /* preview */
    .preview-sticky { position: sticky; top: 18px; }
    .preview-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-inv-2); margin-bottom: 12px; }

    /* Réplica real del widget (tema claro, como se ve en el sitio del cliente) */
    .wchat { width: 100%; max-width: 320px; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.45); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    .wbar { display: flex; align-items: center; gap: 10px; padding: 13px 15px; color: #fff; }
    .wava { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; object-fit: cover; background: rgba(255,255,255,.9); color: #111; display: grid; place-items: center; font-weight: 800; font-size: 14px; }
    .wmeta { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
    .wmeta b { font-size: 14.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .won { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; opacity: .92; }
    .won i { width: 7px; height: 7px; border-radius: 50%; background: #34e0a1; box-shadow: 0 0 6px #34e0a1; }
    .wx { margin-left: auto; opacity: .85; flex-shrink: 0; }
    .wbody { padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; min-height: 150px; background: #f6f6f8; }
    .wb { max-width: 86%; padding: 10px 13px; border-radius: 15px; font-size: 13px; line-height: 1.45; }
    .wb.bot { align-self: flex-start; background: #fff; color: #1a1a1a; border: 1px solid #ececf0; border-bottom-left-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
    .wchips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
    .wchip { font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 999px; border: 1px solid; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
    .winput { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid #eee; background: #fff; }
    .wph { flex: 1; font-size: 13px; color: #999; padding: 9px 12px; border: 1px solid #e3e3e8; border-radius: 11px; }
    .wsend { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; }
    .wlaunch-row { display: flex; justify-content: flex-end; max-width: 320px; margin-top: 14px; transition: justify-content .2s; }
    .wlaunch-row.left { justify-content: flex-start; }
    .wlaunch { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 12px 28px rgba(0,0,0,.28); }
    .pos-seg { display: inline-flex; gap: 6px; background: rgba(255,255,255,.04); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 4px; }
    .pos-seg button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: none; background: transparent; color: var(--text-inv-2); font-size: 13.5px; font-weight: 600; border-radius: calc(var(--radius-md) - 4px); cursor: pointer; transition: background .15s, color .15s; }
    .pos-seg button.on { background: var(--gold); color: var(--ink); }
    .win { background: var(--ink-card); border: 1px solid var(--line-light); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.45); }
    .win .bar { display: flex; align-items: center; gap: 9px; padding: 13px 15px; height: auto; border-radius: 0; color: #fff; }
    .win .ava { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,.85); flex-shrink: 0; }
    .win .ava-img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; background: #fff; flex-shrink: 0; }
    .win .bar b { font-size: 14px; font-weight: 700; }
    .win .on { margin-left: auto; font-size: 10.5px; opacity: .9; }
    .win .body { padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; min-height: 150px; }
    .b { max-width: 88%; padding: 10px 13px; border-radius: 14px; font-size: 13px; line-height: 1.45; }
    .b.bot { align-self: flex-start; background: rgba(255,255,255,.07); border: 1px solid var(--line-light); border-bottom-left-radius: 4px; color: var(--text-inv); }
    .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 2px; }
    .chip { font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--gold-bright); color: var(--gold-bright); background: rgba(255,255,255,.02); }
    .win .inp { padding: 12px 15px; border-top: 1px solid var(--line-light); color: rgba(255,255,255,.4); font-size: 12.5px; }

    .tipbulb { position: relative; display: inline-flex; color: var(--gold-bright); cursor: help; opacity: .85; }
    .tipbulb:hover, .tipbulb:focus { opacity: 1; outline: none; }
    .tiptext { position: absolute; bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%);
      width: max-content; max-width: 240px; background: var(--ink-card); color: var(--text-inv); border: 1px solid var(--line-light);
      font-weight: 400; font-size: 12px; line-height: 1.45; padding: 9px 11px; border-radius: 10px; box-shadow: 0 14px 34px rgba(0,0,0,.55);
      opacity: 0; visibility: hidden; transition: opacity .15s var(--ease); z-index: 6; pointer-events: none; white-space: normal; text-align: left; }
    .tiptext::after { content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: var(--ink-card); }
    .tipbulb:hover .tiptext, .tipbulb:focus .tiptext { opacity: 1; visibility: visible; }

    /* success / widget */
    .success { text-align: center; max-width: 780px; margin: 0 auto; }
    .check { width: 70px; height: 70px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 0 40px rgba(231,171,46,.4); }
    .check.widget { background: rgba(231,171,46,.14); border: 1px solid rgba(231,171,46,.4); color: var(--gold-bright); box-shadow: none; }
    .panel { text-align: left; max-width: 640px; margin: 30px auto 0; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); overflow: hidden; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line-light); font-size: 12.5px; color: var(--text-inv-2); }
    .copy { border: 1px solid var(--line-light); background: rgba(255,255,255,.05); color: var(--text-inv); font: inherit; font-size: 12.5px; font-weight: 600; padding: 7px 13px; border-radius: var(--radius-pill); cursor: pointer; }
    .code { margin: 0; padding: 16px; overflow-x: auto; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.7; color: #e7e3d8; white-space: pre; }
    .steps { list-style: none; padding: 0; margin: 28px auto 0; display: grid; gap: 12px; text-align: left; max-width: 560px; }
    .steps li { display: flex; align-items: center; gap: 14px; color: var(--text-inv-2); font-size: 15px; }
    .steps .n { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--gold-bright); border: 1px solid var(--gold-bright); }
    .actions { margin-top: 34px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .go { min-height: 52px; display: inline-flex; align-items: center; padding: 0 30px; border-radius: var(--radius-pill); font-weight: 700; color: var(--ink); background: linear-gradient(135deg, var(--gold-soft), var(--gold-bright)); box-shadow: 0 10px 30px rgba(231,171,46,.3); transition: transform var(--dur) var(--ease); cursor: pointer; border: none; font-size: inherit; }
    .go:hover { transform: translateY(-2px); }
    .go.ghost { background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); box-shadow: none; }
    .go.ghost:hover { background: rgba(255,255,255,.1); }

    .paused-banner { display: inline-flex; align-items: center; gap: 9px; margin: 0 auto 18px; padding: 10px 16px; font-size: 13.5px; font-weight: 600;
      color: #ff8a8a; background: rgba(214,69,69,.1); border: 1px solid rgba(214,69,69,.4); border-radius: var(--radius-pill); }
    .paused-banner a { color: #fff; text-decoration: underline; font-weight: 700; margin-left: 4px; }

    /* eliminar chatbot */
    .del-zone { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--line-light); display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start; }
    .ghost-btn.lg { padding: 10px 18px; font-size: 13.5px; }
    .del-btn { display: inline-flex; align-items: center; gap: 8px; background: rgba(214,69,69,.1); border: 1px solid rgba(214,69,69,.5); color: #ff8a8a;
      border-radius: var(--radius-pill); padding: 10px 18px; font: inherit; font-weight: 600; font-size: 13.5px; cursor: pointer; }
    .del-btn:hover { background: rgba(214,69,69,.2); }
    .modal-bg { position: absolute; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); display: grid; place-items: center; padding: 20px; z-index: 300; }
    .modal { position: relative; width: 100%; max-width: 460px; background: var(--ink-soft); border: 1px solid var(--line-light); border-radius: var(--radius-lg); padding: 28px; box-shadow: 0 30px 80px rgba(0,0,0,.6); text-align: center; }
    .modal h3 { font-size: 20px; margin: 14px 0 8px; }
    .modal p { color: var(--text-inv-2); font-size: 14.5px; line-height: 1.6; }
    .warn-ic { width: 54px; height: 54px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center; color: #ff8a8a; background: rgba(214,69,69,.12); border: 1px solid rgba(214,69,69,.4); }
    .modal-actions { display: flex; gap: 10px; justify-content: center; margin-top: 22px; }
    .btn-ghost-modal { background: rgba(255,255,255,.05); border: 1px solid var(--line-light); color: var(--text-inv); border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 600; padding: 10px 18px; }
    .btn-danger-modal { background: rgba(214,69,69,.14); border: 1px solid rgba(214,69,69,.5); color: #ff8a8a; border-radius: var(--radius-pill); cursor: pointer; font: inherit; font-weight: 700; padding: 10px 18px; }
    .btn-danger-modal:hover { background: rgba(214,69,69,.24); }

    @media (max-width: 1000px) { .cfg-grid { grid-template-columns: 1fr; } .preview { order: -1; } .preview-sticky { position: static; } .wchat, .wlaunch-row { max-width: 360px; } }
    @media (max-width: 600px) { .two, .faq, .qr { grid-template-columns: 1fr; } }
    @media (max-width: 560px) {
      .cfg { padding-top: 26px; padding-bottom: 60px; }
      .acc-head { padding: 15px 15px; gap: 10px; }
      .acc-body { padding: 4px 15px 16px; }
      .acc-title { font-size: 14px; }
      .sched-day { width: 100%; }
      .acc-nav .next { width: 100%; justify-content: center; }
      .del-zone, .modal-actions, .actions { flex-direction: column; }
      .del-zone > *, .actions > * { width: 100%; }
    }
  `],
})
export class ChatbotConfigureComponent implements OnInit {
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private sb = inject(SupabaseClientService).client;
  private auth = inject(ChatbotAuthService);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private i18n = inject(TranslateService);
  readonly s = inject(ChatbotSessionService);

  private scrollToError(): void {
    setTimeout(() => {
      const t = this.host.nativeElement.querySelector('.ferr, input.bad, textarea.bad') as HTMLElement | null;
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 70);
  }

  step = signal<'form' | 'done'>('form');
  returning = signal(false);
  copied = signal(false);
  saved = signal(false);
  saving = signal(false);
  err = signal(false);
  saveErr = signal('');
  confirmDelete = signal(false);
  deleting = signal(false);
  togglingStatus = signal(false);
  statusErr = signal('');
  tried = signal<number[]>([]); // secciones donde se intentó avanzar/guardar (para mostrar errores)

  showForm = computed(() => this.step() === 'form' || this.returning());

  // Identidad
  company = '';
  desc = '';
  persona = '';
  personaTouched = false;
  // Conocimiento
  info = '';
  hours = '';
  schedule = signal<DaySchedule[]>(defaultSchedule());
  contactName = ''; contactPhone = ''; contactEmail = ''; contactAddress = '';
  urlAgenda = '';
  urlDoc = '';
  websiteUrl = '';
  inventoryUrl = '';
  // Base de conocimiento (archivos subidos)
  kbText = ''; kbFileName = ''; kbFileUrl = '';
  inventoryText = ''; inventoryFileName = ''; inventoryFileUrl = '';
  kbBusy = signal(false); kbErr = signal('');
  invBusy = signal(false); invErr = signal('');
  studyBusy = signal(false); studyMsg = signal<'' | 'ok' | 'err'>('');
  faqs = signal<Faq[]>([{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }]);
  // Handoff a humano (se gestiona en su propia página; aquí solo se preservan)
  handoffEnabled = false;
  telegramChatId = '';

  // Apariencia
  widgetTitle = '';
  widgetPosition: 'right' | 'left' = 'right';
  brandColor = '';
  secondBrandColor = '';
  brandLogoUrl = '';
  welcome = '';
  quickReplies = signal<string[]>(['']);
  // Avanzado
  origins = signal<string[]>(['']);
  extraRules = '';
  language = 'auto';
  privacyUrl = '';
  privacyText = '';

  dbId = '';  // id real en la tabla chatbots (para editar)
  quickLimit = computed(() => (this.s.plan() === 'basic' ? 3 : 6));

  constructor() {
    // Al cambiar de chatbot desde el header, recarga la config y el widget del seleccionado.
    effect(() => {
      this.s.current();           // se re-ejecuta al cambiar de chatbot
      if (this.returning()) queueMicrotask(() => this.reloadCurrent());
    });
  }

  private reloadCurrent(): void {
    if (!this.returning() || this.s.companies().length === 0) return;
    this.dbId = this.s.currentClientId();
    this.clientId = this.dbId || this.clientId;
    const cfg = this.s.currentConfig();
    if (cfg) this.loadConfig(cfg);
    this.snippet = this.buildSnippet(this.clientId);
    this.openSection.set(-1);
  }

  // ── Validación por campo ──
  vCompany(): boolean { return this.company.trim().length > 0; }
  vDesc(): boolean { return this.desc.trim().length >= 8; }
  vPersona(): boolean { return this.persona.trim().length >= 100; }
  vInfo(): boolean { return this.info.trim().length >= 200; }
  vSchedule(): boolean { return this.schedule().some((d) => !d.closed); }
  vFaqs(): boolean { return this.faqs().filter((f) => f.q.trim() && f.a.trim()).length >= 3; }
  vOrigins(): boolean { return this.origins().some((o) => o.trim().length > 0); }
  vRules(): boolean { return this.extraRules.trim().length >= 100; }

  /** ¿La sección i tiene todo lo requerido? */
  sectionValid(i: number): boolean {
    switch (i) {
      case 0: return this.vCompany() && this.vDesc() && this.vPersona();
      case 1: return this.vInfo() && this.vSchedule() && this.vFaqs();
      case 2: return true; // apariencia: todo opcional
      case 3: return this.vRules(); // dominios opcionales (vacío = cualquier dominio)
      default: return false;
    }
  }
  /** Primera sección incompleta (hasta ahí puede navegar el usuario). */
  firstInvalid(): number {
    for (let i = 0; i < 4; i++) { if (!this.sectionValid(i)) return i; }
    return 4;
  }
  showErr(i: number): boolean { return this.tried().includes(i); }

  // Acordeón con bloqueo: solo se abre hasta la primera sección incompleta.
  openSection = signal(0);
  isOpen(i: number): boolean { return this.openSection() === i; }
  toggle(i: number): void {
    if (i > this.firstInvalid()) { this.markTried(this.firstInvalid()); return; }
    this.openSection.set(this.openSection() === i ? -1 : i);
  }
  next(i: number): void {
    if (!this.sectionValid(i)) { this.markTried(i); this.scrollToError(); return; }
    this.openSection.set(i + 1);
  }
  private markTried(i: number): void {
    if (!this.tried().includes(i)) this.tried.set([...this.tried(), i]);
  }

  toggleDay(d: DaySchedule, open: boolean): void { d.closed = !open; this.schedule.set([...this.schedule()]); }
  /** ¿El día está marcado como abierto las 24 horas? */
  is24h(d: DaySchedule): boolean { return d.open === '00:00' && d.close === '23:59'; }
  toggle24(d: DaySchedule, on: boolean): void {
    if (on) { d.open = '00:00'; d.close = '23:59'; }
    else { d.open = '09:00'; d.close = '18:00'; }
    this.schedule.set([...this.schedule()]);
  }

  private readonly dayShort: Record<DaySchedule['day'], string> =
    { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' };
  hoursString(): string {
    return this.schedule().map((d) => d.closed ? `${this.dayShort[d.day]}: cerrado` : `${this.dayShort[d.day]}: ${d.open}–${d.close}`).join('; ');
  }

  clientId = this.s.newClientId();
  snippet = '';

  ngOnInit(): void {
    this.title.setTitle('Configura tu chatbot — Vectis AI ChatBot');
    const isNew = this.route.snapshot.queryParamMap.get('new') === '1';

    if (!isNew && this.s.companies().length > 0) {
      this.dbId = this.s.currentClientId();
      this.clientId = this.s.currentClientId() || this.clientId;
      const cfg = this.s.currentConfig();
      if (cfg) this.loadConfig(cfg);
      this.snippet = this.buildSnippet(this.clientId);
      this.openSection.set(-1);   // ya configurado: acordeones cerrados
      this.returning.set(true);
      this.step.set('done');
    } else {
      this.returning.set(false);
      this.step.set('form');
      this.openSection.set(0);
      this.origins.set(this.s.plan() === 'business' ? ['', ''] : ['']);
    }
  }

  buildSnippet(id: string): string {
    return `<script src="https://wearevectis.com/assets/chatbot/widget.js"\n  data-client-id="${id}"\n  defer></script>`;
  }

  // --- Base de conocimiento: subir archivos ---
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-cdn="' + src + '"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.async = true; s.setAttribute('data-cdn', src);
      s.onload = () => resolve(); s.onerror = () => reject(new Error('cdn'));
      document.head.appendChild(s);
    });
  }

  private async extractPdfText(file: File): Promise<string> {
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    const max = Math.min(pdf.numPages, 50);
    for (let i = 1; i <= max; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(' ') + '\n';
      if (text.length > 60000) break;
    }
    return text;
  }

  private async parseSheet(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv' || ext === 'tsv') return await file.text();
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    const XLSX = (window as any).XLSX;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(ws);
  }

  private async uploadToStorage(file: File, kind: 'kb' | 'inv'): Promise<string> {
    const uid = (await this.sb.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('auth');
    const cid = this.s.currentClientId() || 'new';
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${uid}/${cid}/${kind}-${Date.now()}.${ext}`;
    const { error } = await this.sb.storage.from('chatbot-kb').upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    return this.sb.storage.from('chatbot-kb').getPublicUrl(path).data.publicUrl;
  }

  private fileErr(e: any): string {
    const k = e?.message === 'size' ? 'E_FILE_SIZE' : (e?.message === 'empty' ? 'E_FILE_EMPTY' : 'E_FILE');
    return this.i18n.instant('AICHATBOT.ONBOARD.' + k);
  }

  async onKbFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.kbErr.set(''); this.kbBusy.set(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('size');
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      let text = ext === 'pdf' ? await this.extractPdfText(file) : await file.text();
      text = (text || '').replace(/[ \t]+\n/g, '\n').trim();
      if (!text) throw new Error('empty');
      const url = await this.uploadToStorage(file, 'kb');
      this.kbText = text.slice(0, 20000);
      this.kbFileName = file.name;
      this.kbFileUrl = url;
    } catch (e) { this.kbErr.set(this.fileErr(e)); }
    finally { this.kbBusy.set(false); input.value = ''; }
  }

  async onInvFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    this.invErr.set(''); this.invBusy.set(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('size');
      let text = (await this.parseSheet(file) || '').trim();
      if (!text) throw new Error('empty');
      const url = await this.uploadToStorage(file, 'inv');
      this.inventoryText = text.slice(0, 20000);
      this.inventoryFileName = file.name;
      this.inventoryFileUrl = url;
    } catch (e) { this.invErr.set(this.fileErr(e)); }
    finally { this.invBusy.set(false); input.value = ''; }
  }

  removeKb(): void { this.kbText = ''; this.kbFileName = ''; this.kbFileUrl = ''; this.kbErr.set(''); }
  removeInv(): void { this.inventoryText = ''; this.inventoryFileName = ''; this.inventoryFileUrl = ''; this.invErr.set(''); }

  /** Pide al Worker que "estudie" el sitio: rastrea varias páginas y guarda un resumen. */
  async studySite(): Promise<void> {
    const id = this.s.currentClientId();
    if (!id || !this.websiteUrl.trim()) return;
    this.studyBusy.set(true); this.studyMsg.set('');
    try {
      // Guarda la URL actual antes de estudiar (por si la editó sin guardar el formulario).
      await this.sb.from('chatbots').update({ website_url: this.websiteUrl.trim() }).eq('id', id);
      const { data } = await this.sb.auth.getSession();
      const token = data.session?.access_token || '';
      const res = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'study', client_id: id, access_token: token }),
      });
      this.studyMsg.set(res.ok ? 'ok' : 'err');
    } catch { this.studyMsg.set('err'); }
    this.studyBusy.set(false);
  }

  // --- Preview en vivo ---
  previewColor(): string { return this.brandColor?.trim() || '#E7AB2E'; }
  previewColor2(): string { return this.secondBrandColor?.trim() || '#0A0A0A'; }
  previewBar(): string { return `linear-gradient(135deg, ${this.previewColor()}, ${this.previewColor2()})`; }
  previewLogo(): string { return this.brandLogoUrl?.trim() || ''; }
  previewInitial(): string { return (this.previewTitle().trim()[0] || 'A').toUpperCase(); }
  previewTitle(): string { return this.widgetTitle?.trim() || this.company?.trim() || 'Asistente'; }
  previewWelcome(): string { return this.welcome?.trim() || '¡Hola! ¿En qué puedo ayudarte hoy?'; }
  previewQuick(): string[] { return this.quickReplies().filter((q) => q.trim()); }

  // --- Progreso ---
  sectionDone(i: number): boolean { return this.sectionValid(i); }
  sectionsDone(): number { return [0, 1, 2, 3].filter((i) => this.sectionDone(i)).length; }
  progressPct(): number { return Math.round((this.sectionsDone() / 4) * 100); }

  personaPlaceholder(): string {
    const c = this.company.trim() || '{empresa}';
    const d = this.desc.trim() || '{a qué se dedica}';
    return `Eres "Vecto", el asistente virtual de ${c}, que se dedica a ${d}…`;
  }

  // --- Auto-persona (se precarga con nombre + a qué se dedica; el usuario puede editarla) ---
  onCompany(v: string): void { this.company = v; this.syncPersona(); }
  onDesc(v: string): void { this.desc = v; this.syncPersona(); }
  onPersona(v: string): void { this.persona = v; this.personaTouched = true; }
  private syncPersona(): void {
    if (!this.personaTouched && this.company.trim()) this.persona = this.genPersona();
  }
  private genPersona(): string {
    const c = this.company.trim();
    const d = this.desc.trim() || 'atender a sus clientes';
    return `Eres "Vecto", el asistente virtual de ${c}. ${c} se dedica a ${d}. ` +
      `Atiendes con un tono cercano, profesional y resolutivo: respondes dudas, recomiendas productos o servicios, ` +
      `ayudas a agendar y capturas datos de contacto cuando hay interés. Si no sabes algo, lo dices con honestidad ` +
      `y ofreces poner al cliente en contacto con una persona del equipo.`;
  }

  addFaq(): void { this.faqs.set([...this.faqs(), { q: '', a: '' }]); }
  removeFaq(i: number): void { this.faqs.set(this.faqs().filter((_, x) => x !== i)); }

  setQuick(i: number, v: string): void { const a = [...this.quickReplies()]; a[i] = v; this.quickReplies.set(a); }
  addQuick(): void { if (this.quickReplies().length < this.quickLimit()) this.quickReplies.set([...this.quickReplies(), '']); }
  removeQuick(i: number): void { this.quickReplies.set(this.quickReplies().filter((_, x) => x !== i)); }

  setOrigin(i: number, v: string): void { const a = [...this.origins()]; a[i] = v; this.origins.set(a); }

  private gatherConfig(): ChatbotConfig {
    return {
      company: this.company.trim(), desc: this.desc.trim(), persona: this.persona.trim(),
      info: this.info.trim(), hours: this.hoursString(), schedule: this.schedule().map((d) => ({ ...d })),
      contactName: this.contactName.trim(), contactPhone: this.contactPhone.trim(), contactEmail: this.contactEmail.trim(), contactAddress: this.contactAddress.trim(),
      urlAgenda: this.urlAgenda.trim(),
      urlDoc: this.urlDoc.trim(), websiteUrl: this.websiteUrl.trim(), inventoryUrl: this.inventoryUrl.trim(),
      kbText: this.kbText, kbFileName: this.kbFileName, kbFileUrl: this.kbFileUrl,
      inventoryText: this.inventoryText, inventoryFileName: this.inventoryFileName, inventoryFileUrl: this.inventoryFileUrl,
      faqs: this.faqs().filter((f) => f.q.trim() || f.a.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
      // Apariencia: defaults si quedan vacíos
      widgetTitle: this.widgetTitle.trim() || CONFIG_DEFAULTS.widgetTitle,
      widgetPosition: this.widgetPosition === 'left' ? 'left' : 'right',
      brandColor: this.brandColor.trim() || CONFIG_DEFAULTS.brandColor,
      secondBrandColor: this.secondBrandColor.trim() || CONFIG_DEFAULTS.secondBrandColor,
      brandLogoUrl: this.brandLogoUrl.trim(),
      welcome: this.welcome.trim() || CONFIG_DEFAULTS.welcome,
      quickReplies: this.quickReplies().filter((q) => q.trim()),
      origins: this.origins().filter((o) => o.trim()),
      extraRules: this.extraRules.trim(), language: this.language,
      // Privacidad: default de Vectis si quedan vacíos
      privacyUrl: this.privacyUrl.trim() || CONFIG_DEFAULTS.privacyUrl,
      privacyText: this.privacyText.trim() || CONFIG_DEFAULTS.privacyText,
      // Handoff se gestiona en su propia página; aquí solo se preservan (no se guardan).
      handoffEnabled: this.handoffEnabled, telegramChatId: this.telegramChatId,
      telegramBotToken: '', telegramBotUsername: '',
    };
  }

  private loadConfig(c: ChatbotConfig): void {
    this.company = c.company; this.desc = c.desc; this.persona = c.persona;
    this.personaTouched = !!c.persona;  // ya tiene persona definida; no la sobreescribas
    this.info = c.info; this.hours = c.hours;
    this.contactName = c.contactName || ''; this.contactPhone = c.contactPhone || ''; this.contactEmail = c.contactEmail || ''; this.contactAddress = c.contactAddress || '';
    this.schedule.set(c.schedule?.length ? c.schedule.map((d) => ({ ...d })) : defaultSchedule());
    this.urlAgenda = c.urlAgenda; this.urlDoc = c.urlDoc; this.websiteUrl = c.websiteUrl || ''; this.inventoryUrl = c.inventoryUrl;
    this.kbText = c.kbText || ''; this.kbFileName = c.kbFileName || ''; this.kbFileUrl = c.kbFileUrl || '';
    this.inventoryText = c.inventoryText || ''; this.inventoryFileName = c.inventoryFileName || ''; this.inventoryFileUrl = c.inventoryFileUrl || '';
    this.kbErr.set(''); this.invErr.set('');
    this.faqs.set(c.faqs.length ? c.faqs.map((f) => ({ ...f })) : [{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }]);
    this.widgetTitle = c.widgetTitle; this.widgetPosition = c.widgetPosition === 'left' ? 'left' : 'right'; this.brandColor = c.brandColor;
    this.secondBrandColor = c.secondBrandColor; this.brandLogoUrl = c.brandLogoUrl; this.welcome = c.welcome;
    this.quickReplies.set(c.quickReplies.length ? [...c.quickReplies] : ['']);
    this.origins.set(c.origins.length ? [...c.origins] : (this.s.plan() === 'business' ? ['', ''] : ['']));
    this.extraRules = c.extraRules; this.language = c.language || 'auto'; this.privacyUrl = c.privacyUrl; this.privacyText = c.privacyText;
    this.handoffEnabled = !!c.handoffEnabled; this.telegramChatId = c.telegramChatId || '';
  }

  /** Volver al formulario para configurar otro chatbot (genera un nuevo client_id). */
  startNew(): void {
    this.dbId = '';
    this.company = ''; this.desc = ''; this.persona = ''; this.personaTouched = false; this.info = ''; this.hours = '';
    this.contactName = ''; this.contactPhone = ''; this.contactEmail = ''; this.contactAddress = '';
    this.schedule.set(defaultSchedule());
    this.urlAgenda = ''; this.urlDoc = ''; this.websiteUrl = ''; this.inventoryUrl = '';
    this.kbText = ''; this.kbFileName = ''; this.kbFileUrl = ''; this.inventoryText = ''; this.inventoryFileName = ''; this.inventoryFileUrl = '';
    this.kbErr.set(''); this.invErr.set('');
    this.faqs.set([{ q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' }]);
    this.widgetTitle = ''; this.widgetPosition = 'right'; this.brandColor = ''; this.secondBrandColor = ''; this.brandLogoUrl = ''; this.welcome = '';
    this.quickReplies.set(['']);
    this.origins.set(this.s.plan() === 'business' ? ['', ''] : ['']);
    this.extraRules = ''; this.language = 'auto'; this.privacyUrl = ''; this.privacyText = '';
    this.handoffEnabled = false; this.telegramChatId = '';
    this.openSection.set(0);
    this.tried.set([]);
    this.saved.set(false);
    this.saveErr.set('');
    this.returning.set(false);
    this.step.set('form');
  }

  async save(): Promise<void> {
    // Validar TODO lo requerido; si falta algo, marca y abre la primera sección incompleta.
    const firstBad = this.firstInvalid();
    if (firstBad < 4) {
      this.tried.set([0, 1, 2, 3]);
      this.openSection.set(firstBad);
      this.err.set(true);
      this.scrollToError();
      return;
    }
    this.err.set(false);
    this.saveErr.set('');
    const cfg = this.gatherConfig();
    const db = configToDb(cfg);
    this.saving.set(true);

    try {
      if (this.returning() && this.dbId) {
        const { error } = await this.sb.from('chatbots').update(db).eq('id', this.dbId);
        if (error) throw error;
        await this.auth.reload();
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      } else {
        const { data, error } = await this.sb.rpc('create_chatbot', { p: db });
        if (error) throw error;
        this.dbId = data as string;
        this.clientId = data as string;
        // Red de seguridad: guarda TODAS las columnas (por si create_chatbot no incluye las nuevas).
        try { await this.sb.from('chatbots').update(db).eq('id', this.dbId); } catch { /* noop */ }
        this.snippet = this.buildSnippet(this.clientId);
        await this.auth.reload();
        this.saving.set(false);
        this.returning.set(false);
        this.step.set('done');
      }
    } catch (e: any) {
      this.saving.set(false);
      this.saveErr.set(e?.message || 'No se pudo guardar. Intenta de nuevo.');
    }
  }

  async toggleActive(): Promise<void> {
    if (!this.dbId) return;
    const makeActive = !this.s.currentActive();
    this.statusErr.set('');
    if (makeActive) {
      if (this.s.cancelAtPeriodEnd()) {
        this.statusErr.set('Tu suscripción está cancelada. Adquiere un plan para activar chatbots.');
        return;
      }
      if (this.s.planExpired()) {
        this.statusErr.set('Tu plan está vencido. Renueva tu suscripción para activar chatbots.');
        return;
      }
      if (this.s.activeCount() >= this.s.maxActive()) {
        this.statusErr.set(`Ya tienes ${this.s.maxActive()} chatbot(s) activo(s) y tu plan ${this.s.planName()} no permite activar más. Desactiva otro o sube de plan.`);
        return;
      }
    }
    this.togglingStatus.set(true);
    const status = makeActive ? 'ACTIVE' : 'INACTIVE';
    const { error } = await this.sb.from('chatbots').update({ status }).eq('id', this.dbId);
    this.togglingStatus.set(false);
    if (error) { this.statusErr.set(error.message); return; }
    await this.auth.reload();
    this.reloadCurrent();
  }

  async deleteChatbot(): Promise<void> {
    if (!this.dbId) { this.confirmDelete.set(false); return; }
    this.deleting.set(true);
    const { error } = await this.sb.from('chatbots').update({ status: 'DELETED' }).eq('id', this.dbId);
    this.deleting.set(false);
    this.confirmDelete.set(false);
    if (error) { this.saveErr.set(error.message); return; }
    await this.auth.reload();
    if (this.s.companies().length > 0) {
      this.reloadCurrent();           // muestra el siguiente chatbot
    } else {
      this.startNew();                // sin chatbots: formulario en blanco para crear otro
    }
  }

  copy(): void {
    try {
      navigator.clipboard.writeText(this.snippet);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (e) { /* noop */ }
  }
}
