import { Component, ElementRef, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotAppHeaderComponent } from './app-header.component';
import { ChatbotSidebarComponent } from './sidebar.component';
import { ChatbotSessionService } from './session.service';
import { SupabaseClientService } from './supabase.client';

/** Colores por tipo de insight. */
const TYPE_COLOR: Record<string, string> = {
  pregunta: '#6aa6ff',
  interes_compra: '#36c08b',
  queja: '#e3624d',
  soporte: '#c98bff',
  agendar: '#E7AB2E',
  sin_respuesta: '#ef8a3c',
  otro: '#8a8f98',
};
const TYPE_ORDER = ['interes_compra', 'pregunta', 'agendar', 'soporte', 'queja', 'sin_respuesta', 'otro'];

/** /ai-chatbot/dashboard — métricas del MES ACTUAL (Supabase), con refresco automático. */
@Component({
  selector: 'app-chatbot-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ChatbotAppHeaderComponent, ChatbotSidebarComponent],
  template: `
    <div class="app-screen">
      <app-chatbot-app-header></app-chatbot-app-header>
      <div class="layout">
        <app-chatbot-sidebar></app-chatbot-sidebar>

        <main class="content">
          <div class="head">
            <h1 class="h1">{{ 'AICHATBOT.DASH.TITLE' | translate }} <span class="of">· {{ s.currentCompany() }}</span></h1>
            <div class="head-right">
              @if (canInsights()) {
                <select class="month-sel" [value]="selectedMonth()" (change)="onMonthChange($any($event.target).value)" [attr.aria-label]="'AICHATBOT.DASH.MONTH' | translate">
                  @for (m of monthOptions(); track m.value) { <option [value]="m.value">{{ m.label }}</option> }
                </select>
              } @else {
                <span class="period">{{ monthLabel() }}</span>
              }
              @if (isCurrentMonth()) {
                <span class="auto" [class.on]="!loading()" title="{{ 'AICHATBOT.DASH.AUTO' | translate }}">
                  <span class="adot"></span>{{ 'AICHATBOT.DASH.AUTO' | translate }}
                </span>
              }
            </div>
          </div>

          @if (s.subscriptionActive() && (s.overLimit() || !s.currentActive())) {
            <div class="dash-alert" role="status">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              <span>{{ (s.overLimit() ? 'AICHATBOT.DASH.OVER_LIMIT' : 'AICHATBOT.DASH.INACTIVE_BOT') | translate }}
                <a routerLink="/ai-chatbot/manage">{{ 'AICHATBOT.DASH.MANAGE_LINK' | translate }}</a>
              </span>
            </div>
          }

          @if (loading()) {
            <p class="muted">{{ 'AICHATBOT.DASH.LOADING' | translate }}</p>
          } @else {
            <!-- CHECKLIST DE CONFIGURACIÓN (se oculta al completarse) -->
            @if (setupPct() < 100) {
              <div class="setup">
                <div class="setup-head">
                  <span class="setup-ttl">{{ 'AICHATBOT.DASH.SETUP_TITLE' | translate }}</span>
                  <span class="setup-pct">{{ setupPct() }}%</span>
                </div>
                <div class="setup-bar"><span [style.width.%]="setupPct()"></span></div>
                <ul class="setup-list">
                  @for (st of setupSteps(); track st.key) {
                    <li [class.on]="st.done">
                      <span class="sck" aria-hidden="true">@if (st.done) { <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> }</span>
                      {{ ('AICHATBOT.DASH.SETUP.' + st.key) | translate }}
                    </li>
                  }
                </ul>
                <a class="setup-cta" routerLink="/ai-chatbot/configure">{{ 'AICHATBOT.DASH.SETUP_CTA' | translate }}</a>
              </div>
            }

            <!-- TARJETAS -->
            <div class="stats">
              <div class="stat">
                <div class="cap">{{ 'AICHATBOT.DASH.CONVERSATIONS' | translate }}</div>
                <div class="n">{{ conversations() }}</div>
                @if (activeNow() > 0 && isCurrentMonth()) {
                  <div class="live"><span class="pulse"></span>{{ activeNow() }} {{ 'AICHATBOT.DASH.ACTIVE_NOW' | translate }}</div>
                } @else if (canInsights() && deltaConv(); as dt) {
                  <div class="delta" [class.up]="dt.up" [class.down]="dt.down" [title]="'AICHATBOT.DASH.VS_PREV' | translate">{{ dt.up ? '▲' : (dt.down ? '▼' : '–') }} {{ dt.d > 0 ? '+' : '' }}{{ dt.d }}</div>
                } @else {
                  <div class="sub">{{ 'AICHATBOT.DASH.THIS_MONTH' | translate }}</div>
                }
              </div>
              <div class="stat">
                <div class="cap">{{ 'AICHATBOT.DASH.MESSAGES' | translate }}</div>
                <div class="n">{{ messages() }}<span class="lim"> / {{ limit() }}</span></div>
                <div class="ubar"><span [style.width.%]="usagePct()"></span></div>
                @if (canInsights() && deltaMsg(); as dt) {
                  <div class="delta" [class.up]="dt.up" [class.down]="dt.down" [title]="'AICHATBOT.DASH.VS_PREV' | translate">{{ dt.up ? '▲' : (dt.down ? '▼' : '–') }} {{ dt.d > 0 ? '+' : '' }}{{ dt.d }}</div>
                }
              </div>
              <div class="stat">
                <div class="cap">{{ 'AICHATBOT.DASH.LEADS' | translate }}</div>
                <div class="n">{{ leads() }}</div>
                @if (canInsights() && deltaLeads(); as dt) {
                  <div class="delta" [class.up]="dt.up" [class.down]="dt.down" [title]="'AICHATBOT.DASH.VS_PREV' | translate">{{ dt.up ? '▲' : (dt.down ? '▼' : '–') }} {{ dt.d > 0 ? '+' : '' }}{{ dt.d }}</div>
                } @else {
                  <div class="sub">{{ 'AICHATBOT.DASH.THIS_MONTH' | translate }}</div>
                }
              </div>
              @if (handoffOn()) {
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.HANDOFF_CHATS' | translate }}</div>
                  <div class="n">{{ handoffChats() }}</div>
                  @if (handoffLive() > 0 && isCurrentMonth()) {
                    <div class="live"><span class="pulse"></span>{{ handoffLive() }} {{ 'AICHATBOT.DASH.AGENT_LIVE' | translate }}</div>
                  } @else {
                    <div class="sub">{{ 'AICHATBOT.DASH.HANDOFF_HINT' | translate }}</div>
                  }
                </div>
                @if (canInsights()) {
                  <div class="stat">
                    <div class="cap">{{ 'AICHATBOT.DASH.HO_RESP' | translate }}</div>
                    <div class="n">{{ hoRespText() }}</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.HO_RESP_HINT' | translate }}</div>
                  </div>
                  <div class="stat">
                    <div class="cap">{{ 'AICHATBOT.DASH.HO_PEAK' | translate }}</div>
                    <div class="n">{{ hoPeakHour() || '—' }}</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.HO_PEAK_HINT' | translate }}</div>
                  </div>
                }
              }
              @if (canInsights()) {
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.INSIGHTS' | translate }}</div>
                  <div class="n">{{ insights() }}</div>
                  @if (deltaInsights(); as dt) {
                    <div class="delta" [class.up]="dt.up" [class.down]="dt.down" [title]="'AICHATBOT.DASH.VS_PREV' | translate">{{ dt.up ? '▲' : (dt.down ? '▼' : '–') }} {{ dt.d > 0 ? '+' : '' }}{{ dt.d }}</div>
                  } @else {
                    <div class="sub">{{ 'AICHATBOT.DASH.THIS_MONTH' | translate }}</div>
                  }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.AVG_MSGS' | translate }}</div>
                  @if (avgMsgs() !== null) {
                    <div class="n">{{ avgMsgs() }}</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.AVG_MSGS_HINT' | translate }}</div>
                  } @else { <div class="n muted-n">—</div><div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div> }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.LEAD_RATE' | translate }}</div>
                  @if (leadRate() !== null) {
                    <div class="n">{{ leadRate() }}<span class="lim">%</span></div>
                    <div class="sub">{{ 'AICHATBOT.DASH.LEAD_RATE_HINT' | translate }}</div>
                  } @else { <div class="n muted-n">—</div><div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div> }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.PEAK_HOUR' | translate }}</div>
                  @if (peakHour() !== null) {
                    <div class="n">{{ peakHour() }}<span class="lim">:00</span></div>
                    <div class="sub">{{ 'AICHATBOT.DASH.PEAK_HOUR_HINT' | translate }}</div>
                  } @else { <div class="n muted-n">—</div><div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div> }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.PEAK_DAY' | translate }}</div>
                  @if (peakDayName() !== null) {
                    <div class="n n-day">{{ peakDayName() }}</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.PEAK_DAY_HINT' | translate }}</div>
                  } @else { <div class="n muted-n">—</div><div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div> }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.CSAT' | translate }}</div>
                  @if (csatTotal() > 0) {
                    <div class="n">{{ csatPct() }}<span class="lim">%</span></div>
                    <div class="sub">{{ csatTotal() }} {{ 'AICHATBOT.DASH.CSAT_VOTES' | translate }}</div>
                  } @else {
                    <div class="n muted-n">—</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div>
                  }
                </div>
                <div class="stat">
                  <div class="cap">{{ 'AICHATBOT.DASH.RESOLUTION' | translate }}</div>
                  @if (resolution() !== null) {
                    <div class="n">{{ resolution() }}<span class="lim">%</span></div>
                    <div class="sub">{{ 'AICHATBOT.DASH.RESOLUTION_HINT' | translate }}</div>
                  } @else {
                    <div class="n muted-n">—</div>
                    <div class="sub">{{ 'AICHATBOT.DASH.NO_DATA' | translate }}</div>
                  }
                </div>
              }
            </div>

            <!-- GRÁFICOS -->
            <div class="charts">
              @if (canInsights()) {
                <div class="card pad">
                  <h3>{{ 'AICHATBOT.DASH.BY_TYPE' | translate }}</h3>
                  @if (byType().length) {
                    <div class="bars">
                      @for (t of byType(); track t.type) {
                        <div class="bar-row">
                          <span class="bl">{{ ('AICHATBOT.DASH.TYPE.' + t.type) | translate }}</span>
                          <div class="bt"><span [style.width.%]="t.pct" [style.background]="t.color"></span></div>
                          <span class="bn">{{ t.n }}</span>
                        </div>
                      }
                    </div>
                  } @else { <p class="muted">{{ 'AICHATBOT.DASH.EMPTY_INSIGHTS' | translate }}</p> }
                </div>

                <div class="card pad">
                  <h3>{{ 'AICHATBOT.DASH.TRENDING' | translate }}</h3>
                  @if (byTopic().length) {
                    <div class="bars">
                      @for (t of byTopic(); track t.topic) {
                        <div class="bar-row">
                          <span class="bl" [title]="t.topic">{{ t.topic }}</span>
                          <div class="bt"><span [style.width.%]="t.pct" class="bt-gold"></span></div>
                          <span class="bn">{{ t.n }}</span>
                        </div>
                      }
                    </div>
                  } @else { <p class="muted">{{ 'AICHATBOT.DASH.EMPTY_INSIGHTS' | translate }}</p> }
                </div>
              }

              <div class="card pad">
                <h3>{{ 'AICHATBOT.DASH.BY_DAY' | translate }} <span class="h3sub">{{ 'AICHATBOT.DASH.DAY_AXIS' | translate }}</span></h3>
                @if (daily().length) {
                  <div class="cols-scroll">
                    <div class="cols" [attr.aria-label]="'AICHATBOT.DASH.BY_DAY' | translate">
                      @for (d of daily(); track d.day) {
                        <div class="col">
                          <span class="col-n">{{ d.n }}</span>
                          <div class="col-bar" [style.height.%]="d.h"></div>
                          <span class="col-x">{{ d.day }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  <div class="axis-cap">{{ 'AICHATBOT.DASH.DAY_AXIS_FULL' | translate }}</div>
                } @else { <p class="muted">{{ 'AICHATBOT.DASH.EMPTY_CONV' | translate }}</p> }
              </div>
            </div>

            <!-- INSIGHTS RECIENTES (solo Pro/Business) -->
            @if (canInsights()) {
            <div class="card pad">
              <div class="card-h">
                <h3>{{ 'AICHATBOT.DASH.RECENT_INSIGHTS' | translate }}</h3>
                <div class="card-actions">
                  <select class="type-sel" [value]="insightType()" (change)="onInsightType($any($event.target).value)" [attr.aria-label]="'AICHATBOT.DASH.FILTER_TYPE' | translate">
                    <option value="">{{ 'AICHATBOT.DASH.ALL_TYPES' | translate }}</option>
                    @for (t of insightTypeOptions; track t) {
                      <option [value]="t">{{ ('AICHATBOT.DASH.TYPE.' + t) | translate }}</option>
                    }
                  </select>
                  @if (insights() > 0) {
                    <button class="exp" type="button" (click)="exportInsights()">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      {{ 'AICHATBOT.DASH.EXPORT_CSV' | translate }}
                    </button>
                  }
                </div>
              </div>
              @if (recentInsights().length) {
                <div class="tbl">
                  <table>
                    <thead><tr><th>{{ 'AICHATBOT.DASH.COL_DATE' | translate }}</th><th>{{ 'AICHATBOT.DASH.COL_TYPE' | translate }}</th><th>{{ 'AICHATBOT.DASH.COL_SUMMARY' | translate }}</th></tr></thead>
                    <tbody>
                      @for (it of recentInsights(); track $index) {
                        <tr>
                          <td>{{ fmt(it.created_at) }}</td>
                          <td><span class="tag" [style.background]="typeColor(it.type)">{{ ('AICHATBOT.DASH.TYPE.' + it.type) | translate }}</span></td>
                          <td class="note">{{ it.summary || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else { <p class="muted">{{ 'AICHATBOT.DASH.EMPTY_INSIGHTS' | translate }}</p> }
            </div>
            }

            <!-- LEADS RECIENTES -->
            <div class="card pad">
              <div class="card-h">
                <h3>{{ 'AICHATBOT.DASH.RECENT_LEADS' | translate }}</h3>
                @if (canInsights() && leads() > 0) {
                  <button class="exp" type="button" (click)="exportLeads()">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    {{ 'AICHATBOT.DASH.EXPORT_CSV' | translate }}
                  </button>
                }
              </div>
              @if (recentLeads().length) {
                <div class="tbl">
                  <table>
                    <thead><tr><th>{{ 'AICHATBOT.DASH.COL_DATE' | translate }}</th><th>{{ 'AICHATBOT.DASH.COL_NAME' | translate }}</th><th>{{ 'AICHATBOT.DASH.COL_CONTACT' | translate }}</th><th>{{ 'AICHATBOT.DASH.COL_INTEREST' | translate }}</th></tr></thead>
                    <tbody>
                      @for (l of recentLeads(); track $index) {
                        <tr><td>{{ fmt(l.created_at) }}</td><td>{{ l.name || '—' }}</td><td>{{ l.email || l.phone || '—' }}</td><td class="note">{{ l.note || '—' }}</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else { <p class="muted">{{ 'AICHATBOT.DASH.EMPTY_LEADS' | translate }}</p> }
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-screen { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; overflow: hidden; background: var(--ink); color: var(--text-inv); }
    .layout { flex: 1; display: flex; min-height: 0; }
    .content { flex: 1; min-width: 0; overflow-y: auto; padding: 28px clamp(18px, 4vw, 40px); }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
    .h1 { font-size: 30px; }
    .h1 .of { font-size: 16px; font-weight: 500; color: var(--text-inv-2); }
    .head-right { display: flex; align-items: center; gap: 12px; padding-top: 8px; }
    .period { font-size: 13px; font-weight: 700; text-transform: capitalize; color: var(--ink); background: var(--gold); padding: 5px 12px; border-radius: 999px; }
    .auto { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-inv-2); }
    .auto .adot { width: 7px; height: 7px; border-radius: 50%; background: #555; }
    .auto.on .adot { background: #36c08b; box-shadow: 0 0 0 0 rgba(54,192,139,.6); animation: dpulse 2s infinite; }
    @keyframes dpulse { 0% { box-shadow: 0 0 0 0 rgba(54,192,139,.5); } 70% { box-shadow: 0 0 0 7px rgba(54,192,139,0); } 100% { box-shadow: 0 0 0 0 rgba(54,192,139,0); } }
    .muted { color: var(--text-inv-2); font-size: 14px; margin: 8px 0; }
    .dash-alert { display: flex; align-items: center; gap: 10px; margin: 0 0 22px; padding: 12px 16px; font-size: 13.5px; font-weight: 600;
      color: #ffd9d9; background: rgba(214,69,69,.12); border: 1px solid rgba(214,69,69,.4); border-radius: var(--radius-md); }
    .dash-alert > svg { color: #ff8a8a; flex-shrink: 0; }
    .dash-alert a { color: #fff; font-weight: 700; text-decoration: underline; margin-left: 4px; }

    .card-actions { display: flex; align-items: center; gap: 10px; }
    .type-sel { padding: 7px 10px; border-radius: var(--radius-md); border: 1px solid var(--line-light); background: rgba(255,255,255,.04); color: var(--text-inv); font: inherit; font-size: 12.5px; outline: none; cursor: pointer; }
    .type-sel:focus { border-color: var(--gold-bright); }
    .setup { background: var(--ink-soft); border: 1px solid rgba(231,171,46,.3); border-radius: var(--radius-lg); padding: 18px 20px; margin-bottom: 16px; }
    .setup-head { display: flex; align-items: center; justify-content: space-between; }
    .setup-ttl { font-weight: 700; font-size: 15px; }
    .setup-pct { font-weight: 800; color: var(--gold-bright); }
    .setup-bar { height: 7px; border-radius: 999px; background: rgba(255,255,255,.08); margin: 12px 0 14px; overflow: hidden; }
    .setup-bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold-soft), var(--gold-bright)); transition: width .5s var(--ease); }
    .setup-list { list-style: none; padding: 0; margin: 0 0 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px 18px; }
    .setup-list li { display: flex; align-items: center; gap: 9px; font-size: 13.5px; color: var(--text-inv-2); }
    .setup-list li.on { color: var(--text-inv); }
    .setup-list .sck { display: inline-grid; place-items: center; width: 19px; height: 19px; border-radius: 50%; flex-shrink: 0; border: 1px solid var(--line-light); color: var(--ink); }
    .setup-list li.on .sck { background: var(--gold-bright); border-color: var(--gold-bright); }
    .setup-cta { display: inline-block; font-size: 13px; font-weight: 700; color: var(--gold-bright); }
    .setup-cta:hover { text-decoration: underline; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 16px; }
    .stat { background: var(--ink-card); border: 1px solid var(--line-light); border-radius: var(--radius-md); padding: 18px; }
    .cap { font-size: 12.5px; color: var(--text-inv-2); }
    .stat .n { font-size: 30px; font-weight: 800; margin-top: 6px; line-height: 1.1; }
    .stat .n .lim { font-size: 16px; font-weight: 600; color: var(--text-inv-2); }
    .stat .sub { margin-top: 8px; font-size: 11.5px; color: var(--text-inv-2); }
    .stat .n.n-day { font-size: 22px; text-transform: capitalize; }
    .delta { margin-top: 8px; display: inline-block; font-size: 12px; font-weight: 700; color: var(--text-inv-2); }
    .delta.up { color: #46d39a; } .delta.down { color: #ff8a8a; }
    .month-sel { background: var(--ink-card); color: var(--text-inv); border: 1px solid var(--line-light); border-radius: 999px;
      padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; text-transform: capitalize; }
    .month-sel:focus { outline: none; border-color: var(--gold); }
    .live { margin-top: 8px; display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: #46d39a; }
    .live .pulse { width: 8px; height: 8px; border-radius: 50%; background: #36c08b; box-shadow: 0 0 0 0 rgba(54,192,139,.7); animation: dpulse 1.6s infinite; }
    .ubar { margin-top: 10px; height: 7px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
    .ubar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold-soft), var(--gold-bright)); transition: width .4s ease; }

    .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .card { background: var(--ink-card); border: 1px solid var(--line-light); border-radius: var(--radius-md); margin-bottom: 18px; }
    .pad { padding: 18px; }
    .card h3 { font-size: 15px; margin-bottom: 16px; }
    .h3sub { font-size: 12px; font-weight: 500; color: var(--text-inv-2); }
    .card-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
    .card-h h3 { margin-bottom: 0; }
    .exp { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-inv); background: rgba(255,255,255,.05); border: 1px solid var(--line-light); border-radius: 999px; padding: 7px 13px; cursor: pointer; transition: background .15s, border-color .15s; }
    .exp:hover { background: var(--gold); color: var(--ink); border-color: var(--gold); }

    .bars { display: grid; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 110px 1fr 32px; align-items: center; gap: 10px; }
    .bar-row .bl { font-size: 12.5px; color: var(--text-inv-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-row .bt { height: 12px; border-radius: 999px; background: rgba(255,255,255,.07); overflow: hidden; }
    .bar-row .bt span { display: block; height: 100%; border-radius: 999px; transition: width .5s ease; }
    .bar-row .bt .bt-gold { background: linear-gradient(90deg, var(--gold-soft), var(--gold-bright)); }
    .stat .n.muted-n { color: var(--text-inv-2); }
    .bar-row .bn { font-size: 13px; font-weight: 800; text-align: right; }

    .cols-scroll { overflow-x: auto; padding-bottom: 4px; }
    .cols-scroll::-webkit-scrollbar { height: 7px; }
    .cols-scroll::-webkit-scrollbar-thumb { background: var(--line-light); border-radius: 999px; }
    .cols { display: flex; align-items: flex-end; gap: 7px; height: 180px; padding-top: 18px; min-width: min-content; }
    .col { min-width: 26px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
    .col-n { font-size: 10px; font-weight: 800; color: var(--text-inv); margin-bottom: 3px; }
    .col-bar { width: 16px; min-height: 3px; border-radius: 4px 4px 0 0; background: linear-gradient(180deg, var(--gold-bright), var(--gold-soft)); transition: height .5s ease; }
    .col-x { margin-top: 6px; font-size: 10px; font-weight: 600; color: var(--text-inv-2); }
    .axis-cap { text-align: center; font-size: 11px; color: var(--text-inv-2); margin-top: 8px; }

    .tbl { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line-light); vertical-align: top; }
    th { color: var(--text-inv-2); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    td.note { color: var(--text-inv-2); max-width: 360px; }
    .tag { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #0b0b0b; white-space: nowrap; }

    @media (max-width: 980px) { .charts { grid-template-columns: 1fr; } }
    @media (max-width: 860px) { .layout { flex-direction: column; } .stats { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) {
      .content { padding: 20px 15px; }
      .h1 { font-size: 24px; }
      .h1 .of { font-size: 14px; }
      .head { margin-bottom: 16px; gap: 10px; }
      .head-right { padding-top: 0; flex-wrap: wrap; }
      .card-actions, .card-h, .setup-head { flex-wrap: wrap; }
      .bar-row { grid-template-columns: 84px 1fr 28px; gap: 8px; }
      .pad { padding: 15px; }
      .stat { padding: 15px; }
      .stat .n { font-size: 26px; }
    }
    @media (max-width: 460px) { .stats { grid-template-columns: 1fr; } }
  `],
})
export class ChatbotDashboardComponent implements OnInit, OnDestroy {
  private title = inject(Title);
  private sb = inject(SupabaseClientService).client;
  private i18n = inject(TranslateService);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly s = inject(ChatbotSessionService);

  loading = signal(true);
  private stats = signal<any>(null);
  recentLeads = signal<any[]>([]);
  recentInsights = signal<any[]>([]);

  conversations = computed(() => this.stats()?.conversations ?? 0);
  messages = computed(() => this.stats()?.messages ?? 0);
  leads = computed(() => this.stats()?.leads ?? 0);
  insights = computed(() => this.stats()?.insights ?? 0);
  activeNow = computed(() => this.stats()?.active_now ?? 0);
  // Checklist de configuración (progreso de puesta en marcha)
  readonly setupSteps = computed(() => {
    const c = this.s.currentConfig();
    const conv = this.conversations();
    return [
      { key: 'INFO', done: !!(c && (c.info || '').trim()) },
      { key: 'KNOW', done: !!(c && (((c.kbText || '').trim()) || ((c.urlDoc || '').trim()) || ((c.websiteUrl || '').trim()) || ((c.inventoryUrl || '').trim()) || ((c.inventoryText || '').trim()))) },
      { key: 'LOOK', done: !!(c && (((c.brandColor || '').trim()) || ((c.brandLogoUrl || '').trim()) || ((c.welcome || '').trim()))) },
      { key: 'FAQ', done: !!(c && Array.isArray(c.faqs) && c.faqs.filter((f) => f.q && f.a).length > 0) },
      { key: 'LIVE', done: conv > 0 },
    ];
  });
  readonly setupPct = computed(() => { const s = this.setupSteps(); return Math.round(s.filter((x) => x.done).length / s.length * 100); });

  // Handoff (solo si está habilitado para este chatbot)
  readonly handoffOn = computed(() => !!this.s.currentConfig()?.handoffEnabled);
  readonly handoffChats = signal(0);
  readonly handoffLive = signal(0);
  // Métricas de handoff (Pro+): tiempo de respuesta y hora pico de atención.
  readonly hoAvgSec = signal<number | null>(null);
  readonly hoPeakHour = signal<string>('');
  readonly hoRespText = computed(() => {
    const s = this.hoAvgSec();
    if (s === null) return '—';
    if (s < 60) return Math.round(s) + 's';
    const m = Math.floor(s / 60); const sec = Math.round(s % 60);
    return m + 'm' + (sec ? ' ' + sec + 's' : '');
  });
  limit = computed(() => this.stats()?.limit ?? 1000);
  // Los insights con IA son función de Pro/Business (Basic no los ve).
  canInsights = computed(() => this.s.plan() !== 'basic');
  // Analítica avanzada (Pro/Business).
  csatTotal = computed(() => this.stats()?.csat_total ?? 0);
  csatPct = computed(() => { const t = this.csatTotal(); return t ? Math.round((this.stats()?.csat_pos ?? 0) / t * 100) : null; });
  resolution = computed<number | null>(() => { const r = this.stats()?.resolution_rate; return (r === null || r === undefined) ? null : Number(r); });
  byTopic = computed(() => {
    const arr: Array<{ topic: string; n: number }> = this.stats()?.by_topic ?? [];
    const max = Math.max(1, ...arr.map((x) => x.n));
    return arr.map((x) => ({ ...x, pct: Math.round((x.n / max) * 100) }));
  });
  usagePct = computed(() => Math.min(100, Math.round((this.messages() / Math.max(1, this.limit())) * 100)));

  // --- Selector de mes (Pro/Business) ---
  selectedMonth = signal<string>(this.curMonth());
  private prevStats = signal<any>(null);
  private curMonth(): string { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'); }
  isCurrentMonth = computed(() => this.selectedMonth() === this.curMonth());
  monthOptions = computed(() => {
    const loc = this.i18n.currentLang === 'en' ? 'en-US' : 'es-ES';
    const n = new Date();
    const out: Array<{ value: string; label: string }> = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      out.push({ value: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString(loc, { month: 'long', year: 'numeric' }) });
    }
    return out;
  });

  // --- Métricas extra (Pro/Business) ---
  avgMsgs = computed<number | null>(() => { const v = this.stats()?.avg_msgs; return (v === null || v === undefined) ? null : Number(v); });
  leadRate = computed<number | null>(() => { const v = this.stats()?.lead_rate; return (v === null || v === undefined) ? null : Number(v); });
  peakHour = computed<string | null>(() => { const h = this.stats()?.peak_hour; return (h === null || h === undefined || h === '') ? null : String(h); });
  peakDayName = computed<string | null>(() => {
    const d = this.stats()?.peak_dow;
    if (d === null || d === undefined) return null;
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return this.i18n.instant('AICHATBOT.DASH.DOW.' + keys[Number(d)]);
  });

  // --- Comparación vs mes anterior ---
  private delta(curr: number | null, prev: number | null): { d: number; up: boolean; down: boolean } | null {
    if (curr === null || prev === null || prev === undefined) return null;
    const d = curr - prev;
    return { d, up: d > 0, down: d < 0 };
  }
  deltaConv = computed(() => this.delta(this.conversations(), this.prevStats()?.conversations ?? null));
  deltaMsg = computed(() => this.delta(this.messages(), this.prevStats()?.messages ?? null));
  deltaLeads = computed(() => this.delta(this.leads(), this.prevStats()?.leads ?? null));
  deltaInsights = computed(() => this.delta(this.insights(), this.prevStats()?.insights ?? null));

  onMonthChange(v: string): void { this.selectedMonth.set(v); this.load(false); }
  readonly insightType = signal<string>('');
  readonly insightTypeOptions = ['pregunta', 'interes_compra', 'agendar', 'soporte', 'queja', 'sin_respuesta', 'otro'];
  onInsightType(v: string): void { this.insightType.set(v); this.load(true); }
  private monthRange(m: string): { start: string; end: string } {
    const [y, mm] = m.split('-').map(Number);
    return { start: new Date(y, mm - 1, 1).toISOString(), end: new Date(y, mm, 1).toISOString() };
  }
  private prevMonthOf(m: string): string {
    const [y, mm] = m.split('-').map(Number);
    const d = new Date(y, mm - 2, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  byType = computed(() => {
    const arr: Array<{ type: string; n: number }> = this.stats()?.by_type ?? [];
    const max = Math.max(1, ...arr.map((x) => x.n));
    return [...arr]
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
      .map((x) => ({ ...x, pct: Math.round((x.n / max) * 100), color: TYPE_COLOR[x.type] || TYPE_COLOR['otro'] }));
  });
  daily = computed(() => {
    const arr: Array<{ day: string; n: number }> = this.stats()?.daily ?? [];
    const max = Math.max(1, ...arr.map((x) => x.n));
    // h = alto de la barra (deja espacio arriba para el número).
    return arr.map((x) => ({ ...x, h: x.n ? Math.max(6, Math.round((x.n / max) * 82)) : 0 }));
  });
  monthLabel = computed(() => {
    const m = this.stats()?.month as string | undefined;
    const d = m ? new Date(m + '-01T12:00:00') : new Date();
    const loc = this.i18n.currentLang === 'en' ? 'en-US' : 'es-ES';
    return d.toLocaleDateString(loc, { month: 'long', year: 'numeric' });
  });

  private timer: any = null;
  private onFocus = () => this.load(true);

  constructor() {
    // Recarga al cambiar de chatbot desde el header (con spinner).
    effect(() => { this.s.current(); queueMicrotask(() => this.load(false)); });
  }

  ngOnInit(): void {
    this.title.setTitle('Dashboard — Vectis AI ChatBot');
    // Refresco automático cada 15 s + al volver a la pestaña.
    this.timer = setInterval(() => { if (!document.hidden) this.load(true); }, 15000);
    document.addEventListener('visibilitychange', this.onFocus);
    window.addEventListener('focus', this.onFocus);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.onFocus);
    window.removeEventListener('focus', this.onFocus);
  }

  typeColor(t: string): string { return TYPE_COLOR[t] || TYPE_COLOR['otro']; }

  fmt(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /** silent = true no muestra spinner (refrescos automáticos). */
  private async load(silent: boolean): Promise<void> {
    const id = this.s.currentClientId();
    if (!id) { this.loading.set(false); return; }
    if (!silent) this.loading.set(true);
    const month = this.selectedMonth();
    const range = this.monthRange(month);
    let insQ = this.sb.from('chatbot_insights').select('type,summary,created_at').eq('chatbot_id', id).gte('created_at', range.start).lt('created_at', range.end).order('created_at', { ascending: false }).limit(this.insightType() ? 40 : 8);
    if (this.insightType()) insQ = insQ.eq('type', this.insightType());
    try {
      const [st, rl, ri] = await Promise.all([
        this.sb.rpc('chatbot_dashboard_stats', { p_client_id: id, p_month: month }),
        this.sb.from('chatbot_leads').select('name,email,phone,note,created_at').eq('chatbot_id', id).gte('created_at', range.start).lt('created_at', range.end).order('created_at', { ascending: false }).limit(8),
        insQ,
      ]);
      if (st.data) this.stats.set(st.data as any);
      this.recentLeads.set((rl.data as any[]) ?? []);
      this.recentInsights.set((ri.data as any[]) ?? []);
      // Handoff: chats con agente del mes + en vivo ahora (solo si está habilitado).
      if (this.handoffOn()) { this.loadHandoff(id, range); if (this.canInsights()) this.loadHandoffTiming(id, range); }
      else { this.handoffChats.set(0); this.handoffLive.set(0); this.hoAvgSec.set(null); this.hoPeakHour.set(''); }
      // Mes anterior para comparar (solo Pro/Business).
      if (this.canInsights()) {
        const sp = await this.sb.rpc('chatbot_dashboard_stats', { p_client_id: id, p_month: this.prevMonthOf(month) });
        this.prevStats.set((sp.data as any) ?? null);
      } else {
        this.prevStats.set(null);
      }
    } catch { /* noop */ }
    this.loading.set(false);
    if (!silent) setTimeout(() => this.scrollDailyToToday(), 80);   // al abrir/cambiar bot, muestra los días recientes
  }

  /** Cuenta los chats que hablaron con un agente (mes) y los que están en vivo ahora. */
  private async loadHandoff(id: string, range: { start: string; end: string }): Promise<void> {
    try {
      const total = await this.sb.from('handoff_sessions').select('session_id', { count: 'exact', head: true })
        .eq('chatbot_id', id).gte('updated_at', range.start).lt('updated_at', range.end);
      this.handoffChats.set(total.count ?? 0);
      const liveSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const live = await this.sb.from('handoff_sessions').select('session_id', { count: 'exact', head: true })
        .eq('chatbot_id', id).eq('active', true).gte('updated_at', liveSince);
      this.handoffLive.set(live.count ?? 0);
    } catch (e) { this.handoffChats.set(0); this.handoffLive.set(0); }
  }

  /** Tiempo de respuesta promedio del agente + hora pico (Pro+). Calcula desde handoff_events. */
  private async loadHandoffTiming(id: string, range: { start: string; end: string }): Promise<void> {
    try {
      const { data } = await this.sb.from('handoff_events').select('session_id,direction,created_at')
        .eq('chatbot_id', id).gte('created_at', range.start).lt('created_at', range.end)
        .order('created_at', { ascending: true }).limit(4000);
      const evs = (data as any[]) ?? [];
      const pendingIn: Record<string, number> = {};
      const gaps: number[] = [];
      const byHour = new Array(24).fill(0);
      for (const e of evs) {
        const t = new Date(e.created_at).getTime();
        if (e.direction === 'in') {
          if (pendingIn[e.session_id] === undefined) pendingIn[e.session_id] = t;   // primer 'in' sin responder
          byHour[new Date(e.created_at).getHours()]++;
        } else if (e.direction === 'out') {
          const inT = pendingIn[e.session_id];
          if (inT !== undefined) { const g = (t - inT) / 1000; if (g > 0 && g < 86400) gaps.push(g); delete pendingIn[e.session_id]; }
        }
      }
      this.hoAvgSec.set(gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null);
      let peak = -1, peakN = 0;
      for (let h = 0; h < 24; h++) { if (byHour[h] > peakN) { peakN = byHour[h]; peak = h; } }
      this.hoPeakHour.set(peak >= 0 ? (peak < 10 ? '0' + peak : '' + peak) + ':00' : '');
    } catch (e) { this.hoAvgSec.set(null); this.hoPeakHour.set(''); }
  }

  /** Lleva el scroll de la gráfica de días al final (día más reciente / actual). */
  private scrollDailyToToday(): void {
    const c = this.host.nativeElement.querySelector('.cols-scroll') as HTMLElement | null;
    if (c) c.scrollLeft = c.scrollWidth;
  }

  // ── Exportación a CSV (solo Pro/Business) ──
  async exportLeads(): Promise<void> {
    const id = this.s.currentClientId(); if (!id) return;
    const r = this.monthRange(this.selectedMonth());
    const { data } = await this.sb.from('chatbot_leads')
      .select('created_at,name,email,phone,note').eq('chatbot_id', id)
      .gte('created_at', r.start).lt('created_at', r.end).order('created_at', { ascending: false }).limit(5000);
    const rows = (data as any[] ?? []).map((l) => [this.fmt(l.created_at), l.name, l.email, l.phone, l.note]);
    this.downloadCsv('leads', ['Fecha', 'Nombre', 'Email', 'Telefono', 'Nota'], rows);
  }

  async exportInsights(): Promise<void> {
    const id = this.s.currentClientId(); if (!id) return;
    const r = this.monthRange(this.selectedMonth());
    let q = this.sb.from('chatbot_insights')
      .select('created_at,type,summary').eq('chatbot_id', id)
      .gte('created_at', r.start).lt('created_at', r.end).order('created_at', { ascending: false }).limit(5000);
    if (this.insightType()) q = q.eq('type', this.insightType());
    const { data } = await q;
    const rows = (data as any[] ?? []).map((i) => [this.fmt(i.created_at), this.i18n.instant('AICHATBOT.DASH.TYPE.' + i.type), i.summary]);
    this.downloadCsv('insights', ['Fecha', 'Tipo', 'Resumen'], rows);
  }

  private downloadCsv(name: string, headers: string[], rows: any[][]): void {
    const esc = (v: any) => { const s = (v == null ? '' : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '-' + this.s.currentCompany().replace(/\s+/g, '_') + '-' + (this.stats()?.month || '') + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
